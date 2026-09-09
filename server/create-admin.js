import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db, transaction } from "./db.js";
import { newTotpSecret, passwordHash, verifyTotp } from "./security.js";

// This command is available only to the operator with server filesystem access.
let mute = false;
const output = new Writable({
  write(chunk, encoding, callback) {
    if (!mute) process.stdout.write(chunk, encoding);
    callback();
  },
});
const rl = createInterface({ input: process.stdin, output, terminal: true });
try {
  const name = (await rl.question("Administrator name: ")).trim();
  const email = (await rl.question("Administrator email: "))
    .trim()
    .toLowerCase();
  process.stdout.write("Password (12–128 characters, hidden): ");
  mute = true;
  const password = await rl.question("");
  mute = false;
  process.stdout.write("\n");
  z.object({
    name: z.string().min(2).max(80),
    email: z.email().max(254),
    password: z.string().min(12).max(128),
  }).parse({ name, email, password });
  if (db.prepare("SELECT id FROM users WHERE email=?").get(email))
    throw new Error(
      "An account with that email already exists. Use a separate staff email.",
    );
  const secret = newTotpSecret();
  console.log(
    "\nAdd this setup key to your authenticator app (time-based, 6 digits):\n" +
      secret,
  );
  console.log(
    "Keep this key private. Save it in your password manager for recovery.",
  );
  const code = (
    await rl.question("Enter the 6-digit code to confirm setup: ")
  ).trim();
  if (verifyTotp(secret, code) === null)
    throw new Error("Code did not match. No administrator was created.");
  const passwordDigest = await passwordHash(password),
    id = randomUUID();
  transaction(() => {
    db.prepare(
      "INSERT INTO users (id,name,email,password,role,totp,created) VALUES (?,?,?,?,?,?,?)",
    ).run(
      id,
      name,
      email,
      passwordDigest,
      "admin",
      secret,
      new Date().toISOString(),
    );
    db.prepare(
      "INSERT INTO audit (user_id,action,target,created) VALUES (?,?,?,?)",
    ).run(
      id,
      "Administrator provisioned using local CLI",
      id,
      new Date().toISOString(),
    );
  });
  console.log(
    "\nAdministrator created. Sign in at /admin using your password and authenticator code.",
  );
} catch (error) {
  mute = false;
  console.error(
    "\n" +
      (error.issues
        ? "Invalid account details. Check name, email, and password length."
        : error.message),
  );
  process.exitCode = 1;
} finally {
  rl.close();
  db.close();
}
