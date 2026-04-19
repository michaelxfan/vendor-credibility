import type { AgencyFit } from "@/lib/types";
import { DataGrid } from "../ui/DataGrid";
import { ScoreBar } from "../ScoreBar";

interface Props {
  fit: AgencyFit;
}

export function AgencyFitSection({ fit }: Props) {
  return (
    <>
      <ScoreBar label="Ecommerce Fit" value={fit.ecommerce_fit} />
      <ScoreBar label="Strategic Depth" value={fit.strategic_depth} />
      <ScoreBar label="Execution Confidence" value={fit.execution_confidence} />
      <ScoreBar label="Taste / Design" value={fit.taste_design_maturity} />
      <hr className="my-3 border-[#1f1f1f]" />
      <DataGrid
        rows={[
          ["Best Fit Client", fit.best_fit_client ?? "—"],
          ["Portfolio", fit.portfolio_assessment ?? "—"],
          ["Operator IQ", fit.operator_understanding ?? "—"],
        ]}
      />
    </>
  );
}
