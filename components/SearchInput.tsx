"use client";

import { useEffect, useRef } from "react";

export function SearchInput() {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = ref.current;
    if (!input) return;
    const handler = () => {
      const q = input.value.toLowerCase();
      const items = document.querySelectorAll<HTMLElement>(
        "#vendor-list [data-name]"
      );
      items.forEach((el) => {
        const name = el.dataset.name ?? "";
        el.style.display = !q || name.includes(q) ? "" : "none";
      });
    };
    input.addEventListener("input", handler);
    return () => input.removeEventListener("input", handler);
  }, []);

  return (
    <input
      ref={ref}
      type="text"
      placeholder="Search vendors..."
      className="w-full px-3 py-1.5 bg-surface border border-border rounded-lg text-[13px] text-fg placeholder:text-dim outline-none focus:border-accent transition-colors"
    />
  );
}
