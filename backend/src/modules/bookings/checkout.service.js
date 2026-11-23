import { createHash } from 'node:crypto';
import { queryGroup, withTransaction } from '../../config/mongoDatabase.js';
import { fail } from '../../utils/ApiError.js';
import { hash, id } from '../../utils/crypto.js';
import { now } from '../../utils/dateTime.js';
import { integerMoney } from '../../utils/money.js';
import { rentalWindow } from '../availability/rentalWindow.service.js';
import {
  listFleetReservations,
  listFleetServiceBlocks,
} from '../availability/availability.repository.js';
import { assessAvailability } from '../availability/availability.rules.js';
import { publicAddOns } from '../addons/addOn.service.js';
import { quoteAddOns, reserveAddOnAllocations } from '../addons/addOn.pricing.js';
import { price } from './pricing.service.js';
import { createBooking } from './booking.service.js';
import { bookingView } from './booking.read.service.js';
import { checkoutQuoteInput, checkoutReservationInput } from './checkout.validation.js';
import {
  checkoutInstalled,
  checkoutVehicles,
  previousCheckout,
  saveCheckout,
  saveCheckoutItem,
  orderBookingIds,
} from './checkout.repository.js';

// Only identical catalogue specifications share stock; similar names are never merged.
const modelKey = (v) =>
  createHash('sha256')
    .update(
      JSON.stringify([
        v.brand,
        v.name,
        v.category,
        v.engine,
        v.fuel,
        v.transmission,
        v.seats,
        v.rate,
        v.deposit,
      ]),
    )
    .digest('hex');
async function requireInstallation(db) {
  if (!(await checkoutInstalled(db)))
    fail(
      503,
      'Checkout upgrade is not installed. Ask the operator to apply migration 0006_checkout_orders.',
    );
}
async function inventory(db, period) {
  const vehicles = await checkoutVehicles(db);
  const vehicleIds = vehicles.map((vehicle) => vehicle.id);
  const [reservations, maintenance] = await queryGroup(db, [
    () => listFleetReservations(db, vehicleIds),
    () => listFleetServiceBlocks(db, vehicleIds),
  ]);
  const reservationsByVehicle = new Map();
  const maintenanceByVehicle = new Map();
  for (const booking of reservations) {
    const records = reservationsByVehicle.get(booking.vehicle_id) || [];
    records.push(booking);
    reservationsByVehicle.set(booking.vehicle_id, records);
  }
  for (const block of maintenance) {
    const records = maintenanceByVehicle.get(block.vehicle_id) || [];
    records.push(block);
    maintenanceByVehicle.set(block.vehicle_id, records);
  }

  const groups = new Map();
  for (const vehicle of vehicles) {
    const key = modelKey(vehicle);
    if (!groups.has(key)) groups.set(key, { key, vehicle, units: [], available: [] });
    const group = groups.get(key);
    group.units.push(vehicle);
    if (
      assessAvailability(
        vehicle,
        reservationsByVehicle.get(vehicle.id) || [],
        maintenanceByVehicle.get(vehicle.id) || [],
        period.start,
        period.end,
      ).available
    )
      group.available.push(vehicle);
  }
  return [...groups.values()];
}
export async function checkoutCatalog(db, input) {
  await requireInstallation(db);
  const period = await rentalWindow(db, input);
  const groups = await inventory(db, period);
  const addOns = await publicAddOns(db, period);
  const helmet = addOns.find((option) => option.code === 'helmet');
  return {
    models: groups.map(({ key, vehicle, units, available }) => ({
      key,
      vehicleId: vehicle.id,
      unitIds: units.map((v) => v.id),
      name: vehicle.name,
      category: vehicle.category,
      image: vehicle.image,
      rate: vehicle.rate,
      available: available.length,
    })),
    addOns,
    helmets: helmet
      ? { ...helmet, enabled: true }
      : {
          enabled: false,
          rate: null,
          billing: null,
          stock: 0,
          available: 0,
          maxQuantity: 0,
          categories: [],
        },
  };
}
async function calculate(db, input) {
  await requireInstallation(db);
  if (input.items.reduce((sum, item) => sum + item.quantity, 0) > 50)
    fail(400, 'A checkout can reserve up to 50 vehicles. Contact the shop for larger groups.');
  const period = await rentalWindow(db, input);
  const groups = await inventory(db, period);
  const used = new Set();
  const lines = [];
  const unitPrices = [];
  for (const item of input.items) {
    const group = groups.find((g) => g.units.some((v) => v.id === item.vehicleId));
    if (!group) fail(404, 'Selected vehicle no longer exists.');
    if (used.has(group.key)) fail(400, 'Use the quantity control for repeated models.');
    used.add(group.key);
    if (item.quantity > group.available.length)
      fail(409, `${group.vehicle.name}: only ${group.available.length} available for these dates.`);
    // Keep the clicked physical unit when available, then allocate other identical units.
    const units = [...group.available]
      .sort((a, b) => Number(b.id === item.vehicleId) - Number(a.id === item.vehicleId))
      .slice(0, item.quantity);
    const quotes = [];
    for (const unit of units) {
      const unitPrice = await price(db, unit, period);
      quotes.push(unitPrice);
      unitPrices.push({ vehicleId: unit.id, price: unitPrice });
    }
    lines.push({
      vehicleId: item.vehicleId,
      name: group.vehicle.name,
      category: group.vehicle.category,
      quantity: item.quantity,
      unitIds: units.map((v) => v.id),
      rate: group.vehicle.rate,
      base: quotes.reduce((s, q) => s + q.base, 0),
      tax: quotes.reduce((s, q) => s + q.tax, 0),
      deposit: quotes.reduce((s, q) => s + q.deposit, 0),
    });
  }
  const addOns = await quoteAddOns(db, period, lines, input);
  const helmet = addOns.find((option) => option.code === 'helmet');
  const helmetCharge = helmet
    ? { ...helmet, quantity: helmet.paidQuantity, totalQuantity: helmet.quantity }
    : { quantity: 0, includedQuantity: 0, base: 0, tax: 0, rate: null, billing: null };
  const base = integerMoney(lines.reduce((s, l) => s + l.base, 0));
  const tax = integerMoney(
    lines.reduce((s, l) => s + l.tax, 0) + addOns.reduce((sum, line) => sum + line.tax, 0),
  );
  const deposit = integerMoney(lines.reduce((s, l) => s + l.deposit, 0));
  const quoted = {
    available: true,
    hours: period.hours,
    lines,
    helmets: helmetCharge,
    addOns,
    base,
    tax,
    deposit,
    total: integerMoney(base + addOns.reduce((sum, line) => sum + line.base, 0) + tax + deposit),
  };
  return {
    ...quoted,
    signature: hash(JSON.stringify(quoted)),
    _verified: { period, unitPrices },
  };
}
export const quoteCheckout = (db, raw) =>
  withTransaction(db, async () => {
    const quote = await calculate(db, checkoutQuoteInput.parse(raw));
    delete quote._verified;
    return quote;
  });
export async function reserveCheckout(db, raw) {
  const input = checkoutReservationInput.parse(raw);
  const fingerprint = hash(
    JSON.stringify({ ...input, submissionKey: undefined, reservationToken: undefined }),
  );
  return withTransaction(db, async () => {
    await requireInstallation(db);
    const existing = await previousCheckout(db, input.submissionKey);
    if (existing) {
      if (
        existing.input_hash !== fingerprint ||
        existing.access_hash !== hash(input.reservationToken)
      )
        fail(409, 'This checkout attempt was already used. Refresh and review your booking.');
      const entries = await orderBookingIds(db, existing.id);
      const bookings = await queryGroup(
        db,
        entries.map((row) => async () => ({ booking: await bookingView(db, row.booking_id) })),
      );
      return { bookings };
    }
    const quote = await calculate(db, input);
    if (quote.total !== input.expectedTotal)
      fail(409, 'The price changed. Please refresh the quote before confirming.');
    if (input.quoteSignature && input.quoteSignature !== quote.signature)
      fail(409, 'The booking options changed. Review the refreshed quote before confirming.');
    const orderId = id();
    await saveCheckout(db, {
      id: orderId,
      key: input.submissionKey,
      inputHash: fingerprint,
      accessHash: hash(input.reservationToken),
      createdAt: now(),
    });
    const ids = [];
    const allocations = [];
    for (const line of quote.lines) {
      for (const vehicleId of line.unitIds) {
        const verifiedPrice = quote._verified.unitPrices.find(
          (item) => item.vehicleId === vehicleId,
        );
        const result = await createBooking(
          db,
          {
            ...input,
            vehicleId,
            source: 'Website',
            verified: false,
          },
          null,
          {
            reserveAddOns: false,
            verifiedReservation: {
              period: quote._verified.period,
              price: verifiedPrice.price,
            },
          },
        );
        await saveCheckoutItem(db, orderId, result.booking.id);
        ids.push(result.booking.id);
        allocations.push({ id: result.booking.id, category: line.category });
      }
    }
    await reserveAddOnAllocations(db, quote.addOns, allocations);
    const bookings = await queryGroup(
      db,
      ids.map((bookingId) => async () => ({ booking: await bookingView(db, bookingId) })),
    );
    return { bookings };
  });
}
