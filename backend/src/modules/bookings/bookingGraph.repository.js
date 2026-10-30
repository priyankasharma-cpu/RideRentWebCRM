import { orm, normalizeRecord } from '../../config/database.js';

const include = {
  vehicle: true,
  customer: true,
  contact: { select: { name: true, phone: true, email: true, verified: true } },
  rental: { include: { inspections: { orderBy: { createdAt: 'asc' } } } },
  payments: { include: { refunds: true }, orderBy: { createdAt: 'desc' } },
};

export async function findBookingGraph(database, id) {
  return normalizeRecord(await orm(database).booking.findUnique({ where: { id }, include }));
}

export async function listBookingGraphs(database) {
  return normalizeRecord(await orm(database).booking.findMany({ include }));
}
