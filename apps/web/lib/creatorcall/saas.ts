export type CreatorPlan = "free" | "pro";

export function getCreatorPlan(metadata: unknown): CreatorPlan {
  if (typeof metadata === "object" && metadata && "creatorPlan" in metadata) {
    return (metadata as { creatorPlan?: CreatorPlan }).creatorPlan === "pro" ? "pro" : "free";
  }
  return "free";
}

export function getCreatorBookingLimit(metadata: unknown): number {
  if (typeof metadata === "object" && metadata && "creatorMonthlyBookingLimit" in metadata) {
    const raw = Number((metadata as { creatorMonthlyBookingLimit?: number }).creatorMonthlyBookingLimit);
    if (Number.isFinite(raw) && raw > 0) return Math.floor(raw);
  }
  return 30;
}

export function canUseCreatorAI(metadata: unknown): boolean {
  const plan = getCreatorPlan(metadata);
  if (plan !== "pro") return false;

  if (typeof metadata === "object" && metadata && "creatorAiEnabled" in metadata) {
    return Boolean((metadata as { creatorAiEnabled?: boolean }).creatorAiEnabled);
  }

  return true;
}
