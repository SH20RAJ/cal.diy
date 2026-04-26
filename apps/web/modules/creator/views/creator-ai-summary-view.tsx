"use client";

import { Button } from "@calcom/ui/components/button";
import { useState } from "react";
import { CreatorAIFormShell, SessionTypeSelect, TextareaInput } from "./creator-ai-agenda-view";

export function CreatorAISummaryView() {
  const [sessionType, setSessionType] = useState("1:1 Call");
  const [transcript, setTranscript] = useState("");
  const [notes, setNotes] = useState("");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const generateSummary = async () => {
    setLoading(true);
    setError("");
    setSummary("");

    try {
      const response = await fetch("/api/creatorcall/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionType, transcript, notes }),
      });
      const data = (await response.json()) as { summary?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to generate summary");
      }

      setSummary(data.summary || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate summary");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CreatorAIFormShell
      title="Post-Call Summary"
      description="Turn creator call notes into a clean summary and action list."
      result={summary}
      error={error}>
      <SessionTypeSelect value={sessionType} onChange={setSessionType} />
      <TextareaInput
        label="Transcript or notes"
        value={transcript}
        onChange={setTranscript}
        placeholder="Paste a transcript or key discussion points"
        rows={7}
      />
      <TextareaInput
        label="Private notes"
        value={notes}
        onChange={setNotes}
        placeholder="Add decisions, observations, or promised follow-ups"
        rows={4}
      />
      <Button onClick={generateSummary} disabled={loading || !transcript} color="primary">
        {loading ? "Generating..." : "Generate summary"}
      </Button>
    </CreatorAIFormShell>
  );
}
