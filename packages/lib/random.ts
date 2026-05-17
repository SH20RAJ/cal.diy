import { randomBytes } from "node:crypto";

/**
 * Generate a cryptographically secure random string of a given length using alphanumeric characters.
 */
export const randomString = function (length = 12) {
  // Generate enough random bytes and filter to alphanumeric characters
  const CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  while (result.length < length) {
    const bytes = randomBytes(length);
    for (let i = 0; i < bytes.length && result.length < length; i++) {
      const char = CHARACTERS[bytes[i] % CHARACTERS.length];
      result += char;
    }
  }
  return result;
};
