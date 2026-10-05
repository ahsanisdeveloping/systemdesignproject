const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

module.exports = router;
