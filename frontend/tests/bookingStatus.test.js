import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rentalDuration } from '../src/utils/bookingStatus.js';
test('scheduled duration is readable for hourly, multi-day and month-long bookings', () => {
  const start = '2030-01-01T00:00:00Z';
  for (const [hours, label] of [
    [4, '4 hours'],
    [24, '1 day'],
    [48, '2 days'],
    [240, '10 days'],
    [720, '30 days'],
    [25.5, '1 day 1 hour 30 minutes'],
  ])
    assert.equal(
      rentalDuration(start, new Date(Date.parse(start) + hours * 3600000).toISOString()),
      label,
    );
});
test('invalid and reversed duration never displays misleading negative time', () => {
  assert.equal(rentalDuration('bad', 'bad'), 'Duration unavailable');
  assert.equal(rentalDuration('2030-01-02', '2030-01-01'), 'Duration unavailable');
});
