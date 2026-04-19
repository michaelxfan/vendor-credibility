import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";
import { runResearch } from "@/lib/research";

export const runtime = "nodejs";
// Research can take a while (web_search round-trips). Pro plan: up to 800s;
// hobby caps at 60s. We cap logic-side in lib/research.ts via MAX_TOOL_ROUNDS.
export const maxDuration = 300;

function authorized(req: NextRequest): boolean {
  const secret = process.env.VC_API_SECRET;
  if (!secret) return true;
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

/**
 * POST /api/research
 * Body: { id: string }
 *
 * Reads the pending row, runs Claude research, updates the row with the
 * full assessment (status='complete') or an error (status='error').
 */
export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not set — cannot run automated research" },
      { status: 503 }
    );
  }

  let body: { id?: string };
  try {
    body = (await req.json()) as { id?: string };
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const id = body.id;
  if (!id) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }

  const sb = getSupabaseServer();
  const { data: row, error: readErr } = await sb
    .from("assessments")
    .select("id,status,raw_email,company_name,sender_name,sender_email,company_domain")
    .eq("id", id)
    .maybeSingle();

  if (readErr || !row) {
    return NextResponse.json(
      { error: readErr?.message ?? "assessment not found" },
      { status: 404 }
    );
  }
  if (!row.raw_email) {
    return NextResponse.json(
      { error: "row has no raw_email; nothing to research" },
      { status: 400 }
    );
  }
  if (row.status === "complete") {
    return NextResponse.json({ status: "complete", id, message: "already complete" });
  }
  if (row.status === "researching") {
    return NextResponse.json({ status: "researching", id, message: "already in progress" });
  }

  // Mark as researching
  await sb.from("assessments").update({ status: "researching", error_message: null }).eq("id", id);

  try {
    const { assessment, steps, web_searches } = await runResearch(
      {
        id,
        raw_email: row.raw_email,
        company_name_hint: row.company_name,
        sender_name_hint: row.sender_name,
        sender_email_hint: row.sender_email,
        domain_hint: row.company_domain,
      },
      apiKey
    );

    const a = assessment as any;
    const updateRow = {
      id,
      date: a.date ?? new Date().toISOString().slice(0, 10),
      status: "complete" as const,
      error_message: null,
      tier: a.tier,
      confidence: a.confidence,
      aggregate_score: a.scores?.aggregate,
      sender_score: a.scores?.sender,
      leadership_score: a.scores?.leadership,
      company_score: a.scores?.company,
      company_name: a.company?.name ?? row.company_name,
      company_domain: a.company?.domain ?? row.company_domain,
      company_website: a.company?.website ?? null,
      sender_name: a.sender?.name ?? row.sender_name,
      sender_title: a.sender?.title ?? null,
      sender_email: a.sender?.email ?? row.sender_email,
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

    const { error: updateErr } = await sb
      .from("assessments")
      .update(updateRow)
      .eq("id", id);

    if (updateErr) {
      await sb
        .from("assessments")
        .update({ status: "error", error_message: updateErr.message })
        .eq("id", id);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ id, status: "complete", steps, web_searches });
  } catch (err) {
    const msg = (err as Error).message;
    await sb
      .from("assessments")
      .update({ status: "error", error_message: msg })
      .eq("id", id);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
