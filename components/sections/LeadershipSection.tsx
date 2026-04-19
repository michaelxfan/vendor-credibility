import type { Leader } from "@/lib/types";
import { scoreColor } from "@/lib/ui";
import { ScoreBar } from "../ScoreBar";

interface Props {
  leaders: Leader[];
  average: number | null;
  weighted: number | null;
  readout: string | null;
}

const CONF_TEXT = {
  high: "text-good",
  medium: "text-mid",
  low: "text-bad",
} as const;

const SCORE_TEXT = {
  good: "text-good",
  mid: "text-mid",
  bad: "text-bad",
} as const;

export function LeadershipSection({ leaders, average, weighted, readout }: Props) {
  return (
    <>
      <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
      <table className="w-full text-xs min-w-[720px] md:min-w-0">
        <thead>
          <tr>
            {["Name", "Title", "LinkedIn", "Strengths", "Risks", "Score", "Conf."].map(
              (h) => (
                <th
                  key={h}
                  className="text-left py-2 px-2 text-muted font-normal border-b border-border"
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {leaders.map((l, i) => (
            <tr key={i} className="hover:bg-surface-2/40">
              <td className="py-2 px-2 text-white font-medium border-b border-[#1f1f1f] align-top">
                {l.name}
              </td>
              <td className="py-2 px-2 border-b border-[#1f1f1f] align-top">{l.title}</td>
              <td className="py-2 px-2 border-b border-[#1f1f1f] align-top">
                {l.linkedin ? (
                  <a
                    href={l.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent"
                  >
                    Link
                  </a>
                ) : (
                  "—"
                )}
              </td>
              <td className="py-2 px-2 border-b border-[#1f1f1f] align-top">
                {l.strengths}
              </td>
              <td className="py-2 px-2 border-b border-[#1f1f1f] align-top">{l.risks}</td>
              <td
                className={`py-2 px-2 border-b border-[#1f1f1f] align-top font-semibold ${SCORE_TEXT[scoreColor(l.score)]}`}
              >
                {l.score.toFixed(1)}
              </td>
              <td
                className={`py-2 px-2 border-b border-[#1f1f1f] align-top font-semibold ${CONF_TEXT[l.confidence]}`}
              >
                {l.confidence}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <hr className="my-3 border-[#1f1f1f]" />
      {average !== null && <ScoreBar label="Average" value={average} />}
      {weighted !== null && (
        <ScoreBar label="Weighted (founders 2x)" value={weighted} />
      )}
      {readout && <p className="text-xs text-dim italic mt-2">{readout}</p>}
    </>
  );
}
