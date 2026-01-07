import crypto from "crypto";

const keyB64 = process.env.WIFI_ENCRYPTION_KEY_BASE64;

function getKey(): Buffer {
  if (!keyB64) throw new Error("Missing WIFI_ENCRYPTION_KEY_BASE64");
  return Buffer.from(keyB64, "base64");
}

export function encryptWifiPassword(plain: string): string {
  const KEY = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("base64")}.${ciphertext.toString("base64")}.${tag.toString("base64")}`;
}

export function decryptWifiPassword(packed: string): string {
  const KEY = getKey();
  const [ivB64, ctB64, tagB64] = packed.split(".");
  if (!ivB64 || !ctB64 || !tagB64) throw new Error("Invalid encrypted format");

  const iv = Buffer.from(ivB64, "base64");
  const ciphertext = Buffer.from(ctB64, "base64");
  const tag = Buffer.from(tagB64, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plain.toString("utf8");
}
