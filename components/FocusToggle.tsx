"use client";

import { useEffect, useState } from "react";

const KEY = "vc-focus-mode";

export function FocusToggle() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(KEY) === "1";
    setOn(saved);
    document.body.classList.toggle("focus-mode", saved);
  }, []);

  const toggle = () => {
    const next = !on;
    setOn(next);
    localStorage.setItem(KEY, next ? "1" : "0");
    document.body.classList.toggle("focus-mode", next);
  };

  return (
    <label className="flex items-center gap-2 mt-3 text-xs text-muted cursor-pointer select-none">
      <span className="relative inline-block w-8 h-[18px]">
        <input
          type="checkbox"
          checked={on}
          onChange={toggle}
          className="sr-only peer"
        />
        <span
          className={`absolute inset-0 rounded-full transition-colors ${
            on ? "bg-accent" : "bg-border"
          }`}
        />
        <span
          className={`absolute top-[2px] left-[2px] w-[14px] h-[14px] rounded-full transition-transform ${
            on ? "translate-x-[14px] bg-white" : "bg-muted"
          }`}
        />
      </span>
      Focus mode
    </label>
  );
}
