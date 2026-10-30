import { getDashboard } from './analytics.service.js';
export function getDashboardController(db) {
  return async function getDashboardHandler(req, res) {
    const input = {
      body: req.validated?.body ?? req.body,
      query: req.query,
      params: req.params,
      user: req.user,
      session: req.session,
      bookingToken: req.get('x-booking-token'),
      file: req.file,
    };
    const result = await getDashboard(db, input);
    res.status(200).json(result);
  };
}
