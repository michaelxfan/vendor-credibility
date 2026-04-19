import Link from "next/link";
import type { AssessmentListItem } from "@/lib/types";
import { aggregateColor } from "@/lib/ui";
import { SearchInput } from "./SearchInput";
import { FocusToggle } from "./FocusToggle";

interface Props {
  items: AssessmentListItem[];
  selectedId: string | null;
}

export function Sidebar({ items, selectedId }: Props) {
  return (
    <div className="w-[260px] border-r border-border overflow-y-auto bg-bg flex flex-col flex-shrink-0">
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-[15px] font-semibold text-white tracking-tight">
            Vendor Credibility
          </h1>
          <span className="text-xs text-dim">
            {items.length} {items.length === 1 ? "vendor" : "vendors"}
          </span>
        </div>
        <SearchInput />
        <FocusToggle />
      </div>

      <nav className="flex-1" id="vendor-list">
        {items.length === 0 ? (
          <div className="p-10 text-center text-dim text-sm">No vendors yet.</div>
        ) : (
          items.map((item) => {
            const color = aggregateColor(item.aggregate_score);
            const colorClass =
              color === "good"
                ? "text-good"
                : color === "mid"
                  ? "text-mid"
                  : "text-bad";
            const active = item.id === selectedId;
            return (
              <Link
                key={item.id}
                href={`/?id=${item.id}`}
                data-name={item.company_name.toLowerCase()}
                className={`block px-5 py-3.5 border-b border-[#1a1a1a] transition-colors ${
                  active
                    ? "bg-surface border-l-2 border-l-accent pl-[18px]"
                    : "hover:bg-surface"
                }`}
              >
                <div className="text-sm text-white font-medium">
                  {item.company_name}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-lg font-bold ${colorClass}`}>
                    {item.aggregate_score}
                  </span>
                  <span className="text-[11px] text-muted">{item.tier}</span>
                </div>
                <div className="text-[11px] text-dim mt-0.5">
                  {item.date} · {item.sender_name ?? "—"}
                </div>
              </Link>
            );
          })
        )}
      </nav>
    </div>
  );
}
