import type { AssessmentRow } from "@/lib/types";
import { DataGrid } from "../ui/DataGrid";

interface Props {
  a: AssessmentRow;
}

export function EmailSummarySection({ a }: Props) {
  const es = a.email_summary!;
  const s = a.sender;
  return (
    <DataGrid
      rows={[
        ["Sender", `${s.name}${s.title ? ` — ${s.title}` : ""}`],
        ["Email", s.email ? <a href={`mailto:${s.email}`} className="text-accent">{s.email}</a> : "—"],
        ["Subject", es.subject ?? "—"],
        ["Date", es.date_sent ?? "—"],
        ["Email Client", es.email_client ?? "Unknown"],
        [
          "CC'd",
          es.cc_contacts && es.cc_contacts.length > 0
            ? es.cc_contacts
                .map((c) => `${c.name}${c.title ? ` (${c.title})` : ""}`)
                .join(", ")
            : "None",
        ],
        ["Summary", es.offer_summary ?? "—"],
        [
          "Claims",
          es.claims && es.claims.length > 0 ? (
            <ul className="space-y-0.5">
              {es.claims.map((c, i) => (
                <li key={i}>• {c}</li>
              ))}
            </ul>
          ) : (
            "None"
          ),
        ],
      ]}
    />
  );
}
