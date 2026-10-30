import { listAuditLogRecords } from './audit.repository.js';
export async function listAudit(db, _request) {
  return await listAuditLogRecords(db);
}
import { id } from '../../utils/crypto.js';
import { now } from '../../utils/dateTime.js';
import { insertAuditLog } from './audit.repository.js';
export async function audit(db, userId, action, entityId, details = {}) {
  await insertAuditLog(db, id(), userId || null, action, entityId, JSON.stringify(details), now());
}
