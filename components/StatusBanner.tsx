"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { AssessmentStatus } from "@/lib/types";

interface Props {
  id: string;
  status: AssessmentStatus;
  errorMessage: string | null;
}

/**
 * Shows a banner at the top of the detail view when an assessment is pending,
 * researching, or errored. Polls every 5s and triggers a router.refresh() once
 * the server-rendered status changes so the page re-fetches from Supabase.
 */
export function StatusBanner({ id, status, errorMessage }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (status === "complete") return;
    const iv = setInterval(() => {
      router.refresh();
    }, 5000);
    return () => clearInterval(iv);
  }, [status, router]);

  const retryResearch = async () => {
    try {
      await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      router.refresh();
    } catch {}
  };

  if (status === "complete") return null;

  if (status === "pending") {
    return (
      <div className="mb-6 px-4 py-3 rounded-lg bg-mid/10 border border-mid/30 text-mid flex items-center gap-3">
        <span className="inline-block w-3 h-3 border-2 border-mid/50 border-t-mid rounded-full animate-spin" />
        <div className="text-sm flex-1">
          <strong>Pending.</strong> Queued — research will start automatically.
        </div>
        <button
          type="button"
          onClick={retryResearch}
          className="text-xs px-2 py-1 rounded bg-mid/10 hover:bg-mid/20"
        >
          Start now
        </button>
      </div>
    );
  }

  if (status === "researching") {
    return (
      <div className="mb-6 px-4 py-3 rounded-lg bg-accent/10 border border-accent/30 text-accent flex items-center gap-3">
        <span className="inline-block w-3 h-3 border-2 border-accent/40 border-t-accent rounded-full animate-spin" />
        <div className="text-sm flex-1">
          <strong>Researching…</strong> Claude is searching LinkedIn, company
          site, and reviews. This usually takes 1–3 minutes.
        </div>
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
        onClick={retryResearch}
        className="text-xs px-2 py-1 rounded bg-bad/10 hover:bg-bad/20"
      >
        Retry
      </button>
    </div>
  );
}
