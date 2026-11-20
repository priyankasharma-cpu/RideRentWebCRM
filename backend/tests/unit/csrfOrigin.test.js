import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isAllowedOrigin } from '../../src/config/cors.js';
import { csrfProtection } from '../../src/middleware/csrf.js';

test('development allows loopback origins on Vite-selected ports only', () => {
  assert.equal(isAllowedOrigin('http://localhost:5174', ['http://localhost:5173']), true);
  assert.equal(isAllowedOrigin('http://127.0.0.1:5321', ['http://localhost:5173']), true);
  assert.equal(isAllowedOrigin('https://localhost:5174', ['http://localhost:5173']), false);
  assert.equal(isAllowedOrigin('http://localhost.example:5174', ['http://localhost:5173']), false);
  assert.equal(isAllowedOrigin('https://example.com', ['http://localhost:5173']), false);
});

test('CSRF still rejects a local request without its session token', () => {
  let responseStatus;
  let responseBody;
  let continued = false;
  const request = {
    method: 'POST',
    get: (header) => (header === 'origin' ? 'http://localhost:5174' : undefined),
    session: null,
  };
  const response = {
    status(code) {
      responseStatus = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  csrfProtection(['http://localhost:5173'])(request, response, () => {
    continued = true;
  });

  assert.equal(continued, false);
  assert.equal(responseStatus, 403);
  assert.deepEqual(responseBody, { error: 'Session expired. Refresh and try again.' });
});

test('CSRF accepts an allowed dynamic local origin only with the session token', () => {
  let continued = false;
  const request = {
    method: 'POST',
    get: (header) =>
      header === 'origin'
        ? 'http://localhost:5174'
        : header === 'x-csrf-token'
          ? 'valid-token'
          : undefined,
    session: { csrf: 'valid-token' },
  };

  csrfProtection(['http://localhost:5173'])(request, {}, () => {
    continued = true;
  });

  assert.equal(continued, true);
});
