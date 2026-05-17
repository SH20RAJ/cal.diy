import { describe, it, expect } from "vitest";
import { hashEmail, Sha256PiiHasher } from "./PiiHasher";

describe("PII Hasher Test Suite", () => {
  const hasher = new Sha256PiiHasher("test-salt");

  it("can hash email addresses deterministically and preserve domain", async () => {
    const email = "sensitive_data@example.com";
    const hashedEmail = hashEmail(email, hasher);
    // Domain must be preserved
    expect(hashedEmail.endsWith("@example.com")).toBe(true);
    // Local part should change
    expect(hashedEmail.split("@")[0]).not.toBe("sensitive_data");
    // Deterministic
    expect(hashEmail(email, hasher)).toBe(hashedEmail);
  });

  it("can hash PII deterministically to a 256-bit hex string", async () => {
    const pii = "sensitive_data";
    const hashedPii = hasher.hash(pii);
    // 256-bit hex (64 hex chars)
    expect(hashedPii).toMatch(/^[0-9a-f]{64}$/);
    // Deterministic
    expect(hasher.hash(pii)).toBe(hashedPii);
  });

  it("handles hashing with different salt", () => {
    const differentHasher = new Sha256PiiHasher("different-salt");
    const pii = "sensitive_data";
    const hashedPii = differentHasher.hash(pii);
    expect(hashedPii).not.toBe(hasher.hash(pii));
  });
});
