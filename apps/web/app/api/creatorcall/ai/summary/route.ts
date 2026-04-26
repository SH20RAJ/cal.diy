import { generateCreatorAIText } from "@lib/creatorcall/openai";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
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
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to generate summary" }, { status: 400 });
  }
}
