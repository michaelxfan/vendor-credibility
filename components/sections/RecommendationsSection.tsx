import type { Recommendation } from "@/lib/types";

interface Props {
  rec: Recommendation;
}

interface RecCardProps {
  label: string;
  value: string | React.ReactNode;
  detail?: string;
}

function RecCard({ label, value, detail }: RecCardProps) {
  return (
    <div className="py-3.5 border-b border-[#1f1f1f] last:border-b-0">
      <div className="text-[11px] text-dim mb-0.5">{label}</div>
      <div className="text-sm text-white font-medium">{value}</div>
      {detail && <div className="text-xs text-muted mt-1">{detail}</div>}
    </div>
  );
}

export function RecommendationsSection({ rec }: Props) {
  return (
    <div>
      <RecCard label="Caliber" value={rec.caliber} />
      <RecCard label="Working Style" value={rec.working_style} />
      <RecCard
        label="Strengths"
        value={
          <ul className="text-xs font-normal text-muted mt-1">
            {rec.strengths.map((x, i) => (
              <li key={i}>• {x}</li>
            ))}
          </ul>
        }
      />
      <RecCard
        label="Weaknesses"
        value={
          <ul className="text-xs font-normal text-bad mt-1">
            {rec.weaknesses.map((x, i) => (
              <li key={i}>• {x}</li>
            ))}
          </ul>
        }
      />
      <RecCard label="Communication" value={rec.communication_style} />
      <RecCard label="Diligence" value={rec.diligence_level} />
      <RecCard label="Take the meeting?" value={rec.take_the_meeting ? "Yes" : "No"} />
      <RecCard label="Next Step" value={rec.next_step} />
    </div>
  );
}
