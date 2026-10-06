const app = require("./app");
const pool = require("./db");

const port = Number(process.env.PORT ?? 5000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535");
}

const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

server.on("error", async (err) => {
  console.error("Failed to start server:", err.message);
  process.exitCode = 1;
  await pool.end();
});

let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`${signal} received. Closing HTTP server.`);
  const timeout = setTimeout(() => process.exit(1), 10000);
  timeout.unref();

  server.close(async (err) => {
    if (err) {
      console.error("Failed to close server:", err.message);
      process.exitCode = 1;
    }
    try {
      await pool.end();
    } catch (dbError) {
      console.error("Failed to close database pool:", dbError.message);
      process.exitCode = 1;
    } finally {
      clearTimeout(timeout);
    }
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
