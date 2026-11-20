import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { openDb, get, run } from '../../src/config/database.js';
import { seed } from '../../prisma/seed.js';
import { createApp } from '../../src/app.js';
import { submitInquiry } from '../../src/modules/contact/contact.service.js';
import { contactInput } from '../../src/modules/contact/contact.validation.js';
let db, server, base, session, cookie;
const password = 'Contact-Test-Password-2026!';
const input = () => ({
  submissionKey: randomUUID(),
  name: 'Test Rider',
  email: 'contact@example.com',
  phone: '',
  inquiryType: 'booking',
  message: 'Please help with my booking details.',
});
before(async () => {
  process.env.ADMIN_EMAIL = 'contact-test@riderent.local';
  process.env.ADMIN_PASSWORD = password;
  db = await openDb(':memory:');
  await seed(db);
  server = createApp(db).listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(base + '/api/session');
  session = await response.json();
  cookie = response.headers.get('set-cookie').split(';')[0];
});
after(async () => {
  await new Promise((r) => server.close(r));
  await db.close();
});
const post = (body, csrf = session.csrf) =>
  fetch(base + '/api/contact', {
    method: 'POST',
    headers: { Cookie: cookie, 'X-CSRF-Token': csrf, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
test('submission validates, enforces CSRF, persists privately, retries safely and rate limits', async () => {
  assert.equal((await fetch(base + '/api/admin/inquiries')).status, 401);
  assert.equal((await post(input(), 'bad-token')).status, 403);
  assert.equal((await post({ ...input(), name: ' ' })).status, 400);
  const values = input();
  let response = await post(values);
  assert.equal(response.status, 201);
  const receipt = await response.json();
  assert.deepEqual(Object.keys(receipt), ['id']);
  assert.equal(
    (await get(db, 'SELECT * FROM contact_inquiries WHERE id=?', receipt.id)).message,
    values.message,
  );
  response = await post(values);
  assert.equal((await response.json()).id, receipt.id);
  assert.equal((await get(db, 'SELECT COUNT(*) n FROM contact_inquiries')).n, 1);
  assert.equal(
    (await post({ ...values, message: 'Changed message with same request key.' })).status,
    409,
  );
  assert.equal((await post(input())).status, 201);
  assert.equal((await post(input())).status, 429);
});
test('admin inbox protects private messages and records status changes', async () => {
  let response = await fetch(base + '/api/login', {
    method: 'POST',
    headers: { Cookie: cookie, 'X-CSRF-Token': session.csrf, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password }),
  });
  assert.equal(response.status, 200);
  session = await response.json();
  cookie = response.headers.get('set-cookie').split(';')[0] || cookie;
  response = await fetch(base + '/api/admin/inquiries?status=new', { headers: { Cookie: cookie } });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const data = await response.json();
  assert.equal(data.total, 2);
  assert.ok(data.items.every((item) => !item.submission_key));
  const id = data.items[0].id;
  response = await fetch(base + '/api/admin/inquiries/' + id, {
    method: 'PATCH',
    headers: { Cookie: cookie, 'X-CSRF-Token': session.csrf, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'read' }),
  });
  assert.equal(response.status, 200);
  assert.equal(
    (await get(db, 'SELECT status FROM contact_inquiries WHERE id=?', id)).status,
    'read',
  );
  assert.equal(
    (await get(db, "SELECT COUNT(*) n FROM audit WHERE action='contact.status.updated'")).n,
    1,
  );
  response = await fetch(base + '/api/admin/inquiries?offset=99999', {
    headers: { Cookie: cookie },
  });
  assert.deepEqual((await response.json()).items, []);
});
test('simultaneous retries create one record and validation bounds input', async () => {
  const values = input();
  const result = await Promise.all([submitInquiry(db, values), submitInquiry(db, values)]);
  assert.equal(result[0].id, result[1].id);
  assert.equal(
    (
      await get(
        db,
        'SELECT COUNT(*) n FROM contact_inquiries WHERE submission_key=?',
        values.submissionKey,
      )
    ).n,
    1,
  );
  for (const patch of [
    { email: 'invalid' },
    { message: 'short' },
    { message: 'x'.repeat(3001) },
    { phone: 'bad phone' },
    { inquiryType: 'unknown' },
  ])
    assert.equal(contactInput.safeParse({ ...input(), ...patch }).success, false);
});
test('missing optional inquiry storage returns a useful error without breaking the site', async () => {
  await run(db, 'DROP TABLE contact_inquiries');
  await assert.rejects(
    () => submitInquiry(db, input()),
    (error) => error.status === 503,
  );
  assert.equal((await fetch(base + '/api/vehicles')).status, 200);
});
