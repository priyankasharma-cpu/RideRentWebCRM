import dns from 'node:dns';
import { env } from './env.js';

export function configureMongoDns() {
  const servers = env.MONGODB_DNS_SERVERS.split(',')
    .map((server) => server.trim())
    .filter(Boolean);

  if (servers.length > 0) dns.setServers(servers);
}
