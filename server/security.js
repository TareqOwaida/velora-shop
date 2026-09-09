import {
  createHash,
  createHmac,
  randomBytes,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
const derive = promisify(scrypt);
export const hash = (value) => createHash("sha256").update(value).digest("hex");
export const token = () => randomBytes(32).toString("hex");
const options = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
export async function passwordHash(password) {
  const salt = randomBytes(16).toString("hex");
  const result = await derive(password, salt, 64, options);
  return `${salt}:${result.toString("hex")}`;
}
export async function verifyPassword(password, stored) {
  const [salt, expected] = stored.split(":");
  const result = await derive(password, salt, 64, options);
  return timingSafeEqual(result, Buffer.from(expected, "hex"));
}
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function newTotpSecret() {
  let bits = "";
  for (const byte of randomBytes(20)) bits += byte.toString(2).padStart(8, "0");
  return bits
    .match(/.{5}/g)
    .map((chunk) => alphabet[parseInt(chunk, 2)])
    .join("");
}
export function totpCode(secret, counter) {
  const bits = [...secret]
    .map((c) => alphabet.indexOf(c).toString(2).padStart(5, "0"))
    .join("");
  const key = Buffer.from(
    bits.match(/.{8}/g).map((chunk) => parseInt(chunk, 2)),
  );
  const data = Buffer.alloc(8);
  data.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", key).update(data).digest();
  const offset = digest[19] & 15;
  return ((digest.readUInt32BE(offset) & 0x7fffffff) % 1000000)
    .toString()
    .padStart(6, "0");
}
export function verifyTotp(secret, code, lastCounter = -1) {
  if (!/^\d{6}$/.test(code || "")) return null;
  const now = Math.floor(Date.now() / 30000);
  for (const counter of [now, now - 1, now + 1]) {
    if (
      counter > lastCounter &&
      timingSafeEqual(Buffer.from(totpCode(secret, counter)), Buffer.from(code))
    )
      return counter;
  }
  return null;
}
