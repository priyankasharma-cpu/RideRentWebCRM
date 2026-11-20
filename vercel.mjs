const configuredBackendOrigin = process.env.RIDERENT_BACKEND_ORIGIN?.trim();

if (!configuredBackendOrigin)
  throw new Error('Set RIDERENT_BACKEND_ORIGIN in the Vercel project environment.');

let backendOrigin;
try {
  const parsedOrigin = new URL(configuredBackendOrigin);
  if (
    parsedOrigin.protocol !== 'https:' ||
    parsedOrigin.username ||
    parsedOrigin.password ||
    parsedOrigin.pathname !== '/' ||
    parsedOrigin.search ||
    parsedOrigin.hash
  ) {
    throw new Error();
  }
  backendOrigin = parsedOrigin.origin;
} catch {
  throw new Error('RIDERENT_BACKEND_ORIGIN must be an HTTPS origin without a path.');
}

export const config = {
  framework: 'vite',
  installCommand: 'npm --prefix frontend ci',
  buildCommand: 'npm --prefix frontend run build',
  outputDirectory: 'frontend/dist',
  rewrites: [
    {
      source: '/api/:path*',
      destination: `${backendOrigin}/api/:path*`,
    },
    {
      source: '/images/uploads/:path*',
      destination: `${backendOrigin}/images/uploads/:path*`,
    },
    {
      source: '/(.*)',
      destination: '/index.html',
    },
  ],
};
