import { ReactNode } from "react";

interface Props {
  rows: Array<[string, ReactNode]>;
}

export function DataGrid({ rows }: Props) {
  return (
    <dl className="grid grid-cols-[150px_1fr] gap-x-4 gap-y-1.5 text-[13px]">
      {rows.map(([label, value], i) => (
        <div key={i} className="contents">
          <dt className="text-dim">{label}</dt>
          <dd className="text-fg">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
