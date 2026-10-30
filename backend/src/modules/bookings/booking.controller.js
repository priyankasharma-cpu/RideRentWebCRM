import {
  quoteBooking,
  reserveWebsiteBooking,
  lookupBooking,
  getBooking,
  cancelBooking,
  rescheduleBooking,
  listBookings,
  reserveManualBooking,
} from './booking.service.js';
export function quoteBookingController(db) {
  return async function quoteBookingHandler(req, res) {
    const input = {
      body: req.validated?.body ?? req.body,
      query: req.query,
      params: req.params,
      user: req.user,
      session: req.session,
      bookingToken: req.get('x-booking-token'),
      file: req.file,
    };
    const result = await quoteBooking(db, input);
    res.status(200).json(result);
  };
}
export function reserveWebsiteBookingController(db) {
  return async function reserveWebsiteBookingHandler(req, res) {
    const input = {
      body: req.validated?.body ?? req.body,
      query: req.query,
      params: req.params,
      user: req.user,
      session: req.session,
      bookingToken: req.get('x-booking-token'),
      file: req.file,
    };
    const result = await reserveWebsiteBooking(db, input);
    res.status(201).json(result);
  };
}
export function lookupBookingController(db) {
  return async function lookupBookingHandler(req, res) {
    const input = {
      body: req.validated?.body ?? req.body,
      query: req.query,
      params: req.params,
      user: req.user,
      session: req.session,
      bookingToken: req.get('x-booking-token'),
      file: req.file,
    };
    const result = await lookupBooking(db, input);
    res.status(200).json(result);
  };
}
export function getBookingController(db) {
  return async function getBookingHandler(req, res) {
    const input = {
      body: req.validated?.body ?? req.body,
      query: req.query,
      params: req.params,
      user: req.user,
      session: req.session,
      bookingToken: req.get('x-booking-token'),
      file: req.file,
    };
    const result = await getBooking(db, input);
    res.status(200).json(result);
  };
}
export function cancelBookingController(db) {
  return async function cancelBookingHandler(req, res) {
    const input = {
      body: req.validated?.body ?? req.body,
      query: req.query,
      params: req.params,
      user: req.user,
      session: req.session,
      bookingToken: req.get('x-booking-token'),
      file: req.file,
    };
    const result = await cancelBooking(db, input);
    res.status(200).json(result);
  };
}
export function rescheduleBookingController(db) {
  return async function rescheduleBookingHandler(req, res) {
    const input = {
      body: req.validated?.body ?? req.body,
      query: req.query,
      params: req.params,
      user: req.user,
      session: req.session,
      bookingToken: req.get('x-booking-token'),
      file: req.file,
    };
    const result = await rescheduleBooking(db, input);
    res.status(200).json(result);
  };
}
export function listBookingsController(db) {
  return async function listBookingsHandler(req, res) {
    const input = {
      body: req.validated?.body ?? req.body,
      query: req.query,
      params: req.params,
      user: req.user,
      session: req.session,
      bookingToken: req.get('x-booking-token'),
      file: req.file,
    };
    const result = await listBookings(db, input);
    res.status(200).json(result);
  };
}
export function reserveManualBookingController(db) {
  return async function reserveManualBookingHandler(req, res) {
    const input = {
      body: req.validated?.body ?? req.body,
      query: req.query,
      params: req.params,
      user: req.user,
      session: req.session,
      bookingToken: req.get('x-booking-token'),
      file: req.file,
    };
    const result = await reserveManualBooking(db, input);
    res.status(201).json(result);
  };
}
