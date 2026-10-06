const express = require("express");
const { body, uuid, pagination } = require("../lib/validation");
const { ApiError } = require("../lib/errors");

module.exports = function membersRouter(db) {
  const router = express.Router({ mergeParams: true });
  const columns = "user_id, organization_id, role, created_at";
  const found = (row) => {
    if (!row) throw new ApiError(404, "NOT_FOUND", "Membership not found in this organization");
    return row;
  };
  router.use(async (req, res, next) => {
    req.organizationId = uuid(req.params.organizationId, "organizationId");
    const result = await db.query("SELECT id FROM organizations WHERE id = $1", [req.organizationId]);
    if (!result.rows.length) throw new ApiError(404, "NOT_FOUND", "Organization not found");
    next();
  });
  router.get("/", async (req, res) => {
    const page = pagination(req.query);
    const result = await db.query(`SELECT ${columns} FROM organization_members WHERE organization_id = $1 ORDER BY created_at, user_id LIMIT $2 OFFSET $3`, [req.organizationId, page.limit, page.offset]);
    res.json({ data: result.rows, pagination: page });
  });
  router.post("/", async (req, res) => {
    const data = body(req, ["user_id", "role"]);
    const result = await db.query(`INSERT INTO organization_members (user_id, organization_id, role) VALUES ($1, $2, $3) RETURNING ${columns}`, [data.user_id, req.organizationId, data.role]);
    const row = result.rows[0];
    res.location(`/api/v1/organizations/${req.organizationId}/members/${row.user_id}`).status(201).json({ data: row });
  });
  router.get("/:userId", async (req, res) => {
    const userId = uuid(req.params.userId, "userId");
    const result = await db.query(`SELECT ${columns} FROM organization_members WHERE organization_id = $1 AND user_id = $2`, [req.organizationId, userId]);
    res.json({ data: found(result.rows[0]) });
  });
  router.patch("/:userId", async (req, res) => {
    const userId = uuid(req.params.userId, "userId");
    const data = body(req, ["role"], true);
    const result = await db.query(`UPDATE organization_members SET role = $3 WHERE organization_id = $1 AND user_id = $2 RETURNING ${columns}`, [req.organizationId, userId, data.role]);
    res.json({ data: found(result.rows[0]) });
  });
  router.delete("/:userId", async (req, res) => {
    const userId = uuid(req.params.userId, "userId");
    const result = await db.query("DELETE FROM organization_members WHERE organization_id = $1 AND user_id = $2 RETURNING user_id", [req.organizationId, userId]);
    found(result.rows[0]);
    res.status(204).end();
  });
  return router;
};
