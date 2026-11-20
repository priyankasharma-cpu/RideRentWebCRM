import { collection, fromDocuments, mongoOptions } from '../../config/mongoDatabase.js';

export async function listAuditLogRecords(db) {
  const records = await collection(db, 'audit')
    .aggregate(
      [
        { $sort: { created_at: -1 } },
        { $limit: 200 },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: 'id',
            as: 'staff',
          },
        },
        { $unwind: { path: '$staff', preserveNullAndEmptyArrays: true } },
        { $addFields: { staff_name: '$staff.name' } },
        { $project: { _id: 0, staff: 0 } },
      ],
      mongoOptions(db),
    )
    .toArray();
  return fromDocuments(records);
}

export async function insertAuditLog(db, id, userId, action, entityId, details, createdAt) {
  return collection(db, 'audit').insertOne(
    {
      _id: id,
      id,
      user_id: userId,
      action,
      entity_id: entityId,
      details,
      created_at: createdAt,
    },
    mongoOptions(db),
  );
}
