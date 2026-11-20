import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { api, resetSessionCache } from '../src/services/apiClient.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  resetSessionCache();
});

test('reacquires an expired CSRF session and retries the blocked request once', async () => {
  const requests = [];
  let sessionCount = 0;
  let quoteCount = 0;
  globalThis.fetch = async (url, options = {}) => {
    requests.push({ url, options });
    if (url === '/api/session') {
      sessionCount += 1;
      return Response.json({ csrf: `token-${sessionCount}` });
    }
    quoteCount += 1;
    if (quoteCount === 1)
      return Response.json({ error: 'Session expired. Refresh and try again.' }, { status: 403 });
    return Response.json({ available: true, total: 12000 });
  };

  const result = await api('/checkout/quote', {
    method: 'POST',
    body: { items: [] },
  });

  assert.deepEqual(result, { available: true, total: 12000 });
  assert.equal(sessionCount, 2);
  assert.equal(quoteCount, 2);
  assert.equal(requests[1].options.headers['X-CSRF-Token'], 'token-1');
  assert.equal(requests[3].options.headers['X-CSRF-Token'], 'token-2');
  assert.equal(requests[1].options.credentials, 'same-origin');
});

test('does not retry an origin-rejected request', async () => {
  let sessionCount = 0;
  let quoteCount = 0;
  globalThis.fetch = async (url) => {
    if (url === '/api/session') {
      sessionCount += 1;
      return Response.json({ csrf: 'token-1' });
    }
    quoteCount += 1;
    return Response.json({ error: 'Request origin is not allowed.' }, { status: 403 });
  };

  await assert.rejects(
    () => api('/checkout/quote', { method: 'POST', body: {} }),
    /Request origin is not allowed\./,
  );
  assert.equal(sessionCount, 1);
  assert.equal(quoteCount, 1);
});
