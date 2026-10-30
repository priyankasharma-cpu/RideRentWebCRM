# Frontend guide

Run npm run dev from the repository root. Vite serves frontend on port 5173 and proxies API requests to port 3001. Build with npm run build; output is frontend/dist.

src/pages contains customer route compositions. src/components/home contains individually styled homepage sections. Shared layout, booking and vehicle components have dedicated directories. src/admin contains protected routes, layouts, pages and feature components. Keep admin-only code there.

Use services/apiClient.js for authenticated requests, CSRF and error handling. React Query-backed hooks provide loading and server state. useQuote debounces and cancels obsolete quote requests. Authoritative rates and availability come from the backend.

Design tokens live in styles/variables.css, light-theme.css and dark-theme.css. ThemeContext persists selection. Respect reduced-motion preferences and clean up timers, observers and event handlers.
