const express = require("express");
const healthRouter = require("./routes/health.routes");
const { randomUUID } = require("node:crypto");
const pool = require("./db");
const entityRouter = require("./routes/entities.routes");
const membersRouter = require("./routes/members.routes");
const { ApiError, errorHandler } = require("./lib/errors");

function createApp(db = pool) {
  const app = express();

  app.disable("x-powered-by");
  app.disable("etag");
  app.use((req, res, next) => {
    req.requestId = randomUUID();
    res.set("X-Request-Id", req.requestId);
    res.set("Cache-Control", "no-store");
    next();
  });
  app.use(express.json({ limit: "100kb" }));

  app.get("/", (req, res) => {
    res.json({ message: "API is running" });
  });

  app.use("/api/v1/health", healthRouter);
  app.use("/health", healthRouter);
  app.use("/api/v1/users", entityRouter(db, "users", ["name", "email"], "User"));
  app.use("/api/v1/organizations/:organizationId/members", membersRouter(db));
  app.use("/api/v1/organizations", entityRouter(db, "organizations", ["name"], "Organization"));

  app.use((req, res, next) => {
    next(new ApiError(404, "NOT_FOUND", "Route not found"));
  });

  app.use(errorHandler);
  return app;
}

module.exports = createApp();
module.exports.createApp = createApp;
