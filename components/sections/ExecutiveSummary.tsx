import type { AssessmentRow } from "@/lib/types";

interface Props {
  assessment: AssessmentRow;
}

const CONF_TEXT = {
  high: "text-good",
  medium: "text-mid",
  low: "text-bad",
} as const;

export function ExecutiveSummary({ assessment: a }: Props) {
  const ft = a.fast_take;
  if (!ft) return null;

  const take = a.recommendation?.take_the_meeting;
  const meetClass =
    take === true
      ? "bg-good/10 text-good"
      : take === false
        ? "bg-bad/10 text-bad"
        : "bg-mid/10 text-mid";
  const meetDot =
    take === true ? "bg-good" : take === false ? "bg-bad" : "bg-mid";
  const meetText =
    take === true
      ? "Take the meeting"
      : take === false
        ? "Do not engage"
        : "Proceed with caution";

  return (
    <div className="py-6 mb-2">
      <div className="text-[15px] text-white font-medium mb-4">
        {a.tier} — {a.aggregate_score}/100
        {a.confidence && (
          <>
            {" — "}
            <span className={CONF_TEXT[a.confidence]}>
              {a.confidence} confidence
            </span>
          </>
        )}
      </div>
      <ul className="space-y-0">
        {[
          ["Legitimacy", ft.legitimacy],
          ["Competence", ft.competence],
          ["Polish", ft.polish],
          ["Risk", ft.risk],
          ["Stance", ft.stance],
        ].map(([label, text]) => (
          <li
            key={label}
            className="py-[7px] text-sm text-fg border-b border-[#1f1f1f] last:border-b-0"
          >
            <strong className="text-white font-medium">{label}:</strong> {text}
          </li>
        ))}
      </ul>
      <div
        className={`inline-flex items-center gap-2 mt-5 px-4 py-2.5 rounded-lg text-[13px] font-semibold ${meetClass}`}
      >
        <span className={`w-2 h-2 rounded-full ${meetDot}`} />
        {meetText}
      </div>
    </div>
  );
}
