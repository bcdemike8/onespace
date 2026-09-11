import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEYLEN = 64;

/**
 * A password as typed, minus the whitespace nobody meant to include.
 *
 * Starting passwords get shared over Slack and email, and copying one
 * picks up a trailing space or newline about as often as it doesn't. The
 * person pastes what they were given, it fails, and the message says the
 * email and password don't match - which is true and useless.
 *
 * Trimmed on the way in *and* on the way out, so the two always agree. A
 * password whose real first or last character is a space is not a thing
 * anyone has ever wanted.
 */
const clean = (password: string): string => password.trim();

/** Hash a password as `scrypt$<saltHex>$<hashHex>`. No native dependency. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(clean(password), salt, KEYLEN);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;

  const expected = Buffer.from(hashHex, "hex");
  const derived = await scrypt(clean(password), Buffer.from(saltHex, "hex"), KEYLEN);
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}
