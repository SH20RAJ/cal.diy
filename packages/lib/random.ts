import crypto from "node:crypto";

const CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const CHARACTERS_LENGTH = CHARACTERS.length;

/**
 * Generate a cryptographically random string of a given length using alphanumeric characters.
 */
export const randomString = function (length = 12) {
  const bytes = crypto.randomBytes(length);
  let result = "";

  for (let i = 0; i < length; i++) {
    result += CHARACTERS.charAt(bytes[i] % CHARACTERS_LENGTH);
  }

  return result;
};
