const assert = require("node:assert/strict");
const { before, after, afterEach, test, mock } = require("node:test");
const { once } = require("node:events");
const app = require("../src/app");
const pool = require("../src/db");

let server;
let baseUrl;

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((err) => err ? reject(err) : resolve());
  });
  await pool.end();
});

afterEach(() => mock.restoreAll());

test("health endpoint queries PostgreSQL and returns uncached JSON", async () => {
  const query = mock.method(pool, "query", async () => ({ rows: [{ now: new Date() }] }));
  const response = await fetch(`${baseUrl}/api/v1/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /application\/json/);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("x-powered-by"), null);
  assert.equal(body.status, "ok");
  assert.equal(body.database, "connected");
  assert.equal(query.mock.callCount(), 1);
  assert.deepEqual(query.mock.calls[0].arguments, ["SELECT NOW()"]);
  assert.equal(new Date(body.timestamp).toISOString(), body.timestamp);
  assert.equal(typeof body.uptime, "number");
  assert.ok(body.uptime >= 0);
});

test("/health also checks the database", async () => {
  mock.method(pool, "query", async () => ({ rows: [{ now: new Date() }] }));
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).database, "connected");
});

test("database failure returns 503 without exposing connection details", async () => {
  mock.method(pool, "query", async () => { throw new Error("private connection details"); });
  mock.method(console, "error", () => {});
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { status: "error", database: "disconnected" });
});

test("unknown routes return a JSON 404", async () => {
  const response = await fetch(`${baseUrl}/missing`);

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), {
    error: { message: "Route not found" },
  });
});

test("malformed JSON returns a JSON 400 without internal error details", async () => {
  const response = await fetch(`${baseUrl}/api/v1/health`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{invalid",
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: { message: "Invalid request" },
  });
});
