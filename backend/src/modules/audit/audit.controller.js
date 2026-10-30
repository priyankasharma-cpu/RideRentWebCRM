import { listAudit } from './audit.service.js';
export function listAuditController(db) {
  return async function listAuditHandler(req, res) {
    const input = {
      body: req.validated?.body ?? req.body,
      query: req.query,
      params: req.params,
      user: req.user,
      session: req.session,
      bookingToken: req.get('x-booking-token'),
      file: req.file,
    };
    const result = await listAudit(db, input);
    res.status(200).json(result);
  };
}
