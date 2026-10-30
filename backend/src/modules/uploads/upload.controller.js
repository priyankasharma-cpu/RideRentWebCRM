import { uploadVehicleImage } from './upload.service.js';
export function uploadVehicleImageController(db) {
  return async function uploadVehicleImageHandler(req, res) {
    const input = {
      body: req.validated?.body ?? req.body,
      query: req.query,
      params: req.params,
      user: req.user,
      session: req.session,
      bookingToken: req.get('x-booking-token'),
      file: req.file,
    };
    const result = await uploadVehicleImage(db, input);
    res.status(201).json(result);
  };
}
