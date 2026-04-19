import type { Sources, SourceLink } from "@/lib/types";

interface Props {
  sources: Sources;
}

function Group({ title, links }: { title: string; links?: SourceLink[] }) {
  if (!links || links.length === 0) return null;
  return (
    <div className="mb-4">
      <h4 className="text-[11px] text-dim uppercase tracking-wide mb-1.5 font-medium">
        {title}
      </h4>
      <ul className="space-y-0.5">
        {links.map((l, i) => (
          <li key={i}>
            <a
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent text-xs break-all hover:underline"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SourcesSection({ sources }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Group title="Sender" links={sources.sender} />
        <Group title="Company" links={sources.company} />
      </div>
      <div>
        <Group title="Leadership" links={sources.leadership} />
        <Group title="Reviews" links={sources.reviews} />
      </div>
    </div>
  );
}
