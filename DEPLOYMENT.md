# Deployment

## Build and start

Use Node.js 20 or newer. The production build and start scripts are defined in `package.json`:

```bash
npm run build
npm start
```

`npm run build` runs the Vite build and bundles `server.ts` to `dist/server.cjs`. `npm start` runs that bundled server. In production the server serves the built frontend from `dist/`.

## Runtime configuration

Set the environment variable names needed for the enabled integrations in the deployment environment. The server accepts `PORT`, `NODE_ENV`, `DATABASE_URL` or `POSTGRES_URL`, Gemini and other integration keys, Firebase Admin credentials, and application/auth configuration variables. The full names-only list is in [README.md](./README.md#environment-variable-names).

PostgreSQL schema initialization runs when a database connection is configured; otherwise the server has in-memory fallback data stores. Chat sessions are kept in browser storage, not in server-side session-history tables.

This repository has no Dockerfile. It does not define deployment instructions for a specific cloud provider.
