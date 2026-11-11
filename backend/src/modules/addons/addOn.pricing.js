import { fail } from '../../utils/ApiError.js';
import { integerMoney, taxAmount } from '../../utils/money.js';
import { id } from '../../utils/crypto.js';
import { settings } from '../settings/settings.service.js';
import { publicAddOns } from './addOn.service.js';
import { insertAllocation } from './addOn.repository.js';

export async function quoteAddOns(db, period, vehicles, input) {
  const options = await publicAddOns(db, period);
  const requested = new Map();
  for (const item of input.addOns || []) {
    if (requested.has(item.addOnId))
      fail(400, 'Choose each add-on once and use its quantity control.');
    requested.set(item.addOnId, item.quantity);
  }
  const helmet = options.find((option) => option.code === 'helmet');
  if (input.helmets) {
    if (!helmet) fail(409, 'Helmet charges and stock have not been configured by the shop.');
    if (requested.has(helmet.id)) fail(400, 'Choose helmets once using either helmets or addOns.');
    requested.set(helmet.id, input.helmets);
  }
  for (const key of requested.keys())
    if (!options.some((option) => option.id === key))
      fail(409, 'A selected add-on is disabled, archived or unavailable. Refresh your selection.');
  const taxBps = (await settings(db)).taxBps;
  const charges = [];
  for (const option of options) {
    const eligible = vehicles.filter((vehicle) =>
      option.categories.some((rule) => rule.category === vehicle.category),
    );
    const paidQuantity = requested.get(option.id) || 0;
    const includedQuantity = eligible.reduce(
      (sum, vehicle) =>
        sum +
        vehicle.quantity *
          option.categories.find((rule) => rule.category === vehicle.category).includedQuantity,
      0,
    );
    const quantity = paidQuantity + includedQuantity;
    if (!quantity) continue;
    if (!eligible.length) fail(400, `${option.name} requires an eligible vehicle category.`);
    if (quantity > option.maxQuantity)
      fail(
        409,
        `${option.name}: maximum ${option.maxQuantity} units per checkout, including ${includedQuantity} included units.`,
      );
    if (quantity > option.available)
      fail(409, `Not enough ${option.name} stock available for these dates.`);
    const base = integerMoney(
      Math.round(paidQuantity * option.rate * (option.billing === 'hour' ? period.hours : 1)),
    );
    charges.push({
      id: option.id,
      code: option.code,
      name: option.name,
      quantity,
      paidQuantity,
      includedQuantity,
      rate: option.rate,
      billing: option.billing,
      base,
      tax: taxAmount(base, taxBps),
      version: option.version,
      categories: option.categories,
    });
  }
  return charges;
}

export async function reserveAddOnAllocations(db, charges, bookings) {
  for (const charge of charges) {
    let extraAssigned = false;
    for (const booking of bookings) {
      const rule = charge.categories.find((rule) => rule.category === booking.category);
      if (!rule) continue;
      const paidQuantity = extraAssigned ? 0 : charge.paidQuantity;
      extraAssigned = true;
      const quantity = rule.includedQuantity + paidQuantity;
      if (!quantity) continue;
      await insertAllocation(db, {
        id: id(),
        addonId: charge.id,
        bookingId: booking.id,
        quantity,
        includedQuantity: rule.includedQuantity,
        name: charge.name,
        rate: charge.rate,
        billing: charge.billing,
        base: paidQuantity ? charge.base : 0,
        tax: paidQuantity ? charge.tax : 0,
        version: charge.version,
      });
    }
  }
}
