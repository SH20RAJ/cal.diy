import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import { prisma } from "@calcom/prisma";
import { buildLegacyRequest } from "@lib/buildLegacyCtx";
import { generateCreatorAIText } from "@lib/creatorcall/openai";
import { canUseCreatorAI } from "@lib/creatorcall/saas";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await getServerSession({
      req: buildLegacyRequest(await headers(), await cookies()),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { metadata: true },
    });

    if (!user || !canUseCreatorAI(user.metadata)) {
      return NextResponse.json(
        { error: "Creator AI requires a Pro plan and must be enabled in settings." },
        { status: 403 }
      );
    }

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
