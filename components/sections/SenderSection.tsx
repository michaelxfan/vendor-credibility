import type { Sender } from "@/lib/types";
import { DataGrid } from "../ui/DataGrid";
import { ScoreBar } from "../ScoreBar";

interface Props {
  sender: Sender;
  companyName: string;
}

const CONF_TEXT = {
  high: "text-good",
  medium: "text-mid",
  low: "text-bad",
} as const;

export function SenderSection({ sender: s, companyName }: Props) {
  const ss = s.sub_scores;
  return (
    <>
      <DataGrid
        rows={[
          [
            "LinkedIn",
            s.linkedin ? (
              <span>
                <a
                  href={s.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent break-all"
                >
                  {s.linkedin}
                </a>{" "}
                {s.linkedin_confidence && (
                  <span
                    className={`text-[11px] font-semibold ${CONF_TEXT[s.linkedin_confidence]}`}
                  >
                    {s.linkedin_confidence}
                  </span>
                )}
              </span>
            ) : (
              "Not found"
            ),
          ],
          ["Current Role", `${s.title ?? "—"} at ${companyName}`],
          ["Background", s.background ?? "—"],
          [
            "Signals",
            s.credibility_signals?.length ? (
              <ul>
                {s.credibility_signals.map((x, i) => (
                  <li key={i}>• {x}</li>
                ))}
              </ul>
            ) : (
              "—"
            ),
          ],
          [
            "Concerns",
            s.concerns?.length ? (
              <ul>
                {s.concerns.map((x, i) => (
                  <li key={i}>• {x}</li>
                ))}
              </ul>
            ) : (
              "None"
            ),
          ],
        ]}
      />
      <hr className="my-3 border-[#1f1f1f]" />
      <ScoreBar label="Seniority" value={ss.seniority} />
      <ScoreBar label="Experience" value={ss.experience} />
      <ScoreBar label="Credibility" value={ss.credibility} />
      <ScoreBar label="Communication" value={ss.communication} />
      <ScoreBar label="Trust" value={ss.trustworthiness} />
      <hr className="my-3 border-[#1f1f1f]" />
      <ScoreBar label="Sender Score" value={s.score} emphasize />
      {s.score_rationale && (
        <p className="text-xs text-dim italic mt-2">{s.score_rationale}</p>
      )}
    </>
  );
}
