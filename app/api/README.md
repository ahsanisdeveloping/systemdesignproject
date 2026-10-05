# Express API

## Run

```sh
npm install
npm run dev
```

Use `npm start` to run without the development watcher. The server uses port
`5000` by default; set the `PORT` environment variable to override it.

## Health check

```sh
curl http://localhost:5000/api/v1/health
```

Returns HTTP `200` with an uncached JSON response:

```json
{
  "status": "ok",
  "timestamp": "2026-10-05T12:00:00.000Z",
  "uptime": 42.5
}
```

`timestamp` is UTC and `uptime` is the Node.js process uptime in seconds.
This is a liveness check: it confirms the HTTP process can respond. It does
not check database connectivity or other external dependencies.

Unknown routes return JSON with HTTP `404`. Request errors use a consistent
`error.message` format; internal error details are logged only on the server.
The server stops accepting connections on `SIGINT` or `SIGTERM` and allows
up to 10 seconds for active requests to finish.

## Test

```sh
npm test
```

Tests use Node.js's built-in test runner and make real HTTP requests on a
temporary local port. No additional test dependencies are required.
