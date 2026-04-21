import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

function authorized(req: NextRequest): boolean {
  const secret = process.env.VC_API_SECRET;
  if (!secret) return true; // no secret set = open (local dev)
  const header = req.headers.get("authorization");
  if (!header) return false;
  return header === `Bearer ${secret}`;
}

/** GET /api/assessments — list all (public). */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const sb = getSupabaseServer();
  const { data, error } = await sb
    .from("assessments")
    .select("*")
    .order("aggregate_score", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ assessments: data ?? [] });
}

/** POST /api/assessments — upsert a single assessment. */
export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const a = body as any;
  if (!a?.id || !a?.company?.name || !a?.scores?.aggregate) {
    return NextResponse.json(
      { error: "missing required fields: id, company.name, scores.aggregate" },
      { status: 400 }
    );
  }

  const row = {
    id: a.id,
    date: a.date ?? new Date().toISOString().slice(0, 10),
    tier: a.tier,
    confidence: a.confidence,
    aggregate_score: a.scores.aggregate,
    sender_score: a.scores.sender,
    leadership_score: a.scores.leadership,
    company_score: a.scores.company,
    company_name: a.company.name,
    company_domain: a.company.domain ?? null,
    company_website: a.company.website ?? null,
    sender_name: a.sender?.name ?? null,
    sender_title: a.sender?.title ?? null,
    sender_email: a.sender?.email ?? null,
    take_the_meeting: a.recommendation?.take_the_meeting ?? null,
    company: a.company,
    sender: a.sender,
    leadership: a.leadership ?? [],
    leadership_avg: a.leadership_avg ?? null,
    leadership_weighted: a.leadership_weighted ?? null,
    leadership_readout: a.leadership_readout ?? null,
    company_sub_scores: a.company_sub_scores ?? null,
    company_score_rationale: a.company_score_rationale ?? null,
    scores: a.scores,
    email_summary: a.email_summary ?? null,
    recommendation: a.recommendation ?? null,
    fast_take: a.fast_take ?? null,
    agency_fit: a.agency_fit ?? null,
    sources: a.sources ?? {},
    discovery_questions: a.discovery_questions ?? null,
  };

  const sb = getSupabaseServer();
  const { data, error } = await sb
    .from("assessments")
    .upsert(row, { onConflict: "id" })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ assessment: data }, { status: 200 });
}

/**
 * PATCH /api/assessments?id=slug — update lightweight mutable fields
 * (currently: last_meeting_at, next_meeting_at).
 *
 * Accepts JSON body: { last_meeting_at?: string|null, next_meeting_at?: string|null }
 * Values are ISO date strings (YYYY-MM-DD) or null to clear.
 *
 * Public like DELETE — the whole table is readable anyway, and write scope
 * here is narrow (just two date columns on a known id).
 */
export async function PATCH(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const ALLOWED = new Set(["last_meeting_at", "next_meeting_at"]);
  const update: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (!ALLOWED.has(k)) continue;
    if (v === null || v === "") update[k] = null;
    else if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) update[k] = v;
    else
      return NextResponse.json(
        { error: `invalid value for ${k} (expect YYYY-MM-DD or null)` },
        { status: 400 }
      );
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: "no patchable fields in body" },
      { status: 400 }
    );
  }

  const sb = getSupabaseServer();
  const { data, error } = await sb
    .from("assessments")
    .update(update)
    .eq("id", id)
    .select("id,last_meeting_at,next_meeting_at")
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, ...data });
}

/**
 * DELETE /api/assessments?id=slug — delete a single assessment.
 *
 * Public (no Bearer required) so the dashboard can cancel/delete directly.
 * Symmetric with POST /api/intake which is also public. If an in-progress
 * research call finishes after deletion, the Edge Function's update targets
 * the now-missing id, so it no-ops silently.
 */
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const sb = getSupabaseServer();
  const { error } = await sb.from("assessments").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id });
}
