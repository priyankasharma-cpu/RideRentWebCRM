import assert from 'node:assert/strict';
import test from 'node:test';
import { mongoConnectionDiagnostics } from '../../src/config/mongoConnectionDiagnostics.js';

test('Mongo TLS diagnostics are concise and do not include raw error or URI text', () => {
  const tlsError = Object.assign(new Error('secret URI mongodb+srv://user:password@example.test'), {
    code: 'ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR',
  });
  const selectionError = Object.assign(new Error('raw server selection details'), {
    name: 'MongoServerSelectionError',
    reason: {
      servers: new Map([
        ['node-a', { error: tlsError }],
        ['node-b', { error: tlsError }],
      ]),
    },
  });

  const result = mongoConnectionDiagnostics(selectionError);
  assert.equal(result.category, 'tls_handshake_rejected');
  assert.equal(result.endpoints, 2);
  assert.deepEqual(result.codes, ['ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR']);
  assert.equal(JSON.stringify(result).includes('password'), false);
  assert.equal(JSON.stringify(result).includes('mongodb+srv://'), false);
});

test('Mongo network diagnostics suggest DNS and network checks without raw messages', () => {
  const error = Object.assign(new Error('private detail'), { code: 'ECONNREFUSED' });
  const result = mongoConnectionDiagnostics(error);
  assert.equal(result.category, 'dns_or_network_unreachable');
  assert.equal(result.codes[0], 'ECONNREFUSED');
  assert.equal(JSON.stringify(result).includes('private detail'), false);
});
