import { listStaff, addStaff, changeStaffAccess, changePassword } from './staff.service.js';
export function listStaffController(db) {
  return async function listStaffHandler(req, res) {
    const input = {
      body: req.validated?.body ?? req.body,
      query: req.query,
      params: req.params,
      user: req.user,
      session: req.session,
      bookingToken: req.get('x-booking-token'),
      file: req.file,
    };
    const result = await listStaff(db, input);
    res.status(200).json(result);
  };
}
export function addStaffController(db) {
  return async function addStaffHandler(req, res) {
    const input = {
      body: req.validated?.body ?? req.body,
      query: req.query,
      params: req.params,
      user: req.user,
      session: req.session,
      bookingToken: req.get('x-booking-token'),
      file: req.file,
    };
    const result = await addStaff(db, input);
    res.status(201).json(result);
  };
}
export function changeStaffAccessController(db) {
  return async function changeStaffAccessHandler(req, res) {
    const input = {
      body: req.validated?.body ?? req.body,
      query: req.query,
      params: req.params,
      user: req.user,
      session: req.session,
      bookingToken: req.get('x-booking-token'),
      file: req.file,
    };
    const result = await changeStaffAccess(db, input);
    res.status(200).json(result);
  };
}
export function changePasswordController(db) {
  return async function changePasswordHandler(req, res) {
    const input = {
      body: req.validated?.body ?? req.body,
      query: req.query,
      params: req.params,
      user: req.user,
      session: req.session,
      bookingToken: req.get('x-booking-token'),
      file: req.file,
    };
    const result = await changePassword(db, input);
    res.status(200).json(result);
  };
}
