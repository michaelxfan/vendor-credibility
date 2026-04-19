interface Props {
  title: string;
  subtitle?: string;
}

export function EmptyState({ title, subtitle }: Props) {
  return (
    <div className="flex items-center justify-center h-full p-10">
      <div className="max-w-md text-center">
        <h2 className="text-lg text-white font-semibold mb-2">{title}</h2>
        {subtitle && <p className="text-sm text-muted leading-relaxed">{subtitle}</p>}
      </div>
    </div>
  );
}
