const assert = require("node:assert/strict");
const { test, after, mock } = require("node:test");
const { once } = require("node:events");
const { createApp } = require("../src/app");
const pool = require("../src/db");
after(() => pool.end());

async function withApi(db, run) {
  const server = createApp(db).listen(0, "127.0.0.1");
  await once(server, "listening");
  try { await run(`http://127.0.0.1:${server.address().port}/api/v1`); }
  finally { await new Promise(resolve => server.close(resolve)); }
}

test("invalid input is rejected before executing entity queries", async () => {
  await withApi({ query: async () => assert.fail("Invalid input reached PostgreSQL") }, async base => {
    const cases = [
      ["GET", "/users/not-a-uuid"],
      ["GET", "/users?limit=101"],
      ["GET", "/organizations?offset=-1"],
      ["GET", "/users?limit=1&limit=2"],
      ["GET", "/users?sort=email"],
      ["POST", "/users", { name: "Ahsan" }],
      ["POST", "/users", { name: " ", email: "a@example.com" }],
      ["POST", "/users", { name: "Ahsan", email: "bad" }],
      ["POST", "/organizations", { name: "Org", id: "read-only" }],
      ["POST", "/organizations", []],
      ["PATCH", "/users/00000000-0000-0000-0000-000000000001", {}],
      ["PATCH", "/users/00000000-0000-0000-0000-000000000001", { email: null }],
    ];
    for (const [method, route, body] of cases) {
      const response = await fetch(base + route, {
        method, ...(body !== undefined ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
      });
      assert.equal(response.status, 422, method + " " + route);
      const result = await response.json();
      assert.equal(result.error.code, "VALIDATION_ERROR");
      assert.equal(result.requestId, response.headers.get("x-request-id"));
    }
    assert.equal((await fetch(base + "/users", { method: "POST", body: "name=Ahsan" })).status, 415);
    assert.equal((await fetch(base + "/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "x".repeat(110000) }) })).status, 413);
  });
});

test("values are normalized and parameterized; creation returns 201 and Location", async () => {
  const id = "00000000-0000-0000-0000-000000000001";
  const name = "Robert'); DROP TABLE users; --";
  await withApi({ query: async (sql, values) => {
    assert.ok(!sql.includes(name));
    assert.deepEqual(values, [name, "ahsan@example.com"]);
    return { rows: [{ id, name, email: values[1] }] };
  } }, async base => {
    const response = await fetch(base + "/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email: " AHSAN@EXAMPLE.COM " }) });
    assert.equal(response.status, 201);
    assert.equal(response.headers.get("location"), `/api/v1/users/${id}`);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal((await response.json()).data.name, name);
  });
});

test("database failures are translated and internal details stay private", async () => {
  const log = mock.method(console, "error", () => {});
  try {
    for (const [code, constraint, status, apiCode] of [
      ["23505", "users_email_unique", 409, "CONFLICT"],
      ["23505", "organization_members_pkey", 409, "CONFLICT"],
      ["23503", "organization_members_user_fk", 422, "INVALID_REFERENCE"],
      ["23514", "organization_members_role_check", 422, "VALIDATION_ERROR"],
      ["ECONNREFUSED", undefined, 503, "DATABASE_UNAVAILABLE"],
      ["unknown", undefined, 500, "INTERNAL_ERROR"],
    ]) {
      await withApi({ query: async () => { throw Object.assign(new Error("secret SQL"), { code, constraint, detail: "secret email" }); } }, async base => {
        const response = await fetch(base + "/users");
        assert.equal(response.status, status);
        const result = await response.json();
        assert.equal(result.error.code, apiCode);
        assert.ok(!JSON.stringify(result).includes("secret"));
      });
    }
  } finally { log.mock.restore(); }
});

test("missing resources return 404; successful deletes return an empty 204", async () => {
  await withApi({ query: async () => ({ rows: [] }) }, async base => {
    assert.equal((await fetch(base + "/users/00000000-0000-0000-0000-000000000001")).status, 404);
  });
  await withApi({ query: async () => ({ rows: [{ id: "existing" }] }) }, async base => {
    const response = await fetch(base + "/organizations/00000000-0000-0000-0000-000000000001", { method: "DELETE" });
    assert.equal(response.status, 204);
    assert.equal(await response.text(), "");
  });
});
