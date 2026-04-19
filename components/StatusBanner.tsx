"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AssessmentStatus } from "@/lib/types";

interface Props {
  id: string;
  status: AssessmentStatus;
  errorMessage: string | null;
  /** ISO timestamp of the row's last updated_at — used to detect stuck research. */
  updatedAt: string;
}

/**
 * Shows a banner at the top of the detail view when an assessment is pending,
 * researching, or errored.
 *
 * Also owns the client-side trigger for the research API: when a row shows up
 * as `pending`, StatusBanner fires POST /api/research once. This belt-and-braces
 * the fire-and-forget call in /api/intake — it works even if that call was
 * dropped, or if the user opens the page later.
 *
 * Polls every 5s and router.refresh() so server data updates.
 */
export function StatusBanner({ id, status, errorMessage, updatedAt }: Props) {
  const router = useRouter();
  const triggered = useRef<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  // Seconds since last write — >120s with status=researching = probably stuck on
  // hobby plan (60s function timeout). Gives the user a retry button.
  const ageSec = Math.floor((Date.now() - new Date(updatedAt).getTime()) / 1000);
  const stuck = status === "researching" && ageSec > 120;

  const triggerResearch = async () => {
    try {
      setRetrying(true);
      await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      // ignore — server-side recovery will still work on next poll
    } finally {
      setRetrying(false);
      router.refresh();
    }
  };

  // When a row is pending OR stuck, fire POST /api/research once per (id,status) pair.
  useEffect(() => {
    const key = `${id}:${status}`;
    if (status !== "pending" && !stuck) return;
    if (triggered.current === key) return;
    triggered.current = key;
    triggerResearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, status, stuck]);

  // Polling while work is in flight.
  useEffect(() => {
    if (status === "complete") return;
    const iv = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(iv);
  }, [status, router]);

  if (status === "complete") return null;

  if (status === "pending") {
    return (
      <div className="mb-6 px-4 py-3 rounded-lg bg-mid/10 border border-mid/30 text-mid flex items-center gap-3">
        <span className="inline-block w-3 h-3 border-2 border-mid/50 border-t-mid rounded-full animate-spin" />
        <div className="text-sm flex-1">
          <strong>Pending.</strong> Starting research…
        </div>
      </div>
    );
  }

  if (status === "researching") {
    return (
      <div
        className={`mb-6 px-4 py-3 rounded-lg border flex items-center gap-3 ${
          stuck
            ? "bg-mid/10 border-mid/30 text-mid"
            : "bg-accent/10 border-accent/30 text-accent"
        }`}
      >
        <span
          className={`inline-block w-3 h-3 border-2 rounded-full animate-spin ${
            stuck ? "border-mid/40 border-t-mid" : "border-accent/40 border-t-accent"
          }`}
        />
        <div className="text-sm flex-1">
          {stuck ? (
            <>
              <strong>Research stalled.</strong> The previous attempt ran past
              the serverless timeout. Tap retry to start a fresh run with a
              tighter research budget.
            </>
          ) : (
            <>
              <strong>Researching…</strong> Claude is searching LinkedIn, the
              company site, and reviews. Takes about 40–60 seconds.
            </>
          )}
        </div>
        {stuck && (
          <button
            type="button"
            onClick={triggerResearch}
            disabled={retrying}
            className="text-xs px-2 py-1 rounded bg-mid/10 hover:bg-mid/20 disabled:opacity-60"
          >
            {retrying ? "…" : "Retry"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mb-6 px-4 py-3 rounded-lg bg-bad/10 border border-bad/30 text-bad flex items-start gap-3">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <circle cx="8" cy="8" r="7" fillOpacity=".15" />
        <path d="M8 4v5M8 11.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <div className="text-sm flex-1">
        <strong>Research failed.</strong>{" "}
        {errorMessage && <span className="text-bad/80">{errorMessage}</span>}
      </div>
      <button
        type="button"
        onClick={triggerResearch}
        disabled={retrying}
        className="text-xs px-2 py-1 rounded bg-bad/10 hover:bg-bad/20 disabled:opacity-60"
      >
        {retrying ? "…" : "Retry"}
      </button>
    </div>
  );
}
