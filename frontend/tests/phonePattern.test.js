import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const fields = [
  '../src/components/booking/BookingForm.jsx',
  '../src/components/booking/CustomerDetails.jsx',
  '../src/admin/pages/CreateBooking.jsx',
];

test('customer phone fields use valid HTML v-mode patterns consistent with booking validation', () => {
  const phonePatterns = fields.map((path) => {
    const source = readFileSync(new URL(path, import.meta.url), 'utf8');
    const pattern = source.match(/pattern=\{String\.raw`([^`]+)`\}/)?.[1];
    assert.ok(pattern, `Missing shared-format phone pattern in ${path}`);
    return new RegExp(`^(?:${pattern})$`, 'v');
  });

  for (const pattern of phonePatterns) {
    assert.equal(pattern.test('9876500011'), true);
    assert.equal(pattern.test('+91 98765-00011'), true);
    assert.equal(pattern.test('(98765) 00011'), true);
    assert.equal(pattern.test('12345'), false);
    assert.equal(pattern.test('98765abc11'), false);
  }
});
