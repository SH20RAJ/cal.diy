import { NextResponse } from "next/server";

import { generateCreatorAIText } from "@/lib/creatorcall/openai";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      transcript?: string;
      notes?: string;
      sessionType?: string;
    };

    const systemPrompt =
      "You produce post-call summaries for creator businesses. Keep language practical and convert notes into clear actions.";

    const userPrompt = [
      `Session type: ${body.sessionType || "Creator call"}`,
      `Transcript: ${body.transcript || "No transcript provided"}`,
      `Notes: ${body.notes || "No notes provided"}`,
      "Return markdown with sections: Summary, Key Decisions, Action Items (Owner + Due Date placeholders).",
    ].join("\n");

    const summary = await generateCreatorAIText({ systemPrompt, userPrompt });

    return NextResponse.json({ summary });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate summary" },
      { status: 400 }
    );
  }
}
