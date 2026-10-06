const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
  res.set("Cache-Control", "no-store");
  try {
    await pool.query("SELECT NOW()");
  } catch (err) {
    console.error("Database health check failed:", err.message);
    return res.status(503).json({ status: "error", database: "disconnected" });
  }

  res.status(200).json({
    status: "ok",
    database: "connected",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

module.exports = router;
