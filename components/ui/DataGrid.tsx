import { ReactNode } from "react";

interface Props {
  rows: Array<[string, ReactNode]>;
}

export function DataGrid({ rows }: Props) {
  return (
    <dl className="grid grid-cols-[110px_1fr] md:grid-cols-[150px_1fr] gap-x-3 md:gap-x-4 gap-y-1.5 text-[13px] min-w-0">
      {rows.map(([label, value], i) => (
        <div key={i} className="contents">
          <dt className="text-dim">{label}</dt>
          <dd className="text-fg break-words min-w-0">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
