"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface Props {
  id: string;
  lastMeetingAt: string | null; // YYYY-MM-DD or null
  nextMeetingAt: string | null;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function relativeLabel(iso: string | null): string | null {
  if (!iso) return null;
  const today = new Date(todayIso() + "T00:00:00Z").getTime();
  const day = new Date(iso + "T00:00:00Z").getTime();
  const days = Math.round((day - today) / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  if (days > 0 && days < 7) return `in ${days}d`;
  if (days > 0 && days < 30) return `in ${Math.round(days / 7)}w`;
  if (days > 0) return `in ${Math.round(days / 30)}mo`;
  if (days < 0 && days > -7) return `${-days}d ago`;
  if (days < 0 && days > -30) return `${Math.round(-days / 7)}w ago`;
  return `${Math.round(-days / 30)}mo ago`;
}

/**
 * Compact last-meeting / next-meeting date inputs. Shown inside each sidebar
 * row. Saves on change via PATCH /api/assessments?id=X.
 *
 * Kept deliberately tiny so it doesn't bloat the sidebar. Click the label to
 * focus the native date picker; visible in both empty and filled states.
 */
export function MeetingInputs({
  id,
  lastMeetingAt,
  nextMeetingAt,
}: Props) {
  const router = useRouter();
  const [last, setLast] = useState(lastMeetingAt ?? "");
  const [next, setNext] = useState(nextMeetingAt ?? "");
  const [busy, setBusy] = useState<"last" | "next" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const savedRef = useRef({ last: lastMeetingAt ?? "", next: nextMeetingAt ?? "" });

  // If the server-rendered value changes (e.g. after refresh), pick it up.
  useEffect(() => {
    setLast(lastMeetingAt ?? "");
    setNext(nextMeetingAt ?? "");
    savedRef.current = { last: lastMeetingAt ?? "", next: nextMeetingAt ?? "" };
  }, [lastMeetingAt, nextMeetingAt]);

  const save = async (field: "last" | "next", value: string) => {
    const prev = savedRef.current[field];
    if (value === prev) return;
    setBusy(field);
    setErr(null);
    try {
      const payload =
        field === "last"
          ? { last_meeting_at: value || null }
          : { next_meeting_at: value || null };
      const res = await fetch(
        `/api/assessments?id=${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      savedRef.current = { ...savedRef.current, [field]: value };
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
      // Roll back UI
      if (field === "last") setLast(prev);
      else setNext(prev);
    } finally {
      setBusy(null);
    }
  };

  // Stop clicks from bubbling up to the <Link> that wraps the sidebar row.
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  const nextRel = relativeLabel(next);
  const lastRel = relativeLabel(last);

  return (
    <div
      className="mt-1.5 flex items-center gap-3 text-[11px]"
      onClick={stop}
      onMouseDown={stop}
      onPointerDown={stop}
    >
      <label className="flex items-center gap-1 text-dim">
        <span className="uppercase tracking-wide">Last</span>
        <input
          type="date"
          value={last}
          onChange={(e) => {
            setLast(e.target.value);
            save("last", e.target.value);
          }}
          onClick={stop}
          onMouseDown={stop}
          onKeyDown={stop}
          className="bg-transparent border-0 outline-none text-fg focus:text-accent appearance-none w-auto px-0 cursor-pointer"
          aria-label="Last meeting"
          disabled={busy === "last"}
        />
        {lastRel && <span className="text-dim">· {lastRel}</span>}
      </label>
      <label className="flex items-center gap-1 text-dim">
        <span className="uppercase tracking-wide">Next</span>
        <input
          type="date"
          value={next}
          onChange={(e) => {
            setNext(e.target.value);
            save("next", e.target.value);
          }}
          onClick={stop}
          onMouseDown={stop}
          onKeyDown={stop}
          className="bg-transparent border-0 outline-none text-fg focus:text-accent appearance-none w-auto px-0 cursor-pointer"
          aria-label="Next meeting"
          disabled={busy === "next"}
        />
        {nextRel && (
          <span className="text-accent font-medium">· {nextRel}</span>
        )}
      </label>
      {err && <span className="text-bad">err</span>}
    </div>
  );
}
