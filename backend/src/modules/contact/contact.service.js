import { transaction } from '../../config/database.js';
import { fail } from '../../utils/ApiError.js';
import { id } from '../../utils/crypto.js';
import { now } from '../../utils/dateTime.js';
import { audit } from '../audit/audit.service.js';
import {
  inquiriesInstalled,
  findSubmission,
  insertInquiry,
  listInquiries,
  findInquiry,
  updateInquiryStatus,
} from './contact.repository.js';
async function requireStorage(db) {
  if (!(await inquiriesInstalled(db)))
    fail(503, 'Online messages are temporarily unavailable. Please call the shop.');
}
export async function submitInquiry(db, input) {
  await requireStorage(db);
  return transaction(db, async () => {
    const existing = await findSubmission(db, input.submissionKey);
    if (existing) {
      if (
        existing.name !== input.name ||
        existing.email !== input.email ||
        existing.phone !== input.phone ||
        existing.inquiry_type !== input.inquiryType ||
        existing.message !== input.message
      )
        fail(
          409,
          'This request was already used. Refresh the page before sending a different message.',
        );
      return { id: existing.id };
    }
    const record = id();
    await insertInquiry(db, record, input, now());
    return { id: record };
  });
}
export async function getInquiries(db, input) {
  await requireStorage(db);
  return listInquiries(db, input.status, input.offset);
}
export async function markInquiry(db, record, status, userId) {
  await requireStorage(db);
  return transaction(db, async () => {
    if (!(await findInquiry(db, record))) fail(404, 'Inquiry not found.');
    await updateInquiryStatus(db, record, status, now());
    await audit(db, userId, 'contact.status.updated', record, { status });
    return { id: record, status };
  });
}
