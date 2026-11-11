import { transaction } from '../../config/database.js';
import { fail } from '../../utils/ApiError.js';
import { id } from '../../utils/crypto.js';
import { now } from '../../utils/dateTime.js';
import { audit } from '../audit/audit.service.js';
import { addOnInput, updateAddOnInput, archiveAddOnInput } from './addOn.validation.js';
import * as repository from './addOn.repository.js';
import { peakCommitment, stockSummary } from './addOn.inventory.js';

async function requireInstallation(db) {
  if (!(await repository.addOnsInstalled(db)))
    fail(503, 'Apply migration 0007_dynamic_addons before managing add-ons.');
}
export async function managedAddOns(db) {
  await requireInstallation(db);
  const start = now();
  return Promise.all(
    (await repository.listAddOns(db)).map(async (addon) => ({
      ...addon,
      inventory: stockSummary(
        addon,
        await repository.allocationWindows(db, addon),
        start,
        '9999-12-31T23:59:59.999Z',
      ),
    })),
  );
}
export async function createAddOn(db, raw, user) {
  const input = addOnInput.parse(raw);
  return transaction(db, async () => {
    await requireInstallation(db);
    if (await repository.findAddOnCode(db, input.code))
      fail(409, 'An add-on with this code already exists.');
    const key = id();
    const committed = peakCommitment(
      await repository.allocationWindows(db, { id: key, code: input.code }),
      now(),
      '9999-12-31T23:59:59.999Z',
    );
    if (input.stock - input.unserviceable < committed)
      fail(
        409,
        `At least ${committed} serviceable units are already committed by existing bookings.`,
      );
    await repository.insertAddOn(db, { ...input, id: key, createdAt: now() });
    await repository.replaceCategories(db, key, input.categories);
    await audit(db, user.id, 'addon.created', key, { code: input.code });
    return repository.findAddOn(db, key);
  });
}
export async function editAddOn(db, key, raw, user) {
  const input = updateAddOnInput.parse(raw);
  return transaction(db, async () => {
    await requireInstallation(db);
    const old = await repository.findAddOn(db, key);
    if (!old) fail(404, 'Add-on not found.');
    if (old.archived_at)
      fail(409, 'Archived add-ons are read-only. Create a new add-on if needed.');
    if (old.version !== input.version) fail(409, 'This add-on changed. Reload before saving.');
    if (old.code !== input.code) fail(400, 'The add-on code cannot change after creation.');
    const committed = peakCommitment(
      await repository.allocationWindows(db, old),
      now(),
      '9999-12-31T23:59:59.999Z',
    );
    if (input.stock - input.unserviceable < committed)
      fail(
        409,
        `At least ${committed} serviceable units are already committed. Resolve reservations before reducing stock.`,
      );
    await repository.updateAddOn(db, key, { ...input, updatedAt: now() });
    await repository.replaceCategories(db, key, input.categories);
    await audit(db, user.id, 'addon.updated', key, { version: old.version + 1 });
    return repository.findAddOn(db, key);
  });
}
export async function archiveAddOn(db, key, raw, user) {
  const input = archiveAddOnInput.parse(raw);
  return transaction(db, async () => {
    await requireInstallation(db);
    const old = await repository.findAddOn(db, key);
    if (!old) fail(404, 'Add-on not found.');
    if (old.version !== input.version) fail(409, 'This add-on changed. Reload before archiving.');
    await repository.archiveAddOn(db, key, now());
    await audit(db, user.id, 'addon.archived', key);
    return repository.findAddOn(db, key);
  });
}
export async function publicAddOns(db, period) {
  const records = await repository.listAddOns(db);
  return Promise.all(
    records
      .filter((row) => row.enabled && !row.archived_at)
      .map(async (row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        description: row.description,
        image: row.image,
        rate: row.rate,
        billing: row.billing,
        maxQuantity: row.maxQuantity,
        version: row.version,
        categories: row.categories,
        ...stockSummary(row, await repository.allocationWindows(db, row), period.start, period.end),
      })),
  );
}
