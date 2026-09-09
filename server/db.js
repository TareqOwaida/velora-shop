import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { products } from "../src/data/products.js";

const directory = resolve(process.env.DATA_DIR || "data");
mkdirSync(directory, { recursive: true, mode: 0o700 });
export const db = new DatabaseSync(resolve(directory, "velora.sqlite"));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer','admin')), totp TEXT, created TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE CASCADE, csrf TEXT NOT NULL, expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS inventory (id TEXT PRIMARY KEY, stock INTEGER NOT NULL CHECK(stock>=0));
 CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), request_key TEXT NOT NULL, payload TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Processing', created TEXT NOT NULL, UNIQUE(user_id, request_key));
 CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY, user_id TEXT NOT NULL, action TEXT NOT NULL, target TEXT NOT NULL, created TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS login_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS used_totp (user_id TEXT PRIMARY KEY, counter INTEGER NOT NULL);
`);
const seed = db.prepare(
  "INSERT OR IGNORE INTO inventory (id, stock) VALUES (?, ?)",
);
for (const product of products) seed.run(product.id, 40);
export function transaction(fn) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
