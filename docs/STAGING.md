# Staging and Railway PR environments

This application runs database DDL during startup and has periodic background
jobs. A preview must use a staging database and separate credentials; never
use production variables or a production database as the PR-environment base.
The server refuses a configured non-production database without a production
host guard, and refuses startup when the selected host matches that guard.

## Environment matrix

| Variable | Production | Persistent staging | Railway PR environment |
|---|---|---|---|
| `APP_ENV` / `VITE_APP_ENV` | `production` or unset | `staging` | `preview` (or `staging`) |
| `NODE_ENV` | `production` | `production` | `production` |
| `DATABASE_URL` / `POSTGRES_URL` | Production Postgres | Dedicated staging Postgres | Staging-derived PR Postgres only |
| `PROD_DB_HOST_GUARD` | Unset | Production database host fragment | Same non-secret guard as staging |
| `ENABLE_BACKGROUND_JOBS` | `true` or unset | Optional `true` | `false` |
| `JWT_SECRET`, `ADMIN_TOKEN`, AI and Firebase credentials | Production-only | Separate staging credentials | Staging-derived, non-production values |
| `VITE_FIREBASE_*` | Production Firebase project | Separate staging project | Staging Firebase project, available before build |
| `VITE_WHATSAPP_SUPPORT_NUMBER` | Production support | `TODO(owner): add a test support number` | Same test number |
| `PUBLIC_BASE_URL`, `APP_URL` | Production domain | Staging domain | Railway preview domain |
| `PORT`, `RAILWAY_GIT_COMMIT_SHA` | Platform-provided | Platform-provided | Platform-provided |

Never place credential values in this runbook or commit them. A staging
database URL must not contain the host fragment configured in
`PROD_DB_HOST_GUARD`. The application uses relative API requests so the preview
UI talks only to its own service.

## Railway owner setup

1. Create a persistent `staging` environment by duplicating production, then
   replace every credential and database binding. Attach a dedicated Postgres
   service; do not share production storage.
2. Enable PR environments and set their **base environment to staging**, not
   production. Consider focused PR environments to reduce resource use.
3. If staging has seed data, copy volumes only from staging. Keep a Railway
   provided domain on staging so PR environments receive preview domains.
4. Supply staging's own non-sealed credentials. Sealed production variables
   are not copied to PR environments. Use a separate Firebase project and
   authorize the staging/preview domains as supported by Firebase.
5. Set `ENABLE_BACKGROUND_JOBS=false` for PR environments, the healthcheck
   path to `/api/health`, and production deployment to `main` only.
6. Set the public base/app URL to the Railway preview domain. `VITE_*`
   variables are build-time inputs; changing them requires a rebuild.
7. Leave Bot PR environments disabled unless their resource cost is intended.

These dashboard steps require an owner; this code change does not alter
Railway project settings or inspect production credentials.

## Local build and smoke test

Use a staging database and staging credentials only. Build with
`APP_ENV=staging VITE_APP_ENV=staging NODE_ENV=production`, start the generated
server, then run `npm run smoke`. The smoke script defaults to
`http://127.0.0.1:3000`; `SMOKE_BASE_URL` may point to a local URL or a
`staging`, `preview` or PR-named Railway domain only. For remote checks set
`APP_ENV=staging` or `APP_ENV=preview`; the script also verifies that the
health endpoint reports a non-production app environment. It explicitly
refuses the production domain and unnamed Railway hosts.

`npm run lint`, `npm test`, and `npm run build` are the required CI checks.
`tests/route-baseline.json` records existing Express method/path registrations;
`tests/route-contract.test.ts` permits additive routes but detects a removed or
method-changed baseline route.

## Owner-supplied catalog seed

Catalog rows are intentionally empty until the owner supplies verified data.
Copy `data/catalog.seed.example.json` to `data/catalog.seed.json`, replace the
example item with verified values, and keep the real seed file out of version
control. Supported class IDs, status values, existing teacher groups, and
starter topics are validated before import. The script derives stable row IDs
from each item's unique `key` and uses `ON CONFLICT DO NOTHING`, so reruns do
not duplicate rows or overwrite later admin edits.

Run `npm run seed:catalog` only with `APP_ENV=staging` (or `preview`),
`DATABASE_URL` (or `POSTGRES_URL`) bound to that non-production database, and
`PROD_DB_HOST_GUARD` set to the production host fragment. The script refuses
to run outside staging/preview, refuses a matching production host, never
prints connection values, and will not import a file marked `"_example": true`
in production. The example contains fake placeholder values and is not real
catalog content.

## Promotion and rollback

Feature branch → pull request → Railway PR environment on staging configuration
→ verify smoke and acceptance checks → merge after review → production deploy.
Database changes must remain additive and idempotent so the previous deployment
can be redeployed against the newer schema. PR environments and their data are
disposable after merge.
