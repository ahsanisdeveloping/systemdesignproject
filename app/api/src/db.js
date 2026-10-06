const { loadEnvFile } = require("node:process");
const path = require("node:path");
const { Pool } = require("pg");

try {
  loadEnvFile(path.join(__dirname, "../.env"));
} catch (err) {
  if (err.code !== "ENOENT") throw err;
}

// One shared pool per API process. pg reads the PG* environment variables.
const pool = new Pool({
  database: process.env.PGDATABASE || "workflow_platform",
  max: 10,
  connectionTimeoutMillis: 3000,
  statement_timeout: 3000,
});

pool.on("error", (err) => {
  console.error("Idle PostgreSQL connection failed:", err.message);
});

module.exports = pool;
