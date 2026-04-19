"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AssessmentStatus } from "@/lib/types";

interface Props {
  id: string;
  companyName: string;
  status: AssessmentStatus;
  /** Visual style variant. `ghost` = small text button, `banner` = inline with StatusBanner. */
  variant?: "ghost" | "banner";
}

/**
 * Cancel (in-progress) or Delete (complete) a vendor assessment.
 * Both actions DELETE the row; the button label adapts to status.
 *
 * If research is currently running on the Supabase Edge Function, cancelling
 * just removes the row. The edge function's final update targets the now-
 * missing id, so it no-ops silently (no errors, no phantom writes).
 */
export function DeleteButton({ id, companyName, status, variant = "ghost" }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inProgress = status === "pending" || status === "researching";
  const label = inProgress ? "Cancel research" : "Delete";
  const confirmMsg = inProgress
    ? `Cancel research for "${companyName}"? The row will be removed. Any in-progress Claude call will finish but its result will be discarded.`
    : `Delete "${companyName}"? This permanently removes the assessment and cannot be undone.`;

  const onClick = async () => {
    if (busy) return;
    if (!window.confirm(confirmMsg)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/assessments?id=${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      // Redirect to home; next server render won't find the row
      router.push("/");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  const base =
    "inline-flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const styled =
    variant === "banner"
      ? `${base} px-2 py-1 rounded bg-bad/10 text-bad hover:bg-bad/20`
      : `${base} px-2.5 py-1 rounded-md text-muted hover:text-bad hover:bg-bad/10`;

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        aria-label={label}
        className={styled}
      >
        {busy ? (
          <>
            <span className="inline-block w-3 h-3 border-[1.5px] border-current/40 border-t-current rounded-full animate-spin" />
            Working…
          </>
        ) : (
          <>
            <svg
              width="13"
              height="13"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 4h10M5 4V2.5A.5.5 0 015.5 2h3a.5.5 0 01.5.5V4M3 4l.5 8a1 1 0 001 1h5a1 1 0 001-1L11 4" />
            </svg>
            {label}
          </>
        )}
      </button>
      {error && <span className="text-[11px] text-bad">{error}</span>}
    </div>
  );
}
