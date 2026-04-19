"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  id: string;
  vendorId: string;
  title: string;
  preview: string;
  defaultOpen?: boolean;
  focusVisible?: boolean; // visible in focus mode
  children: React.ReactNode;
}

/**
 * Collapsible section. Open/closed state persists to localStorage per vendor.
 * When body.focus-mode is on and focusVisible !== true, the accordion is hidden.
 */
export function Accordion({
  id,
  vendorId,
  title,
  preview,
  defaultOpen = false,
  focusVisible = false,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const key = `vc-acc-${vendorId}-${id}`;
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const saved = localStorage.getItem(key);
    if (saved !== null) setOpen(saved === "1");
  }, [key]);

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(key, next ? "1" : "0");
      } catch {}
      return next;
    });
  };

  return (
    <div
      className="border-t border-border"
      data-focus-hide={focusVisible ? "false" : "true"}
    >
      <button
        type="button"
        onClick={toggle}
        className="flex items-center w-full py-4 text-left hover:opacity-80 transition-opacity"
      >
        <div className="text-sm text-white font-medium flex-shrink-0">{title}</div>
        <div className="text-xs text-dim ml-3 flex-1 truncate">{preview}</div>
        <div
          className={`w-4 h-4 flex-shrink-0 ml-2 text-dim transition-transform ${
            open ? "rotate-90" : ""
          }`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M6 4l4 4-4 4" />
          </svg>
        </div>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          open ? "max-h-[9999px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="pb-6">{children}</div>
      </div>
    </div>
  );
}
