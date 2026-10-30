import { getShopSettings, updateShopSettings } from './settings.service.js';
export function getShopSettingsController(db) {
  return async function getShopSettingsHandler(req, res) {
    const input = {
      body: req.validated?.body ?? req.body,
      query: req.query,
      params: req.params,
      user: req.user,
      session: req.session,
      bookingToken: req.get('x-booking-token'),
      file: req.file,
    };
    const result = await getShopSettings(db, input);
    res.status(200).json(result);
  };
}
export function updateShopSettingsController(db) {
  return async function updateShopSettingsHandler(req, res) {
    const input = {
      body: req.validated?.body ?? req.body,
      query: req.query,
      params: req.params,
      user: req.user,
      session: req.session,
      bookingToken: req.get('x-booking-token'),
      file: req.file,
    };
    const result = await updateShopSettings(db, input);
    res.status(200).json(result);
  };
}
