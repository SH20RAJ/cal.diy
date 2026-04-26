"use client";

import { trpc } from "@calcom/trpc/react";
import { Button } from "@calcom/ui/components/button";
import { canUseCreatorAI } from "@lib/creatorcall/saas";
import { useState } from "react";
import { CreatorAIFormShell, TextInput } from "./creator-ai-agenda-view";

function getCreatorNiche(metadata: unknown) {
  if (typeof metadata !== "object" || !metadata || !("creatorNiche" in metadata)) return "General creator";
  return String((metadata as { creatorNiche?: unknown }).creatorNiche || "General creator");
}

export function CreatorAISuggestionsView() {
  const { data: user } = trpc.viewer.me.get.useQuery();
  const [targetAudience, setTargetAudience] = useState("");
  const [timezone, setTimezone] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const creatorNiche = getCreatorNiche(user?.metadata);
  const aiEnabled = canUseCreatorAI(user?.metadata);

  const generateSuggestions = async () => {
    setLoading(true);
    setError("");
    setSuggestions("");

    try {
      const response = await fetch("/api/creatorcall/ai/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorNiche, targetAudience, timezone }),
      });
      const data = (await response.json()) as { suggestions?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to generate suggestions");
      }

      setSuggestions(data.suggestions || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate suggestions");
    } finally {
      setLoading(false);
    }
  };

  if (!aiEnabled) {
    return (
      <div className="flex min-h-96 flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-emphasis text-2xl font-bold">Smart Suggestions</h1>
        <p className="text-subtle max-w-md text-sm">
          Smart pricing and scheduling recommendations are available on the CreatorCall Pro plan.
        </p>
      </div>
    );
  }

  return (
    <CreatorAIFormShell
      title="Smart Suggestions"
      description="Get pricing and scheduling ideas for your creator niche."
      result={suggestions}
      error={error}>
      <TextInput
        label="Target audience"
        value={targetAudience}
        onChange={setTargetAudience}
        placeholder="Startup founders, freelancers, students"
      />
      <TextInput label="Timezone" value={timezone} onChange={setTimezone} placeholder="America/New_York" />
      <Button onClick={generateSuggestions} disabled={loading} color="primary">
        {loading ? "Generating..." : "Get suggestions"}
      </Button>
    </CreatorAIFormShell>
  );
}
