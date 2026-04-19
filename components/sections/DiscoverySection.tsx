"use client";

import { useState } from "react";
import type { DiscoveryQuestions } from "@/lib/types";

interface Props {
  dq: DiscoveryQuestions;
}

const PRIO_TEXT = {
  high: "text-bad",
  medium: "text-mid",
  low: "text-good",
} as const;

export function DiscoverySection({ dq }: Props) {
  const [showAll, setShowAll] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const shown = showAll ? dq.questions : dq.questions.slice(0, 3);

  const toggleExpanded = (i: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  return (
    <>
      {dq.key_risks && dq.key_risks.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-dim mb-2">Key risks to probe</div>
          {dq.key_risks.map((r, i) => (
            <div key={i} className="text-xs text-bad py-0.5">
              • {r}
            </div>
          ))}
          <hr className="my-3 border-[#1f1f1f]" />
        </div>
      )}

      {shown.map((q, i) => {
        const isOpen = expanded.has(i);
        return (
          <div key={i} className="py-3.5 border-b border-[#1f1f1f] last:border-b-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] text-accent font-semibold uppercase tracking-wide">
                {q.category}
              </span>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wide ${PRIO_TEXT[q.priority]}`}
              >
                {q.priority}
              </span>
            </div>
            <button
              type="button"
              onClick={() => toggleExpanded(i)}
              className="text-sm text-white text-left w-full hover:text-accent transition-colors"
            >
              “{q.question}”
            </button>
            {isOpen && (
              <div className="mt-3">
                <div className="text-xs text-dim italic mb-2">{q.objective}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-md bg-good/5 border border-good/20">
                    <h5 className="text-[10px] uppercase tracking-wide text-good font-semibold mb-1.5">
                      Strong Answer
                    </h5>
                    <ul className="text-xs text-muted space-y-0.5">
                      {q.strong_answer.map((x, j) => (
                        <li key={j}>• {x}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-3 rounded-md bg-bad/5 border border-bad/20">
                    <h5 className="text-[10px] uppercase tracking-wide text-bad font-semibold mb-1.5">
                      Weak Answer
                    </h5>
                    <ul className="text-xs text-muted space-y-0.5">
                      {q.weak_answer.map((x, j) => (
                        <li key={j}>• {x}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {dq.questions.length > 3 && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="text-xs text-accent hover:underline mt-3 inline-block cursor-pointer"
        >
          {showAll
            ? "Show fewer questions"
            : `Show ${dq.questions.length - 3} more questions`}
        </button>
      )}

      {dq.usage_guide && (
        <div className="mt-4 p-4 bg-surface rounded-lg">
          <h4 className="text-[13px] text-white font-medium mb-3">
            How to use these
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <h5 className="text-[10px] uppercase tracking-wide text-dim font-semibold mb-1.5">
                Lean in if…
              </h5>
              <ul className="text-xs text-good space-y-0.5">
                {dq.usage_guide.lean_in_signals.map((x, i) => (
                  <li key={i}>• {x}</li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="text-[10px] uppercase tracking-wide text-dim font-semibold mb-1.5">
                Walk away if…
              </h5>
              <ul className="text-xs text-bad space-y-0.5">
                {dq.usage_guide.walk_away_signals.map((x, i) => (
                  <li key={i}>• {x}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
