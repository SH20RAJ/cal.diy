import { generateCreatorAIText } from "@lib/creatorcall/openai";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
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
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 400 });
  }
}
