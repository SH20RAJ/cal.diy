"use client";

import { Button } from "@calcom/ui/components/button";
import type { ReactNode } from "react";
import { useState } from "react";

export function CreatorAIAgendaView() {
  const [creatorNiche, setCreatorNiche] = useState("");
  const [sessionType, setSessionType] = useState("1:1 Call");
  const [attendeeGoal, setAttendeeGoal] = useState("");
  const [notes, setNotes] = useState("");
  const [agenda, setAgenda] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const generateAgenda = async () => {
    setLoading(true);
    setError("");
    setAgenda("");

    try {
      const response = await fetch("/api/creatorcall/ai/agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorNiche, sessionType, attendeeGoal, notes }),
      });
      const data = (await response.json()) as { agenda?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to generate agenda");
      }

      setAgenda(data.agenda || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate agenda");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CreatorAIFormShell
      title="AI Agenda Generator"
      description="Prepare a focused agenda before a paid creator call."
      result={agenda}
      error={error}>
      <TextInput
        label="Creator niche"
        value={creatorNiche}
        onChange={setCreatorNiche}
        placeholder="Fitness, design, marketing"
      />
      <SessionTypeSelect value={sessionType} onChange={setSessionType} />
      <TextInput
        label="Attendee goal"
        value={attendeeGoal}
        onChange={setAttendeeGoal}
        placeholder="What should the attendee leave with?"
      />
      <TextareaInput
        label="Notes"
        value={notes}
        onChange={setNotes}
        placeholder="Add helpful context"
        rows={4}
      />
      <Button onClick={generateAgenda} disabled={loading || !creatorNiche} color="primary">
        {loading ? "Generating..." : "Generate agenda"}
      </Button>
    </CreatorAIFormShell>
  );
}

function CreatorAIFormShell({
  title,
  description,
  result,
  error,
  children,
}: {
  title: string;
  description: string;
  result: string;
  error: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-emphasis text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-subtle mt-1 text-sm">{description}</p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="border-subtle bg-default space-y-4 rounded-md border p-5">{children}</div>
        <div className="border-subtle bg-default min-h-72 rounded-md border p-5">
          {error ? <p className="text-error text-sm">{error}</p> : null}
          {result ? (
            <pre className="text-default whitespace-pre-wrap text-sm leading-6">{result}</pre>
          ) : (
            <p className="text-subtle text-sm">Generated output will appear here.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="text-emphasis mb-1 block text-sm font-medium">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="border-default bg-default w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </label>
  );
}

function TextareaInput({
  label,
  value,
  onChange,
  placeholder,
  rows,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows: number;
}) {
  return (
    <label className="block">
      <span className="text-emphasis mb-1 block text-sm font-medium">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="border-default bg-default w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </label>
  );
}

function SessionTypeSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-emphasis mb-1 block text-sm font-medium">Session type</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border-default bg-default w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option>1:1 Call</option>
        <option>Consultation</option>
        <option>Mentorship</option>
      </select>
    </label>
  );
}

export { CreatorAIFormShell, SessionTypeSelect, TextInput, TextareaInput };
