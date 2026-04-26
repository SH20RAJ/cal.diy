import { NextResponse } from "next/server";

import { generateCreatorAIText } from "@/lib/creatorcall/openai";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      creatorNiche?: string;
      targetAudience?: string;
      timezone?: string;
      recentBookingsCount?: number;
      currentPriceCents?: number;
      availableSlots?: string[];
    };

    const systemPrompt =
      "You are a revenue and scheduling assistant for creators. Suggest profitable scheduling windows and pricing guidance.";

    const userPrompt = [
      `Creator niche: ${body.creatorNiche || "General creator"}`,
      `Target audience: ${body.targetAudience || "Global"}`,
      `Timezone: ${body.timezone || "UTC"}`,
      `Recent bookings count: ${body.recentBookingsCount ?? 0}`,
      `Current price (USD cents): ${body.currentPriceCents ?? 0}`,
      `Available slots: ${(body.availableSlots || []).join(", ") || "Not provided"}`,
      "Return markdown with sections: Best Time Slots, Pricing Recommendation, and Experiments for next 14 days.",
    ].join("\n");

    const suggestions = await generateCreatorAIText({ systemPrompt, userPrompt });

    return NextResponse.json({ suggestions });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate suggestions" },
      { status: 400 }
    );
  }
}
