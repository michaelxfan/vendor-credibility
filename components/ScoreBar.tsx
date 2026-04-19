import { scoreColor } from "@/lib/ui";

interface Props {
  label: string;
  value: number;
  emphasize?: boolean;
}

const COLOR_TEXT = {
  good: "text-good",
  mid: "text-mid",
  bad: "text-bad",
} as const;
const COLOR_BG = {
  good: "bg-good",
  mid: "bg-mid",
  bad: "bg-bad",
} as const;

export function ScoreBar({ label, value, emphasize }: Props) {
  const c = scoreColor(value);
  return (
    <div className="flex items-center gap-2.5 mb-2">
      <div
        className={`w-[130px] md:w-[210px] text-xs flex-shrink-0 ${
          emphasize ? "text-white font-medium" : "text-dim"
        }`}
      >
        {label}
      </div>
      <div className="flex-1 h-[4px] bg-surface-2 rounded-sm overflow-hidden">
        <div
          className={`h-full rounded-sm ${COLOR_BG[c]}`}
          style={{ width: `${Math.min(100, value * 10)}%` }}
        />
      </div>
      <div
        className={`w-9 text-right text-xs font-semibold ${COLOR_TEXT[c]} ${
          emphasize ? "text-sm" : ""
        }`}
      >
        {value.toFixed(1)}
      </div>
    </div>
  );
}
