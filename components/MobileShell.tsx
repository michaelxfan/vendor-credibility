"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface Props {
  sidebar: React.ReactNode;
  main: React.ReactNode;
  /** Shown in the mobile top bar (next to the hamburger). */
  currentLabel: string;
}

/**
 * Layout shell that behaves as a two-pane flex container on desktop and as
 * a slide-in drawer + single-pane content on mobile.
 *
 * On mobile:
 *   - a 44px top bar shows the hamburger + the currently selected vendor name
 *   - tapping the hamburger slides the sidebar in from the left
 *   - tapping the backdrop or picking a vendor closes the drawer
 *
 * On md+ screens this is just `<aside>{sidebar}</aside><main>{main}</main>`.
 */
export function MobileShell({ sidebar, main, currentLabel }: Props) {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();
  const currentId = searchParams.get("id");

  // Auto-close the drawer whenever the selected vendor changes (i.e. user picked from the list).
  useEffect(() => {
    setOpen(false);
  }, [currentId]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative flex h-full overflow-hidden">
      {/* Mobile top bar */}
      <div className="md:hidden absolute top-0 left-0 right-0 z-30 h-11 bg-bg border-b border-border flex items-center px-3 gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="p-2 -ml-1 rounded-md hover:bg-surface text-muted hover:text-fg transition-colors"
        >
          {open ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            >
              <path d="M4 4l10 10M14 4L4 14" />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            >
              <path d="M3 5h12M3 9h12M3 13h12" />
            </svg>
          )}
        </button>
        <span className="text-sm font-medium text-white truncate flex-1">
          {currentLabel}
        </span>
      </div>

      {/* Backdrop — only on mobile, only when drawer open */}
      <div
        className={`md:hidden fixed inset-0 bg-black/60 z-30 transition-opacity duration-200 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar: absolute drawer on mobile, regular column on desktop */}
      <aside
        className={`
          absolute md:static top-0 left-0 h-full z-40 md:z-0
          w-[280px] md:w-auto
          bg-bg shadow-2xl md:shadow-none
          transform transition-transform duration-200 ease-out md:transform-none
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {sidebar}
      </aside>

      {/* Main content: full-width on mobile with top padding for the bar, flex-1 on desktop */}
      <main className="flex-1 overflow-y-auto pt-11 md:pt-0">{main}</main>
    </div>
  );
}
