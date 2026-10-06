# Eris Workspace

A Next.js dashboard for organizations, people, and organization memberships.
Built from the ErisAI design guide with the Mint Cream / Vintage Berry palette.

Start PostgreSQL and Express in `app/api`, then run from this directory:

```powershell
npm.cmd install
Copy-Item .env.example .env.local
npm.cmd run dev
```

Open http://localhost:3000. The overview loads real counts, recent records, and
a setup checklist. Organizations, People, and Memberships support create, read,
edit, and delete. Membership roles belong to the selected organization.
Integrations is a roadmap page; planned features are not presented as connected.

## API routing

All browser calls use relative `/api/v1/*` URLs. In development, `next dev`
forwards them to `API_BASE_URL` (default `http://localhost:5000`). Restart Next.js
after changing that origin. Nginx forwards those requests directly to Express
when opening http://localhost:8080. Production builds require this Nginx routing;
`next start` alone has no API rewrite. API calls do not require CORS configuration.

The topbar performs a database-backed API health check and allows manual retries.
Lists use bounded server pagination. Search and sorting apply to the current page,
as labeled. Directory selectors load all pages up to the 10,000-record guard;
larger deployments need searchable selectors and aggregate statistics endpoints.

The backend currently exposes unauthenticated local management endpoints. Login,
tenant authorization, and role enforcement are required before public deployment.

## Verification

```powershell
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run build
npm.cmd run test:e2e
```

The browser suite uses installed Microsoft Edge in headless mode, starts a
separate Next.js server on port 3100 and Express server on port 5127, and creates
a random PostgreSQL test schema using the API's PG settings. It verifies all
three CRUD flows, duplicates, dialog keyboard focus, real overview counts,
pagination, error recovery, and mobile / tablet / landscape layouts with reduced
motion. Test builds use `.next-e2e` so they can run alongside development.
It removes its own schema after
the run and never writes fixtures into public tables. The database user needs
schema creation/deletion privileges. Ports 3100 and 5127 must be available.

Geist fonts use the existing `next/font/google` setup and require network access
during initial development compilation/build. Runtime fonts are served locally.
Browser screenshots and traces are written to ignored `test-results/`.

See [the API contract](../../docs/api.md) and
[dashboard design notes](../../docs/dashboard-design.md).
