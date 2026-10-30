import { all } from '../../config/database.js';
export async function listAuditLogRecords(db) {
  return await all(
    db,
    'SELECT a.*,u.name staff_name FROM audit a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.created_at DESC LIMIT 200',
  );
}
import { run } from '../../config/database.js';
export async function insertAuditLog(db, id, userId, action, entityId, details, createdAt) {
  return await run(
    db,
    'INSERT INTO audit VALUES(?,?,?,?,?,?)',
    id,
    userId,
    action,
    entityId,
    details,
    createdAt,
  );
}
