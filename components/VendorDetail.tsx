import type { AssessmentRow } from "@/lib/types";
import { TIER_COLORS, aggregateColor, tierSlug } from "@/lib/ui";
import { Accordion } from "./Accordion";
import { StatusBanner } from "./StatusBanner";
import { ExecutiveSummary } from "./sections/ExecutiveSummary";
import { EmailSummarySection } from "./sections/EmailSummarySection";
import { SenderSection } from "./sections/SenderSection";
import { LeadershipSection } from "./sections/LeadershipSection";
import { CompanySection } from "./sections/CompanySection";
import { ScoringSection } from "./sections/ScoringSection";
import { RecommendationsSection } from "./sections/RecommendationsSection";
import { SourcesSection } from "./sections/SourcesSection";
import { AgencyFitSection } from "./sections/AgencyFitSection";
import { DiscoverySection } from "./sections/DiscoverySection";

interface Props {
  assessment: AssessmentRow;
}

export function VendorDetail({ assessment: a }: Props) {
  const isComplete = a.status === "complete" && a.aggregate_score !== null && a.tier;
  const ts = a.tier ? tierSlug(a.tier) : null;
  const tierColor = ts ? TIER_COLORS[ts] : null;
  const aggColor = a.aggregate_score !== null ? aggregateColor(a.aggregate_score) : null;
  const aggColorClass =
    aggColor === "good"
      ? "text-good"
      : aggColor === "mid"
        ? "text-mid"
        : aggColor === "bad"
          ? "text-bad"
          : "text-dim";

  const srcCount =
    (a.sources?.sender?.length ?? 0) +
    (a.sources?.company?.length ?? 0) +
    (a.sources?.leadership?.length ?? 0) +
    (a.sources?.reviews?.length ?? 0);

  return (
    <div>
      {/* Header */}
      <header className="px-4 pt-5 pb-4 md:px-10 md:pt-8 md:pb-6 border-b border-border bg-bg md:sticky md:top-0 md:z-10">
        <div className="flex items-start justify-between gap-4 md:gap-5 flex-wrap">
          <div className="min-w-0 flex-1">
            <h1 className="text-[19px] md:text-[22px] font-semibold text-white tracking-tight break-words">
              {a.company_name}
            </h1>
            <div className="text-[12px] md:text-[13px] text-dim mt-1 break-words">
              {a.date}
              {a.sender_name && (
                <>
                  {" · "}
                  <a
                    href={`mailto:${a.sender_email ?? ""}`}
                    className="text-muted hover:text-accent"
                  >
                    {a.sender_name}
                  </a>
                </>
              )}
              {a.company_website && (
                <>
                  {" · "}
                  <a
                    href={a.company_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted hover:text-accent break-all"
                  >
                    {a.company_domain ?? a.company_website}
                  </a>
                </>
              )}
            </div>
            {tierColor && a.tier && (
              <span
                className={`inline-block mt-2 px-3 py-[3px] rounded-md text-[11px] font-semibold tracking-wide ${tierColor.bg} ${tierColor.text}`}
              >
                {a.tier}
              </span>
            )}
          </div>
          {a.aggregate_score !== null && (
            <div className="text-right flex-shrink-0">
              <div
                className={`text-[32px] md:text-[40px] font-bold leading-none ${aggColorClass}`}
              >
                {a.aggregate_score}
                <span className="text-[12px] md:text-[13px] text-dim font-normal ml-1">
                  /100
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-4 md:px-10 md:py-6 max-w-[860px]">
        <StatusBanner
          id={a.id}
          status={a.status}
          errorMessage={a.error_message}
          updatedAt={a.updated_at}
        />
        {isComplete && <ExecutiveSummary assessment={a} />}

        {a.email_summary && (
          <Accordion
            id="email"
            vendorId={a.id}
            title="Email Summary"
            preview={`${a.sender_name ?? "?"}${
              a.sender_title ? ` (${a.sender_title})` : ""
            } — ${a.email_summary.subject ?? ""}`}
            defaultOpen={!isComplete}
          >
            <EmailSummarySection a={a} />
          </Accordion>
        )}

        {a.sender && a.sender.sub_scores && (
          <Accordion
            id="sender"
            vendorId={a.id}
            title="Sender Research"
            preview={`Score ${a.sender.score}/10 — ${a.sender.title ?? ""}, ${
              a.sender.sub_scores.communication < 7 ? "moderate" : "strong"
            } communication`}
          >
            <SenderSection sender={a.sender} companyName={a.company_name} />
          </Accordion>
        )}

        {a.leadership && a.leadership.length > 0 && (
          <Accordion
            id="leadership"
            vendorId={a.id}
            title="Leadership"
            preview={`Weighted ${a.leadership_weighted ?? a.leadership_score ?? "?"}/10 — ${
              a.leadership.filter((l) => (l.weight ?? 1) >= 2).length
            } senior leaders found`}
          >
            <LeadershipSection
              leaders={a.leadership}
              average={a.leadership_avg}
              weighted={a.leadership_weighted}
              readout={a.leadership_readout}
            />
          </Accordion>
        )}

        {a.company && a.company_score !== null && (
          <Accordion
            id="company"
            vendorId={a.id}
            title="Company Research"
            preview={`Score ${a.company_score}/10 — ${(
              a.company.positioning ?? ""
            ).slice(0, 70)}`}
          >
            <CompanySection
              company={a.company}
              subScores={a.company_sub_scores}
              companyScore={a.company_score}
              rationale={a.company_score_rationale}
            />
          </Accordion>
        )}

        {a.scores && (
          <Accordion
            id="scoring"
            vendorId={a.id}
            title="Overall Scoring"
            preview={`Sender ${a.scores.sender} + Leadership ${a.scores.leadership} + Company ${a.scores.company} = ${a.scores.aggregate}`}
          >
            <ScoringSection scores={a.scores} />
          </Accordion>
        )}

        {a.recommendation && (
          <Accordion
            id="recs"
            vendorId={a.id}
            title="Recommendations"
            preview={`${a.recommendation.caliber} — ${
              a.recommendation.take_the_meeting
                ? "take the meeting"
                : "do not engage"
            }`}
            focusVisible
          >
            <RecommendationsSection rec={a.recommendation} />
          </Accordion>
        )}

        <Accordion
          id="sources"
          vendorId={a.id}
          title="Source Links"
          preview={`${srcCount} links across sender, company, leadership, reviews`}
        >
          <SourcesSection sources={a.sources} />
        </Accordion>

        {a.agency_fit?.is_agency && (
          <Accordion
            id="agency"
            vendorId={a.id}
            title="Agency Fit"
            preview={`Ecom ${a.agency_fit.ecommerce_fit}/10, Strategy ${a.agency_fit.strategic_depth}/10, Execution ${a.agency_fit.execution_confidence}/10`}
          >
            <AgencyFitSection fit={a.agency_fit} />
          </Accordion>
        )}

        {a.discovery_questions &&
          a.discovery_questions.questions &&
          a.discovery_questions.questions.length > 0 && (
            <Accordion
              id="questions"
              vendorId={a.id}
              title="Discovery Questions"
              preview={`${a.discovery_questions.questions.length} questions across ${[
                ...new Set(a.discovery_questions.questions.map((q) => q.category)),
              ].join(", ")}`}
              focusVisible
            >
              <DiscoverySection dq={a.discovery_questions} />
            </Accordion>
          )}

        <div className="text-center text-[11px] text-dim py-8">
          Generated {a.date}
        </div>
      </div>
    </div>
  );
}
