const tlsCodes = new Set([
  'ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR',
  'ERR_SSL_HANDSHAKE_FAILURE',
  'ERR_TLS_CERT_ALTNAME_INVALID',
  'CERT_HAS_EXPIRED',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
]);

function collectErrors(error) {
  const seen = new Set();
  const pending = [error];
  const collected = [];

  while (pending.length) {
    const current = pending.pop();
    if (!current || typeof current !== 'object' || seen.has(current)) continue;
    seen.add(current);
    collected.push(current);
    if (current.cause) pending.push(current.cause);
    if (current.reason && typeof current.reason === 'object') {
      if (current.reason.servers instanceof Map) {
        pending.push(...[...current.reason.servers.values()].map((server) => server.error));
      } else {
        pending.push(current.reason);
      }
    }
  }

  return collected;
}

/** Return only fixed, non-secret diagnostic fields; never include raw error messages or URIs. */
export function mongoConnectionDiagnostics(error) {
  const errors = collectErrors(error);
  const codes = [
    ...new Set(errors.map((item) => item.code).filter((code) => typeof code === 'string')),
  ];
  const endpoints = errors.find((item) => item.reason?.servers instanceof Map)?.reason.servers.size;

  if (codes.some((code) => tlsCodes.has(code))) {
    return {
      category: 'tls_handshake_rejected',
      codes,
      endpoints,
      action:
        'Check Atlas cluster status and Network Access, then test from another trusted network and review VPN, firewall, antivirus, or ISP TLS inspection. Keep TLS certificate verification enabled.',
    };
  }

  if (codes.some((code) => ['ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN', 'ETIMEOUT'].includes(code))) {
    return {
      category: 'dns_or_network_unreachable',
      codes,
      action:
        'Check DNS SRV resolution, outbound access to Atlas on port 27017, Atlas Network Access, and local firewall or VPN settings.',
    };
  }

  if (codes.includes('18') || errors.some((item) => item.code === 18)) {
    return {
      category: 'authentication_failed',
      codes,
      action: 'Check the Atlas database user, password URL-encoding, and authentication database.',
    };
  }

  return {
    category:
      error?.name === 'MongoServerSelectionError' ? 'server_selection_failed' : 'connection_failed',
    codes,
    endpoints,
    action:
      'Check the Atlas cluster status, database user, Network Access rules, and connection settings.',
  };
}
