# Runtime operations

## Health and metrics routes

- `GET /api/health` returns a basic health response and reports configured integrations.
- `GET /api/ready` and `GET /api/v1/ready` return readiness based on the entity registry.
- `GET /api/v1/health` reports uptime, memory use, entity/cache counts, and database status.
- `GET /api/v1/metrics` returns process, cache, external API, and entity-registry metrics as JSON.

## Request and query limits

API routes use in-memory per-minute rate limiters: general API requests are limited to 150/minute, AI ask/auth/learning/counseling routes to 25/minute, and admin routes to 30/minute. Paid tiers receive a 10x burst allowance. Daily query quotas are 25 per UTC day for signed-in free accounts, 5 lifetime per guest device, and 200 per UTC day per device across accounts; paid tiers bypass these daily quotas. Daily counters use UTC midnight.

## Persistence

The server initializes PostgreSQL tables when `DATABASE_URL` or `POSTGRES_URL` is configured. Several data paths fall back to in-memory stores when PostgreSQL is not configured. Chat sessions and messages are stored in browser `localStorage`; signed-in notes use `/api/notes` and the `notes` table when PostgreSQL is available, while guest notes use browser `localStorage`.

## Browser caching

The service worker is served from `public/sw.js` and registered by `index.html`. It precaches the app shell/offline assets, uses cache-first for `/assets/`, and network-first for other same-origin GET requests. On network failure it returns a cached response or, for a navigation request, the offline page. Its cache name is `gage-ai-v1`.
