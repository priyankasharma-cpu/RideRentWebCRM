import { submitInquiry, getInquiries, markInquiry } from './contact.service.js';
export const createContactController = (db) => async (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.status(201).json(await submitInquiry(db, req.validated.body));
};
export const listContactController = (db) => async (req, res) =>
  res.json(await getInquiries(db, req.validated.query));
export const updateContactController = (db) => async (req, res) =>
  res.json(await markInquiry(db, req.params.id, req.validated.body.status, req.user.id));
