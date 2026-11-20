import { collection, fromDocuments, mongoOptions, queryGroup } from '../../config/mongoDatabase.js';

export const addOnsInstalled = async () => true;

export async function listAddOns(db) {
  const [records, categories] = await queryGroup(db, [
    () => collection(db, 'addons').find({}, mongoOptions(db)).sort({ name: 1, id: 1 }).toArray(),
    () =>
      collection(db, 'addon_categories').find({}, mongoOptions(db)).sort({ category: 1 }).toArray(),
  ]);
  return fromDocuments(records).map((row) => ({
    ...row,
    enabled: Boolean(row.enabled),
    maxQuantity: row.max_quantity,
    categories: categories
      .filter((rule) => rule.addon_id === row.id)
      .map((rule) => ({ category: rule.category, includedQuantity: rule.included_quantity })),
  }));
}

export const findAddOn = async (db, id) => (await listAddOns(db)).find((row) => row.id === id);
export const findAddOnCode = async (db, code) =>
  (await listAddOns(db)).find((row) => row.code === code);

export async function insertAddOn(db, row) {
  const time = row.createdAt;
  return collection(db, 'addons').insertOne(
    {
      _id: row.id,
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      image: row.image,
      rate: row.rate,
      billing: row.billing,
      stock: row.stock,
      unserviceable: row.unserviceable,
      max_quantity: row.maxQuantity,
      enabled: row.enabled ? 1 : 0,
      archived_at: null,
      version: 1,
      created_at: time,
      updated_at: time,
    },
    mongoOptions(db),
  );
}

export async function updateAddOn(db, id, row) {
  return collection(db, 'addons').updateOne(
    { id },
    {
      $set: {
        name: row.name,
        description: row.description,
        image: row.image,
        rate: row.rate,
        billing: row.billing,
        stock: row.stock,
        unserviceable: row.unserviceable,
        max_quantity: row.maxQuantity,
        enabled: row.enabled ? 1 : 0,
        updated_at: row.updatedAt,
      },
      $inc: { version: 1 },
    },
    mongoOptions(db),
  );
}

export async function replaceCategories(db, id, categories) {
  const target = collection(db, 'addon_categories');
  await target.deleteMany({ addon_id: id }, mongoOptions(db));
  if (!categories.length) return;
  await target.insertMany(
    categories.map((rule) => ({
      _id: `${encodeURIComponent(id)}:${encodeURIComponent(rule.category)}`,
      addon_id: id,
      category: rule.category,
      included_quantity: rule.includedQuantity,
    })),
    mongoOptions(db),
  );
}

export async function archiveAddOn(db, id, time) {
  return collection(db, 'addons').updateOne(
    { id },
    { $set: { archived_at: time, enabled: 0, updated_at: time }, $inc: { version: 1 } },
    mongoOptions(db),
  );
}

async function allocationRows(db, addonId) {
  return collection(db, 'addon_allocations')
    .aggregate(
      [
        { $match: addonId ? { addon_id: addonId } : {} },
        {
          $lookup: {
            from: 'bookings',
            localField: 'booking_id',
            foreignField: 'id',
            as: 'booking',
          },
        },
        { $unwind: '$booking' },
        { $match: { 'booking.status': { $in: ['confirmed', 'active', 'inspecting'] } } },
        {
          $project: {
            _id: 0,
            quantity: 1,
            status: '$booking.status',
            starts_at: '$booking.starts_at',
            ends_at: '$booking.ends_at',
          },
        },
      ],
      mongoOptions(db),
    )
    .toArray();
}

export async function allocationWindows(db, addon) {
  const rows = await allocationRows(db, addon.id);
  if (addon.code === 'helmet') {
    rows.push(
      ...(await collection(db, 'booking_addons')
        .aggregate(
          [
            {
              $lookup: {
                from: 'bookings',
                localField: 'booking_id',
                foreignField: 'id',
                as: 'booking',
              },
            },
            { $unwind: '$booking' },
            { $match: { 'booking.status': { $in: ['confirmed', 'active', 'inspecting'] } } },
            {
              $project: {
                _id: 0,
                quantity: 1,
                status: '$booking.status',
                starts_at: '$booking.starts_at',
                ends_at: '$booking.ends_at',
              },
            },
          ],
          mongoOptions(db),
        )
        .toArray()),
    );
  }
  return rows;
}

export async function insertAllocation(db, row) {
  return collection(db, 'addon_allocations').insertOne(
    {
      _id: row.id,
      id: row.id,
      addon_id: row.addonId,
      booking_id: row.bookingId,
      quantity: row.quantity,
      included_quantity: row.includedQuantity,
      name: row.name,
      rate: row.rate,
      billing: row.billing,
      base: row.base,
      tax: row.tax,
      version: row.version,
    },
    mongoOptions(db),
  );
}

export async function listAllocationSnapshots(db) {
  const allocations = await collection(db, 'addon_allocations')
    .aggregate(
      [
        {
          $lookup: {
            from: 'addons',
            localField: 'addon_id',
            foreignField: 'id',
            as: 'addon',
          },
        },
        { $unwind: { path: '$addon', preserveNullAndEmptyArrays: true } },
        { $addFields: { code: '$addon.code' } },
        { $project: { _id: 0, addon: 0 } },
      ],
      mongoOptions(db),
    )
    .toArray();
  return fromDocuments(allocations);
}
