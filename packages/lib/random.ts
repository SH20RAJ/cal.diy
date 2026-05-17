import crypto from "node:crypto";

/**
 * Generate a cryptographically secure random string of a given length using alphanumeric characters.
 */
export const randomString = function (length = 12) {
  return crypto.randomBytes(length).toString("base64url").slice(0, length);
};
