import { all, get, run } from '../../config/database.js';
export const inquiriesInstalled = async (db) =>
  Boolean(
    await get(db, "SELECT name FROM sqlite_master WHERE type='table' AND name='contact_inquiries'"),
  );
export const findSubmission = (db, key) =>
  get(db, 'SELECT * FROM contact_inquiries WHERE submission_key=?', key);
export const findInquiry = (db, id) => get(db, 'SELECT * FROM contact_inquiries WHERE id=?', id);
export const insertInquiry = (db, record, input, time) =>
  run(
    db,
    "INSERT INTO contact_inquiries(id,submission_key,name,email,phone,inquiry_type,message,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,'new',?,?)",
    record,
    input.submissionKey,
    input.name,
    input.email,
    input.phone,
    input.inquiryType,
    input.message,
    time,
    time,
  );
export async function listInquiries(db, status, offset) {
  const where = status === 'all' ? '' : ' WHERE status=?';
  const parameters = status === 'all' ? [] : [status];
  const [items, count] = await Promise.all([
    all(
      db,
      'SELECT id,name,email,phone,inquiry_type,message,status,created_at,updated_at FROM contact_inquiries' +
        where +
        ' ORDER BY created_at DESC,id DESC LIMIT 50 OFFSET ?',
      ...parameters,
      offset,
    ),
    get(db, 'SELECT COUNT(*) total FROM contact_inquiries' + where, ...parameters),
  ]);
  return { items, total: count.total, limit: 50, offset };
}
export const updateInquiryStatus = (db, id, status, time) =>
  run(db, 'UPDATE contact_inquiries SET status=?,updated_at=? WHERE id=?', status, time, id);
