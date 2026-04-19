/**
 * Cross-app top nav — links Vendor Credibility, Job Search, and Company
 * Research deployments together as sister tools in one research suite.
 * Identical copy lives in indeed-search-app/components/SuiteNav.tsx and
 * market-intel/components/SuiteNav.tsx. Keep the three files in sync when
 * editing.
 */
const SUITE_LINKS = [
  {
    key: "jobs" as const,
    label: "Job Search",
    href: "https://job-search-app-michaelxfan.vercel.app/",
  },
  {
    key: "intel" as const,
    label: "Company Research",
    href: "https://cpg-company-research-app.vercel.app/",
  },
  {
    key: "vendors" as const,
    label: "Vendor Credibility",
    href: "https://vendor-credibility.vercel.app/",
  },
];

export type SuiteAppKey = (typeof SUITE_LINKS)[number]["key"];

function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function SuiteNav({ active }: { active: SuiteAppKey }) {
  return (
    <nav
      aria-label="Research suite"
      className="border-b border-border bg-bg"
    >
      <div className="max-w-[1040px] mx-auto px-4 md:px-5 h-11 md:h-12 flex items-center justify-between gap-3">
        <span className="text-[10px] md:text-[11px] uppercase tracking-[0.14em] font-semibold text-muted whitespace-nowrap">
          Research Suite
        </span>
        <ul className="flex items-center gap-1">
          {SUITE_LINKS.map((link) => {
            const isActive = link.key === active;
            return (
              <li key={link.key}>
                <a
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center rounded-md px-2.5 md:px-3 py-1.5 text-xs md:text-[13px] font-medium transition-colors",
                    isActive
                      ? "bg-accent/15 text-accent ring-1 ring-accent/50"
                      : "text-muted hover:text-fg hover:bg-surface"
                  )}
                >
                  {link.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
