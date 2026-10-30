import {
  listPublicVehicles,
  getPublicVehicle,
  listManagedVehicles,
  addVehicle,
  editVehicle,
} from './vehicle.service.js';
export function listPublicVehiclesController(db) {
  return async function listPublicVehiclesHandler(req, res) {
    const input = {
      body: req.validated?.body ?? req.body,
      query: req.query,
      params: req.params,
      user: req.user,
      session: req.session,
      bookingToken: req.get('x-booking-token'),
      file: req.file,
    };
    const result = await listPublicVehicles(db, input);
    res.status(200).json(result);
  };
}
export function getPublicVehicleController(db) {
  return async function getPublicVehicleHandler(req, res) {
    const input = {
      body: req.validated?.body ?? req.body,
      query: req.query,
      params: req.params,
      user: req.user,
      session: req.session,
      bookingToken: req.get('x-booking-token'),
      file: req.file,
    };
    const result = await getPublicVehicle(db, input);
    res.status(200).json(result);
  };
}
export function listManagedVehiclesController(db) {
  return async function listManagedVehiclesHandler(req, res) {
    const input = {
      body: req.validated?.body ?? req.body,
      query: req.query,
      params: req.params,
      user: req.user,
      session: req.session,
      bookingToken: req.get('x-booking-token'),
      file: req.file,
    };
    const result = await listManagedVehicles(db, input);
    res.status(200).json(result);
  };
}
export function addVehicleController(db) {
  return async function addVehicleHandler(req, res) {
    const input = {
      body: req.validated?.body ?? req.body,
      query: req.query,
      params: req.params,
      user: req.user,
      session: req.session,
      bookingToken: req.get('x-booking-token'),
      file: req.file,
    };
    const result = await addVehicle(db, input);
    res.status(201).json(result);
  };
}
export function editVehicleController(db) {
  return async function editVehicleHandler(req, res) {
    const input = {
      body: req.validated?.body ?? req.body,
      query: req.query,
      params: req.params,
      user: req.user,
      session: req.session,
      bookingToken: req.get('x-booking-token'),
      file: req.file,
    };
    const result = await editVehicle(db, input);
    res.status(200).json(result);
  };
}
