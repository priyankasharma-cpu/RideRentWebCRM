import { listCustomers, verifyCustomer } from './customer.service.js';
export function listCustomersController(db) {
  return async function listCustomersHandler(req, res) {
    const input = {
      body: req.validated?.body ?? req.body,
      query: req.query,
      params: req.params,
      user: req.user,
      session: req.session,
      bookingToken: req.get('x-booking-token'),
      file: req.file,
    };
    const result = await listCustomers(db, input);
    res.status(200).json(result);
  };
}
export function verifyCustomerController(db) {
  return async function verifyCustomerHandler(req, res) {
    const input = {
      body: req.validated?.body ?? req.body,
      query: req.query,
      params: req.params,
      user: req.user,
      session: req.session,
      bookingToken: req.get('x-booking-token'),
      file: req.file,
    };
    const result = await verifyCustomer(db, input);
    res.status(200).json(result);
  };
}
