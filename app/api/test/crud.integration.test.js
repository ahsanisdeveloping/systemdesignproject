const assert = require("node:assert/strict");
const { test } = require("node:test");
const { randomUUID } = require("node:crypto");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { once } = require("node:events");
const { createApp } = require("../src/app");
const defaultPool = require("../src/db");
const { Pool } = require("pg");

test("CRUD, concurrent duplicates, organization scoping, and cascades against PostgreSQL", async () => {
  const schema = `crud_test_${randomUUID().replaceAll("-", "")}`;
  assert.match(schema, /^crud_test_[a-f0-9]{32}$/);
  const config = { database: process.env.PGDATABASE || "workflow_platform", connectionTimeoutMillis: 3000 };
  const admin = new Pool(config);
  const db = new Pool({ ...config, options: `-c search_path=${schema}` });
  let server;
  let created = false;
  try {
    await admin.query(`CREATE SCHEMA "${schema}"`);
    created = true;
    await db.query(readFileSync(path.join(__dirname, "../../../apps/api/sql/001_initial_schema.sql"), "utf8"));
    server = createApp(db).listen(0, "127.0.0.1");
    await once(server, "listening");
    const base = `http://127.0.0.1:${server.address().port}/api/v1`;
    async function request(method, route, body, status = 200) {
      const response = await fetch(base + route, {
        method, ...(body !== undefined ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
      });
      const result = response.status === 204 ? await response.text() : await response.json();
      assert.equal(response.status, status, `${method} ${route}: ${JSON.stringify(result)}`);
      return result;
    }
    const user = (await request("POST", "/users", { name: " Ahsan ", email: " AHSAN@EXAMPLE.COM " }, 201)).data;
    assert.equal(user.name, "Ahsan");
    assert.equal(user.email, "ahsan@example.com");
    assert.match(user.id, /^[a-f0-9-]{36}$/);
    assert.ok(!Number.isNaN(Date.parse(user.created_at)));
    const first = (await request("POST", "/organizations", { name: "AlgoritX" }, 201)).data;
    const second = (await request("POST", "/organizations", { name: "AlgoritX" }, 201)).data;
    assert.notEqual(first.id, second.id);
    const members = `/organizations/${first.id}/members`;
    const otherMembers = `/organizations/${second.id}/members`;
    await request("POST", members, { user_id: user.id, role: "developer" }, 201);
    await request("POST", members, { user_id: user.id, role: "developer" }, 409);
    await request("POST", members, { user_id: randomUUID(), role: "developer" }, 422);
    await request("POST", members, { user_id: user.id, role: "superman" }, 422);
    await request("POST", members, { user_id: user.id, role: "owner", organization_id: second.id }, 422);
    await request("GET", `${otherMembers}/${user.id}`, undefined, 404);
    await request("PATCH", `${otherMembers}/${user.id}`, { role: "admin" }, 404);
    await request("DELETE", `${otherMembers}/${user.id}`, undefined, 404);
    assert.equal((await request("GET", `${members}/${user.id}`)).data.role, "developer");
    await request("POST", otherMembers, { user_id: user.id, role: "owner" }, 201);
    assert.equal((await request("PATCH", `${members}/${user.id}`, { role: "admin" })).data.role, "admin");
    assert.equal((await request("GET", `${otherMembers}/${user.id}`)).data.role, "owner");
    const memberList = await request("GET", members + "?limit=1&offset=0");
    assert.equal(memberList.data.length, 1);
    assert.deepEqual(memberList.pagination, { limit: 1, offset: 0 });
    assert.equal((await request("GET", "/users")).data.length, 1);
    assert.equal((await request("GET", "/organizations?limit=1&offset=1")).data.length, 1);
    assert.equal((await request("GET", `/users/${user.id}`)).data.id, user.id);
    assert.equal((await request("GET", `/organizations/${first.id}`)).data.name, "AlgoritX");
    assert.equal((await request("PATCH", `/users/${user.id}`, { name: "Ahsan Updated" })).data.email, user.email);
    assert.equal((await request("PATCH", `/organizations/${first.id}`, { name: "AlgoritX Updated" })).data.name, "AlgoritX Updated");
    const duplicates = await Promise.all([1, 2].map(() => fetch(base + "/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Concurrent", email: "race@example.com" }) })));
    assert.deepEqual(duplicates.map(response => response.status).sort(), [201, 409]);
    await Promise.all(duplicates.map(response => response.arrayBuffer()));
    await assert.rejects(db.query("UPDATE organization_members SET role = $1 WHERE user_id = $2", ["superman", user.id]), { code: "23514" });
    await assert.rejects(db.query("INSERT INTO users (name, email) VALUES ($1, $2)", [null, "null@example.com"]), { code: "23502" });
    await assert.rejects(db.query("INSERT INTO users (name, email) VALUES ($1, $2)", ["Case", "UPPER@example.com"]), { code: "23514" });
    await request("DELETE", `${members}/${user.id}`, undefined, 204);
    assert.equal((await request("GET", members)).data.length, 0);
    await request("POST", members, { user_id: user.id, role: "developer" }, 201);
    await request("DELETE", `/organizations/${first.id}`, undefined, 204);
    await request("GET", members, undefined, 404);
    assert.equal((await request("GET", `/users/${user.id}`)).data.id, user.id);
    assert.equal((await db.query("SELECT * FROM organization_members WHERE organization_id = $1", [first.id])).rowCount, 0);
    await request("DELETE", `/users/${user.id}`, undefined, 204);
    await request("GET", `/users/${user.id}`, undefined, 404);
    await request("PATCH", `/users/${user.id}`, { name: "Missing" }, 404);
    await request("DELETE", `/users/${user.id}`, undefined, 404);
    assert.equal((await request("GET", otherMembers)).data.length, 0);
    assert.equal((await request("GET", `/organizations/${second.id}`)).data.id, second.id);
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    await db.end();
    if (created) await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
    await admin.end();
    await defaultPool.end();
  }
});
