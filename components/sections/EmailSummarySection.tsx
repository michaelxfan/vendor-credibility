import type { AssessmentRow } from "@/lib/types";
import { DataGrid } from "../ui/DataGrid";

interface Props {
  a: AssessmentRow;
}

export function EmailSummarySection({ a }: Props) {
  const es = a.email_summary!;
  const senderName = a.sender?.name ?? a.sender_name ?? "—";
  const senderTitle = a.sender?.title ?? a.sender_title ?? null;
  const senderEmail = a.sender?.email ?? a.sender_email ?? null;
  return (
    <DataGrid
      rows={[
        ["Sender", `${senderName}${senderTitle ? ` — ${senderTitle}` : ""}`],
        ["Email", senderEmail ? <a href={`mailto:${senderEmail}`} className="text-accent">{senderEmail}</a> : "—"],
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
