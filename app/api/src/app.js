const express = require("express");
const healthRouter = require("./routes/health.routes");

const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));

app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

app.use("/api/v1/health", healthRouter);

app.use((req, res) => {
  res.status(404).json({ error: { message: "Route not found" } });
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 500
    ? err.status
    : 500;

  if (status === 500) console.error(err);

  res.status(status).json({
    error: {
      message: status === 500 ? "Internal server error" : "Invalid request",
    },
  });
});

module.exports = app;
