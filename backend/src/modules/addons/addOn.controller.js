import { managedAddOns, createAddOn, editAddOn, archiveAddOn } from './addOn.service.js';

export const listAddOnsController = (db) => async (_req, res) => res.json(await managedAddOns(db));
export const createAddOnController = (db) => async (req, res) =>
  res.status(201).json(await createAddOn(db, req.validated.body, req.user));
export const editAddOnController = (db) => async (req, res) =>
  res.json(await editAddOn(db, req.params.id, req.validated.body, req.user));
export const archiveAddOnController = (db) => async (req, res) =>
  res.json(await archiveAddOn(db, req.params.id, req.validated.body, req.user));
