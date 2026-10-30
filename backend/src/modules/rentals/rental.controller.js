import { pickUpRental, returnRental, completeRental } from './rental.service.js';
export function pickUpRentalController(db) {
  return async function pickUpRentalHandler(req, res) {
    const input = {
      body: req.validated?.body ?? req.body,
      query: req.query,
      params: req.params,
      user: req.user,
      session: req.session,
      bookingToken: req.get('x-booking-token'),
      file: req.file,
    };
    const result = await pickUpRental(db, input);
    res.status(200).json(result);
  };
}
export function returnRentalController(db) {
  return async function returnRentalHandler(req, res) {
    const input = {
      body: req.validated?.body ?? req.body,
      query: req.query,
      params: req.params,
      user: req.user,
      session: req.session,
      bookingToken: req.get('x-booking-token'),
      file: req.file,
    };
    const result = await returnRental(db, input);
    res.status(200).json(result);
  };
}
export function completeRentalController(db) {
  return async function completeRentalHandler(req, res) {
    const input = {
      body: req.validated?.body ?? req.body,
      query: req.query,
      params: req.params,
      user: req.user,
      session: req.session,
      bookingToken: req.get('x-booking-token'),
      file: req.file,
    };
    const result = await completeRental(db, input);
    res.status(200).json(result);
  };
}
