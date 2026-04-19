"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function AttachEmailButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    setError(null);
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file, file.name);
      const res = await fetch("/api/intake", { method: "POST", body: form });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      if (data.id) {
        router.push(`/?id=${encodeURIComponent(data.id)}`);
        router.refresh();
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="mb-3">
      <input
        ref={inputRef}
        type="file"
        accept=".eml,message/rfc822"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      <button
        type="button"
        onClick={handlePick}
        disabled={busy}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-accent/15 text-accent border border-accent/30 rounded-lg text-[13px] font-medium hover:bg-accent/25 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {busy ? (
          <>
            <span className="inline-block w-3 h-3 border-2 border-accent/50 border-t-accent rounded-full animate-spin" />
            Uploading…
          </>
        ) : (
          <>
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 3h6l4 4v6a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1z" />
              <path d="M9 3v4h4" />
            </svg>
            Attach email
          </>
        )}
      </button>
      {error && <div className="text-xs text-bad mt-2">{error}</div>}
    </div>
  );
}
