import { recordPayment, refundPayment, listPayments } from './payment.service.js';
export function recordPaymentController(db) {
  return async function recordPaymentHandler(req, res) {
    const input = {
      body: req.validated?.body ?? req.body,
      query: req.query,
      params: req.params,
      user: req.user,
      session: req.session,
      bookingToken: req.get('x-booking-token'),
      file: req.file,
    };
    const result = await recordPayment(db, input);
    res.status(200).json(result);
  };
}
export function refundPaymentController(db) {
  return async function refundPaymentHandler(req, res) {
    const input = {
      body: req.validated?.body ?? req.body,
      query: req.query,
      params: req.params,
      user: req.user,
      session: req.session,
      bookingToken: req.get('x-booking-token'),
      file: req.file,
    };
    const result = await refundPayment(db, input);
    res.status(200).json(result);
  };
}
export function listPaymentsController(db) {
  return async function listPaymentsHandler(req, res) {
    const input = {
      body: req.validated?.body ?? req.body,
      query: req.query,
      params: req.params,
      user: req.user,
      session: req.session,
      bookingToken: req.get('x-booking-token'),
      file: req.file,
    };
    const result = await listPayments(db, input);
    res.status(200).json(result);
  };
}
