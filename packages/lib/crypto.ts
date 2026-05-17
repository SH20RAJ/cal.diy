import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const INPUT_ENCODING = "utf8";
const OUTPUT_ENCODING = "hex";
const IV_LENGTH = 12; // GCM recommended IV length

/**
 *
 * @param text Value to be encrypted
 * @param key Key used to encrypt value must be 32 bytes for AES256 encryption algorithm
 *
 * @returns Encrypted value using key (format: iv:authTag:ciphertext)
 */
export const symmetricEncrypt = function (text: string, key: string) {
  const _key = Buffer.from(key, "latin1");
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, _key, iv);
  let ciphered = cipher.update(text, INPUT_ENCODING, OUTPUT_ENCODING);
  ciphered += cipher.final(OUTPUT_ENCODING);
  const authTag = cipher.getAuthTag().toString(OUTPUT_ENCODING);
  const ciphertext = `${iv.toString(OUTPUT_ENCODING)}:${authTag}:${ciphered}`;

  return ciphertext;
};

/**
 *
 * @param text Value to decrypt (format: iv:authTag:ciphertext for GCM, iv:ciphertext for legacy CBC)
 * @param key Key used to decrypt value must be 32 bytes for AES256 encryption algorithm
 */
export const symmetricDecrypt = function (text: string, key: string) {
  const _key = Buffer.from(key, "latin1");

  const components = text.split(":");

  // Legacy CBC format: iv:ciphertext (2 components, IV is 16 bytes / 32 hex chars)
  if (components.length === 2) {
    const iv_from_ciphertext = Buffer.from(components[0], OUTPUT_ENCODING);
    const decipher = crypto.createDecipheriv("aes256", _key, iv_from_ciphertext);
    let deciphered = decipher.update(components[1], OUTPUT_ENCODING, INPUT_ENCODING);
    deciphered += decipher.final(INPUT_ENCODING);
    return deciphered;
  }

  // GCM format: iv:authTag:ciphertext (3 components, IV is 12 bytes / 24 hex chars)
  const iv_from_ciphertext = Buffer.from(components.shift() || "", OUTPUT_ENCODING);
  const authTag = Buffer.from(components.shift() || "", OUTPUT_ENCODING);
  const decipher = crypto.createDecipheriv(ALGORITHM, _key, iv_from_ciphertext);
  decipher.setAuthTag(authTag);
  let deciphered = decipher.update(components.join(":"), OUTPUT_ENCODING, INPUT_ENCODING);
  deciphered += decipher.final(INPUT_ENCODING);

  return deciphered;
};
