import { rentalWindow } from '../availability/rentalWindow.service.js';
import {
  findVehicleByIdVariant2,
  findBookingByReferenceAndPhone,
  updateBookingByAccessHashAndId,
  findBookingById,
  updateBookingById,
  findCustomerByPhone,
  insertCustomer,
  updateCustomerByNameAndEmailAndVerified,
  insertBooking,
  insertBookingContact,
  updateBookingByStartsAtAndEndsAtAndHours,
} from './booking.repository.js';
import { z } from 'zod';
import { fail } from '../../utils/ApiError.js';
import { price } from './pricing.service.js';
import { availability } from '../availability/availability.service.js';
import { phone } from '../../utils/phone.js';
import { randomBytes } from 'node:crypto';
import { hash, id } from '../../utils/crypto.js';
import { bookingView, listBookingViews } from './booking.read.service.js';
import { canAccess } from './bookingAccess.service.js';
import { transaction } from '../../config/database.js';
import { settings } from '../settings/settings.service.js';
import { audit } from '../audit/audit.service.js';
import { bookingSchema } from './booking.validation.js';
import { now } from '../../utils/dateTime.js';
export async function quoteBooking(db, request) {
  const w = await rentalWindow(db, request.body),
    v = await findVehicleByIdVariant2(db, z.string().uuid().parse(request.body.vehicleId));
  if (!v) fail(404, 'Vehicle not found.');
  return {
    ...(await price(db, v, w)),
    ...(await availability(db, v.id, w.start, w.end)),
  };
}
export async function reserveWebsiteBooking(db, request) {
  return await createBooking(db, {
    ...request.body,
    source: 'Website',
    verified: false,
  });
}
export async function lookupBooking(db, request) {
  const input = request.body;
  const b = await findBookingByReferenceAndPhone(
    db,
    input.reference.trim().toUpperCase(),
    phone(input.phone),
  );
  if (!b) fail(404, 'No booking matches those details.');
  const token = randomBytes(32).toString('hex');
  await updateBookingByAccessHashAndId(db, hash(token), b.id);
  return {
    booking: await bookingView(db, b),
    token,
  };
}
export async function getBooking(db, request) {
  const b = await findBookingById(db, request.params.id);
  if (!b) fail(404, 'Booking not found.');
  canAccess(request, b);
  return await bookingView(db, b);
}
export async function cancelBooking(db, request) {
  await transaction(db, async () => {
    const b = await findBookingById(db, request.params.id);
    if (!b) fail(404, 'Booking not found.');
    canAccess(request, b);
    if (b.status !== 'confirmed') fail(409, 'Only confirmed bookings can be cancelled.');
    if (
      !request.user &&
      new Date(b.starts_at) - Date.now() < (await settings(db)).cancellationHours * 3600000
    )
      fail(409, 'Please call the shop for cancellations close to pickup.');
    await updateBookingById(db, b.id);
    await audit(db, request.user?.id, 'booking.cancelled', b.id);
  });
  return await bookingView(db, request.params.id);
}
export async function rescheduleBooking(db, request) {
  const b = await findBookingById(db, request.params.id);
  if (!b) fail(404, 'Booking not found.');
  canAccess(request, b);
  if (
    !request.user &&
    new Date(b.starts_at) - Date.now() < (await settings(db)).cancellationHours * 3600000
  )
    fail(409, 'Please call the shop to reschedule close to pickup.');
  return await reschedule(db, b.id, request.body, request.user);
}
export async function listBookings(db, _request) {
  return (await listBookingViews(db)).sort((first, second) =>
    second.created_at.localeCompare(first.created_at),
  );
}
export async function reserveManualBooking(db, request) {
  return await createBooking(db, request.body, request.user);
}
export async function createBooking(db, raw, user = null) {
  const input = bookingSchema.parse(raw);
  if (!user && input.source !== 'Website')
    fail(403, 'Only staff can create phone or walk-in bookings.');
  return await transaction(db, async () => {
    const w = await rentalWindow(db, input),
      v = await findVehicleByIdVariant2(db, input.vehicleId);
    if (!v) fail(404, 'Vehicle not found.');
    const a = await availability(db, v.id, w.start, w.end);
    if (!a.available) fail(409, a.reason);
    const p = await price(db, v, w);
    let customer = await findCustomerByPhone(db, input.phone);
    if (!customer) {
      customer = {
        id: id(),
      };
      await insertCustomer(
        db,
        customer.id,
        input.name,
        input.phone,
        input.email,
        user && input.verified ? 1 : 0,
        now(),
      );
    } else if (user) {
      await updateCustomerByNameAndEmailAndVerified(
        db,
        input.name,
        input.email,
        input.verified ? 1 : customer.verified,
        customer.id,
      );
    }
    const booking = id(),
      reference = 'RR-' + randomBytes(6).toString('hex').toUpperCase(),
      token = randomBytes(32).toString('hex');
    await insertBooking(
      db,
      booking,
      reference,
      hash(token),
      customer.id,
      v.id,
      w.start,
      w.end,
      p.hours,
      p.rate,
      p.base,
      p.tax,
      p.deposit,
      0,
      'confirmed',
      user ? input.source : 'Website',
      input.notes,
      now(),
    );
    await insertBookingContact(
      db,
      booking,
      input.name,
      input.phone,
      input.email,
      user && input.verified ? 1 : 0,
    );
    await audit(db, user?.id, 'booking.created', booking, {
      source: input.source,
    });
    return {
      booking: await bookingView(db, booking),
      token,
    };
  });
}
export async function reschedule(db, booking, input, user) {
  return await transaction(db, async () => {
    const b = await findBookingById(db, booking);
    if (!b) fail(404, 'Booking not found.');
    if (b.status !== 'confirmed') fail(409, 'Only confirmed bookings can be rescheduled.');
    const w = await rentalWindow(db, input);
    const a = await availability(db, b.vehicle_id, w.start, w.end, b.id);
    if (!a.available) fail(409, a.reason);
    const p = await price(
      db,
      {
        rate: b.rate,
        deposit: b.deposit,
      },
      w,
    );
    if ((await bookingView(db, b)).rentalPaid > p.base + p.tax)
      fail(
        409,
        'This shorter schedule would overpay the rental. Cancel, refund and rebook through the shop instead.',
      );
    await updateBookingByStartsAtAndEndsAtAndHours(
      db,
      w.start,
      w.end,
      p.hours,
      p.base,
      p.tax,
      b.id,
    );
    await audit(db, user?.id, 'booking.rescheduled', b.id, {
      start: w.start,
      end: w.end,
    });
    return await bookingView(db, b.id);
  });
}
