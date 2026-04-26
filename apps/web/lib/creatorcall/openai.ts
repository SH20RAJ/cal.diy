type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
};

const OPENAI_API_URL = process.env.OPENAI_API_URL || "https://api.openai.com/v1/responses";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

function extractText(payload: OpenAIResponse): string {
  if (payload.output_text && payload.output_text.trim().length > 0) {
    return payload.output_text.trim();
  }

  const chunks = payload.output
    ?.flatMap((item) => item.content || [])
    .map((content) => content.text || "")
    .filter(Boolean);

  return (chunks || []).join("\n").trim();
}

export async function generateCreatorAIText({
  systemPrompt,
  userPrompt,
}: {
  systemPrompt: string;
  userPrompt: string;
}): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.4,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: systemPrompt }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: userPrompt }],
        },
      ],
    }),
  });

  if (!response.ok) {
    const raw = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${raw}`);
  }

  const payload = (await response.json()) as OpenAIResponse;
  const text = extractText(payload);

  if (!text) {
    throw new Error("Empty response from OpenAI");
  }

  return text;
}
