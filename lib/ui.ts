// Small shared helpers for color/tier logic used across components.

export type ScoreColor = "good" | "mid" | "bad";

export function scoreColor(v: number): ScoreColor {
  if (v >= 7) return "good";
  if (v >= 4) return "mid";
  return "bad";
}

export function aggregateColor(aggregate: number): ScoreColor {
  if (aggregate >= 70) return "good";
  if (aggregate >= 50) return "mid";
  return "bad";
}

export function tierSlug(
  tier: string
): "premium" | "strong" | "capable" | "commodity" | "weak" | "low" {
  const t = tier.toLowerCase();
  if (t.includes("premium")) return "premium";
  if (t.includes("strong")) return "strong";
  if (t.includes("capable")) return "capable";
  if (t.includes("commodity")) return "commodity";
  if (t.includes("weak")) return "weak";
  return "low";
}

export const TIER_COLORS: Record<
  ReturnType<typeof tierSlug>,
  { bg: string; text: string }
> = {
  premium: { bg: "bg-good/15", text: "text-good" },
  strong: { bg: "bg-accent/15", text: "text-accent" },
  capable: { bg: "bg-mid/15", text: "text-mid" },
  commodity: { bg: "bg-mid/15", text: "text-mid" },
  weak: { bg: "bg-bad/15", text: "text-bad" },
  low: { bg: "bg-bad/15", text: "text-bad" },
};
