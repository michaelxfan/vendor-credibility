import type { Scores } from "@/lib/types";
import { aggregateColor } from "@/lib/ui";
import { ScoreBar } from "../ScoreBar";

interface Props {
  scores: Scores;
}

export function ScoringSection({ scores }: Props) {
  const c = aggregateColor(scores.aggregate);
  const bgClass = c === "good" ? "bg-good" : c === "mid" ? "bg-mid" : "bg-bad";
  const textClass = c === "good" ? "text-good" : c === "mid" ? "text-mid" : "text-bad";
  return (
    <>
      <ScoreBar label="Sender (25%)" value={scores.sender} />
      <ScoreBar label="Leadership (35%)" value={scores.leadership} />
      <ScoreBar label="Company (40%)" value={scores.company} />
      <hr className="my-3 border-[#1f1f1f]" />
      <div className="flex items-center gap-2.5">
        <div className="w-[210px] text-sm text-white font-bold flex-shrink-0">
          Aggregate
        </div>
        <div className="flex-1 h-[6px] bg-surface-2 rounded-sm overflow-hidden">
          <div
            className={`h-full rounded-sm ${bgClass}`}
            style={{ width: `${scores.aggregate}%` }}
          />
        </div>
        <div className={`w-9 text-right text-base font-bold ${textClass}`}>
          {scores.aggregate}
        </div>
      </div>
    </>
  );
}
