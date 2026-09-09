import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
const directory = mkdtempSync(join(tmpdir(), "velora-browser-"));
process.env.DATA_DIR = directory;
process.env.APP_ORIGIN = "http://127.0.0.1:4173";
process.env.PORT = "4173";
const { db } = await import("../server/db.js");
const { passwordHash } = await import("../server/security.js");
// This account exists only in the isolated, temporary browser-test database.
db.prepare(
  "INSERT INTO users (id,name,email,password,role,totp,created) VALUES (?,?,?,?,?,?,?)",
).run(
  randomUUID(),
  "Browser Admin",
  "browser-admin@example.test",
  await passwordHash("Browser-test-passphrase-582!"),
  "admin",
  "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",
  new Date().toISOString(),
);
await import("../server/index.js");
process.on("exit", () => {
  db.close();
  rmSync(directory, { recursive: true, force: true });
});
process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));
