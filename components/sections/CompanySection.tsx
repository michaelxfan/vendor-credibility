import type { Company, CompanySubScores } from "@/lib/types";
import { DataGrid } from "../ui/DataGrid";
import { ScoreBar } from "../ScoreBar";

interface Props {
  company: Company;
  subScores: CompanySubScores | null;
  companyScore: number;
  rationale: string | null;
}

export function CompanySection({ company: c, subScores, companyScore, rationale }: Props) {
  const cs = subScores;
  return (
    <>
      <DataGrid
        rows={[
          ["Description", c.description ?? "—"],
          [
            "Services",
            c.services?.length ? (
              <div className="flex flex-wrap gap-1">
                {c.services.map((s, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-surface-2 rounded text-[11px] text-muted"
                  >
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              "—"
            ),
          ],
          ["Location", c.geography ?? "—"],
          ["Size", c.size ?? "—"],
          [
            "Founded",
            c.founded ? `${c.founded} (${c.years_in_operation ?? "?"} years)` : "—",
          ],
          [
            "Shopify",
            c.shopify_status ? (
              <span className="text-good">{c.shopify_status}</span>
            ) : (
              "—"
            ),
          ],
          [
            "Clients",
            c.named_clients?.length
              ? c.named_clients.slice(0, 8).join(", ") +
                (c.named_clients.length > 8 ? " +more" : "")
              : "—",
          ],
          ["Reviews", c.reviews_summary ?? "—"],
          [
            "Red Flags",
            c.red_flags?.length ? (
              <div className="text-bad">
                {c.red_flags.map((x, i) => (
                  <div key={i}>• {x}</div>
                ))}
              </div>
            ) : (
              "None"
            ),
          ],
          [
            "Positive Signals",
            c.positive_signals?.length ? (
              <div className="text-good">
                {c.positive_signals.map((x, i) => (
                  <div key={i}>• {x}</div>
                ))}
              </div>
            ) : (
              "—"
            ),
          ],
        ]}
      />
      {cs && (
        <>
          <hr className="my-3 border-[#1f1f1f]" />
          <ScoreBar label="Legitimacy" value={cs.legitimacy} />
          <ScoreBar label="Capability" value={cs.capability} />
          <ScoreBar label="Specialization" value={cs.specialization_fit} />
          <ScoreBar label="Quality / Polish" value={cs.quality_polish} />
          <ScoreBar label="Proof of Execution" value={cs.proof_of_execution} />
          <ScoreBar label="Leadership" value={cs.leadership_strength} />
          <ScoreBar label="Client Handling" value={cs.sophisticated_client_handling} />
          <ScoreBar label="Communication" value={cs.communication_maturity} />
          <ScoreBar label="Risk (10=safe)" value={cs.risk_level} />
          <ScoreBar label="Confidence" value={cs.overall_confidence} />
        </>
      )}
      <hr className="my-3 border-[#1f1f1f]" />
      <ScoreBar label="Company Score" value={companyScore} emphasize />
      {rationale && <p className="text-xs text-dim italic mt-2">{rationale}</p>}
    </>
  );
}
