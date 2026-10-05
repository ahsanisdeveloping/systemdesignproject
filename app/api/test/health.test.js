const assert = require("node:assert/strict");
const { before, after, test } = require("node:test");
const { once } = require("node:events");
const app = require("../src/app");

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
});

test("health endpoint returns an uncached JSON liveness response", async () => {
  const response = await fetch(`${baseUrl}/api/v1/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /application\/json/);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("x-powered-by"), null);
  assert.equal(body.status, "ok");
  assert.equal(new Date(body.timestamp).toISOString(), body.timestamp);
  assert.equal(typeof body.uptime, "number");
  assert.ok(body.uptime >= 0);
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
