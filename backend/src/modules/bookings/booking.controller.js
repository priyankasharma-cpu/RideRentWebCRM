import {
  quoteBooking,
  reserveWebsiteBooking,
  getBooking,
  cancelBooking,
  rescheduleBooking,
  listBookings,
  reserveManualBooking,
} from './booking.service.js';
import {
  createCustomerAccessSession,
  accessTablesInstalled,
  requestBookingOtp,
  verifyBookingOtp,
} from './customerAccess.service.js';
import { fail } from '../../utils/ApiError.js';

function controllerInput(req) {
  return {
    body: req.validated?.body ?? req.body,
    query: req.query,
    params: req.params,
    user: req.user,
    session: req.session,
    customerAccess: req.customerAccess,
    file: req.file,
  };
}

function setCustomerAccessCookie(res, session) {
  res.cookie('rr_customer_access', session.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: session.expiresAt - Date.now(),
    path: '/',
  });
}

export const requestBookingOtpController = (db, options) => async (req, res) => {
  const { dispatch, ...result } = await requestBookingOtp(db, req.validated.body, {
    ...options,
    deferDelivery: true,
  });
  res.set('Cache-Control', 'no-store').status(202).json(result);
  if (dispatch) setImmediate(dispatch);
};

export const verifyBookingOtpController = (db) => async (req, res) => {
  const session = await verifyBookingOtp(db, req.validated.body);
  setCustomerAccessCookie(res, session);
  res.set('Cache-Control', 'no-store').json({ bookingId: session.bookingIds[0] });
};

export function quoteBookingController(db) {
  return async (req, res) => res.status(200).json(await quoteBooking(db, controllerInput(req)));
}

export function reserveWebsiteBookingController(db) {
  return async (req, res) => {
    if (!(await accessTablesInstalled(db)))
      fail(
        503,
        'Customer verification is not installed. Apply migration 0008_customer_access_security.',
      );
    const result = await reserveWebsiteBooking(db, controllerInput(req));
    const session = await createCustomerAccessSession(db, result.booking.customer_id, [
      result.booking.id,
    ]);
    setCustomerAccessCookie(res, session);
    res.status(201).json({ booking: result.booking });
  };
}

export function getBookingController(db) {
  return async (req, res) => res.status(200).json(await getBooking(db, controllerInput(req)));
}

export function cancelBookingController(db) {
  return async (req, res) => res.status(200).json(await cancelBooking(db, controllerInput(req)));
}

export function rescheduleBookingController(db) {
  return async (req, res) =>
    res.status(200).json(await rescheduleBooking(db, controllerInput(req)));
}

export function listBookingsController(db) {
  return async (req, res) => res.status(200).json(await listBookings(db, controllerInput(req)));
}

export function reserveManualBookingController(db) {
  return async (req, res) =>
    res.status(201).json(await reserveManualBooking(db, controllerInput(req)));
}
