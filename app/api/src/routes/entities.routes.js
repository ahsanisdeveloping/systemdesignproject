const express = require("express");
const entities = require("../repositories/entities");
const { body, uuid, pagination } = require("../lib/validation");
const { ApiError } = require("../lib/errors");

module.exports = function entityRouter(db, table, fields, label) {
  const router = express.Router();
  const repository = entities(db, table);
  const found = (row) => {
    if (!row) throw new ApiError(404, "NOT_FOUND", `${label} not found`);
    return row;
  };
  router.get("/", async (req, res) => {
    const page = pagination(req.query);
    res.json({ data: await repository.list(page), pagination: page });
  });
  router.post("/", async (req, res) => {
    const row = await repository.create(body(req, fields));
    res.location(`/api/v1/${table}/${row.id}`).status(201).json({ data: row });
  });
  router.get("/:id", async (req, res) => {
    res.json({ data: found(await repository.get(uuid(req.params.id, "id"))) });
  });
  router.patch("/:id", async (req, res) => {
    const id = uuid(req.params.id, "id");
    const data = body(req, fields, true);
    res.json({ data: found(await repository.update(id, data)) });
  });
  router.delete("/:id", async (req, res) => {
    found(await repository.remove(uuid(req.params.id, "id")));
    res.status(204).end();
  });
  return router;
};
