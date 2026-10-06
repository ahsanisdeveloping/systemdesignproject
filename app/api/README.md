# Express API

## Run

Requires Node.js 24 and a local PostgreSQL installation running on port 5432.
Create an empty database named `workflow_platform` using pgAdmin or SQL Shell:

```sql
CREATE DATABASE workflow_platform;
```

Copy `.env.example` to `.env` in this directory and set `PGPASSWORD` to your
local PostgreSQL password. Adjust the other `PG*` values if your installation
uses a different host, port, or user. `.env` is ignored by Git and loaded by
Node.js before the pool is created. Environment variables already set in the
terminal take precedence. No tables are needed for this lesson.

```sh
npm install
npm run dev
```

Use `npm start` to run without the development watcher. The server uses port
`5000` by default; set the `PORT` environment variable to override it.

## Health check

```sh
curl http://localhost:5000/api/v1/health
curl http://localhost:5000/health
```

Returns HTTP `200` with an uncached JSON response:

```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-10-05T12:00:00.000Z",
  "uptime": 42.5
}
```

`timestamp` is UTC and `uptime` is the Node.js process uptime in seconds.
Both routes execute `SELECT NOW()` against PostgreSQL before responding.
When the query fails, they return HTTP `503` with
`{"status":"error","database":"disconnected"}`. Connection details are logged
only on the server. Connecting and executing SQL each have a three-second timeout.

`src/db.js` creates one shared `pg.Pool`, capped at ten connections per API
process. The route calls `pool.query()`, which borrows a connection and returns
it automatically after the query. Reusing connections avoids opening a fresh
database connection for each HTTP request and keeps connection usage bounded.

The frontend requests the same path through Nginx at
`http://localhost:8080/api/v1/health`. Nginx forwards it directly here, bypassing
Next.js. During development without Nginx, a Next.js rewrite provides routing
on port 3000. Express owns the response in both cases; it is never cached.
See the [root README](../../README.md) for Nginx setup.

Unknown routes return JSON with HTTP `404`. Request errors use a consistent
`error.message` format; internal error details are logged only on the server.
The server stops accepting connections on `SIGINT` or `SIGTERM` and allows
up to 10 seconds for active requests to finish.
It then closes the PostgreSQL pool.

## Test

```sh
npm test
```

Tests use Node.js's built-in test runner and make real HTTP requests on a
temporary local port. No additional test dependencies are required.
The tests substitute the pool query to check success and database failure
responses without requiring PostgreSQL or local credentials. Verify the real
connection separately by starting the API and requesting `/health`.
