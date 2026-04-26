import { NextResponse } from "next/server";

import { generateCreatorAIText } from "@/lib/creatorcall/openai";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      creatorNiche?: string;
      sessionType?: string;
      attendeeGoal?: string;
      notes?: string;
    };

    const systemPrompt =
      "You generate concise, actionable pre-call agendas for creator calls. Return markdown with sections and bullet points.";

    const userPrompt = [
      `Creator niche: ${body.creatorNiche || "General creator"}`,
      `Session type: ${body.sessionType || "1:1 Call"}`,
      `Attendee goal: ${body.attendeeGoal || "Not provided"}`,
      `Additional notes: ${body.notes || "None"}`,
      "Build a 30-60 minute agenda with: objectives, timeline, key questions, and expected outcomes.",
    ].join("\n");

    const agenda = await generateCreatorAIText({ systemPrompt, userPrompt });

    return NextResponse.json({ agenda });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate agenda" },
      { status: 400 }
    );
  }
}
