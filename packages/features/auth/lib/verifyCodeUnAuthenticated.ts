import { createHash } from "node:crypto";

import { checkRateLimitAndThrowError } from "@calcom/lib/checkRateLimitAndThrowError";
import { hashEmail } from "@calcom/lib/server/PiiHasher";
import { totpRawCheck } from "@calcom/lib/totp";

export const verifyCodeUnAuthenticated = async (email: string, code: string) => {
  if (!email || !code) {
    throw new Error("Email and code are required");
  }

  await checkRateLimitAndThrowError({
    rateLimitingType: "core",
    identifier: `emailVerifyCode.${hashEmail(email)}`,
  });

  const encryptionKey = process.env.CALENDSO_ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error("CALENDSO_ENCRYPTION_KEY environment variable is not set");
  }

  const secret = createHash("sha256")
    .update(email + encryptionKey)
    .digest("hex");

  const isValidToken = totpRawCheck(code, secret, { step: 900 });

  if (!isValidToken) {
    throw new Error("Invalid verification code");
  }

  return true;
};
