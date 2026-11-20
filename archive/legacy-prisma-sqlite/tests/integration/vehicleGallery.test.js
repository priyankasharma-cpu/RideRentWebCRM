import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { openDb, get, all, run } from '../../src/config/database.js';
import { seed } from '../../prisma/seed.js';
import { createApp } from '../../src/app.js';
import { vehicleGalleryInput } from '../../src/modules/vehicles/vehicleGallery.validation.js';
let db, server, base;
const password = 'Gallery-Test-Password-2026!';
before(async () => {
  process.env.ADMIN_EMAIL = 'gallery@riderent.local';
  process.env.ADMIN_PASSWORD = password;
  db = await openDb(':memory:');
  await seed(db);
  server = createApp(db).listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await db.close();
});
test('gallery validates five unique safe sources, persists order and primary, and preserves rental fields', async () => {
  const vehicle = await get(db, 'SELECT * FROM vehicles LIMIT 1');
  let response = await fetch(base + '/api/session');
  let session = await response.json(),
    cookie = response.headers.get('set-cookie').split(';')[0];
  response = await fetch(base + '/api/login', {
    method: 'POST',
    headers: { Cookie: cookie, 'Content-Type': 'application/json', 'X-CSRF-Token': session.csrf },
    body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password }),
  });
  assert.equal(response.status, 200);
  session = await response.json();
  cookie = response.headers.get('set-cookie')?.split(';')[0] || cookie;
  const images = ['front', 'side', 'rear', 'dashboard', 'details'].map((id) => ({
    id,
    label: id,
    url: `/images/vehicles/test/${id}.webp`,
  }));
  const put = (body, authorized = true) =>
    fetch(base + `/api/admin/vehicles/${vehicle.id}/images`, {
      method: 'PUT',
      headers: {
        ...(authorized ? { Cookie: cookie, 'X-CSRF-Token': session.csrf } : {}),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  assert.ok((await put({ images }, false)).status >= 400);
  assert.equal((await put({ images: [...images, images[0]] })).status, 400);
  assert.equal((await put({ images: [images[0], images[0]] })).status, 400);
  assert.equal((await put({ images: [{ ...images[0], url: 'javascript:alert(1)' }] })).status, 400);
  response = await put({ images });
  assert.equal(response.status, 200);
  let result = await response.json();
  assert.deepEqual(result.images, images);
  assert.equal(result.image, images[0].url);
  response = await fetch(base + `/api/vehicles/${vehicle.slug}`);
  result = await response.json();
  assert.deepEqual(result.images, images);
  const reordered = [images[2], images[0]];
  response = await put({ images: reordered });
  assert.equal(response.status, 200);
  result = await response.json();
  assert.deepEqual(result.images, reordered);
  assert.equal(result.image, images[2].url);
  assert.equal((await put({ images: [] })).status, 200);
  const after = await get(db, 'SELECT * FROM vehicles WHERE id=?', vehicle.id);
  for (const field of ['rate', 'deposit', 'status', 'odometer'])
    assert.equal(after[field], vehicle[field]);
  assert.equal(
    (await all(db, 'SELECT * FROM vehicle_images WHERE vehicle_id=?', vehicle.id)).length,
    0,
  );
  assert.ok(
    (await get(db, "SELECT COUNT(*) n FROM audit WHERE action='vehicle.images.updated'")).n >= 3,
  );
});
test('legacy database without optional table remains readable', async () => {
  await run(db, 'DROP TABLE vehicle_images');
  const response = await fetch(base + '/api/vehicles');
  assert.equal(response.status, 200);
  assert.ok(
    (await response.json()).every(
      (vehicle) => Array.isArray(vehicle.images) && vehicle.images.length === 0,
    ),
  );
});
test('gallery input rejects duplicate ids, unsafe URLs and oversized arrays', () => {
  for (const url of [
    'data:image/png;base64,x',
    '//evil.test/a',
    '/images/../private',
    'http://example.com/a',
    'https://user:pass@example.com/a',
  ])
    assert.equal(
      vehicleGalleryInput.safeParse({ images: [{ id: 'a', label: 'Front', url }] }).success,
      false,
    );
  assert.equal(vehicleGalleryInput.safeParse({ images: [] }).success, true);
});
