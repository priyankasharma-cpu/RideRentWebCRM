import { listMaintenance, scheduleMaintenance, resolveMaintenance } from './maintenance.service.js';
export function listMaintenanceController(db) {
  return async function listMaintenanceHandler(req, res) {
    const input = {
      body: req.validated?.body ?? req.body,
      query: req.query,
      params: req.params,
      user: req.user,
      session: req.session,
      bookingToken: req.get('x-booking-token'),
      file: req.file,
    };
    const result = await listMaintenance(db, input);
    res.status(200).json(result);
  };
}
export function scheduleMaintenanceController(db) {
  return async function scheduleMaintenanceHandler(req, res) {
    const input = {
      body: req.validated?.body ?? req.body,
      query: req.query,
      params: req.params,
      user: req.user,
      session: req.session,
      bookingToken: req.get('x-booking-token'),
      file: req.file,
    };
    const result = await scheduleMaintenance(db, input);
    res.status(201).json(result);
  };
}
export function resolveMaintenanceController(db) {
  return async function resolveMaintenanceHandler(req, res) {
    const input = {
      body: req.validated?.body ?? req.body,
      query: req.query,
      params: req.params,
      user: req.user,
      session: req.session,
      bookingToken: req.get('x-booking-token'),
      file: req.file,
    };
    const result = await resolveMaintenance(db, input);
    res.status(200).json(result);
  };
}
