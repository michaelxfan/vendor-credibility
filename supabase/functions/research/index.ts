// Supabase Edge Function: vendor-credibility research.
//
// Why Supabase Edge Functions and not Vercel? Vercel hobby caps serverless
// functions at 60s, but a Claude sonnet-4-5 call with web_search + full
// JSON synthesis can take 60–120s. Supabase Edge Functions run on Deno with
// a 150s wall-clock limit, which comfortably fits the workload.
//
// Auth: Supabase validates the Bearer JWT in the Authorization header. The
// client passes the public anon key (SUPABASE_ANON_KEY / NEXT_PUBLIC_...),
// which is how every Supabase-auth'd app works. Inside the function we use
// the service role key (injected by Supabase) for DB writes.
//
// This function is idempotent against `pending` and stale `researching`
// rows (>90s old) and refuses to re-run a completed assessment.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const MODEL = "claude-sonnet-4-5-20250929";
const MAX_WEB_USES = 5;
const MAX_TOKENS = 16384;

const SYSTEM_PROMPT = `You research vendor credibility for an operator evaluating external partners.

Input: a raw email from a vendor (typically an agency, consultant, or sales person).

Your job, in ONE response:
1. Use web_search to find the sender on LinkedIn and the company's about/team page.
2. Use web_search to find 1–2 leadership profiles (CEO/founders) and any third-party reviews (Clutch, Glassdoor).
3. Score sender, leadership, company on 0–10 scales. Aggregate = (sender * 0.25 + leadership * 0.35 + company * 0.40) * 10, rounded.
4. Emit ONE <assessment>{...}</assessment> block with the JSON below. No prose before or after the tags.

Tier mapping (by aggregate):
- 80–100: Premium strategic partner
- 65–79: Strong specialist boutique
- 50–64: Capable but mid-market vendor
- 35–49: Commodity agency / execution shop
- 20–34: Weak credibility / proceed cautiously
- 0–19: Likely low-quality outreach

JSON schema (match exactly — all fields required, arrays can be empty):
{
  "id": "kebab-case-slug",
  "date": "YYYY-MM-DD",
  "tier": "...",
  "confidence": "high" | "medium" | "low",
  "scores": { "sender": 0-10, "leadership": 0-10, "company": 0-10, "aggregate": 0-100 },
  "company": {
    "name":"", "domain":"", "website":"",
    "description":"", "services":[], "geography":"", "size":"",
    "founded":"", "years_in_operation":0, "shopify_status":"",
    "named_clients":[], "client_mix":"", "reviews_summary":"",
    "website_quality":"", "positioning":"",
    "red_flags":[], "positive_signals":[]
  },
  "sender": {
    "name":"", "title":"", "email":"", "linkedin":"",
    "linkedin_confidence":"high"|"medium"|"low",
    "background":"", "credibility_signals":[], "concerns":[],
    "sub_scores": {"seniority":0-10,"experience":0-10,"credibility":0-10,"communication":0-10,"trustworthiness":0-10},
    "score": 0-10, "score_rationale":""
  },
  "leadership": [
    {"name":"","title":"","linkedin":"","background":"","strengths":"","risks":"","score":0-10,"confidence":"high"|"medium"|"low","weight":1|2}
  ],
  "leadership_avg": 0-10,
  "leadership_weighted": 0-10,
  "leadership_readout": "",
  "company_sub_scores": {"legitimacy":0-10,"capability":0-10,"specialization_fit":0-10,"quality_polish":0-10,"proof_of_execution":0-10,"leadership_strength":0-10,"sophisticated_client_handling":0-10,"communication_maturity":0-10,"risk_level":0-10,"overall_confidence":0-10},
  "company_score": 0-10,
  "company_score_rationale": "",
  "email_summary": {"subject":"","date_sent":"","offer_summary":"","claims":[],"cc_contacts":[{"name":"","email":"","title":""}],"email_client":""},
  "recommendation": {"caliber":"","working_style":"","strengths":[],"weaknesses":[],"communication_style":"","diligence_level":"","take_the_meeting":true|false,"next_step":""},
  "fast_take": {"legitimacy":"","competence":"","polish":"","risk":"","stance":""},
  "agency_fit": {"is_agency":true|false,"ecommerce_fit":0-10,"strategic_depth":0-10,"execution_confidence":0-10,"taste_design_maturity":0-10,"best_fit_client":"","portfolio_assessment":"","operator_understanding":""},
  "sources": {"sender":[{"label":"","url":""}],"company":[{"label":"","url":""}],"leadership":[{"label":"","url":""}],"reviews":[{"label":"","url":""}]},
  "discovery_questions": {
    "key_risks": [],
    "questions": [{"category":"","priority":"high"|"medium"|"low","timing":"early"|"middle"|"late","objective":"","question":"","strong_answer":[],"weak_answer":[]}],
    "usage_guide": {"ask_first":[{"index":0,"reason":""}],"ask_middle":[{"index":0,"reason":""}],"ask_late":[{"index":0,"reason":""}],"lean_in_signals":[],"walk_away_signals":[]}
  }
}

Rules:
- Never fabricate URLs — only cite URLs from web_search results.
- Keep text fields concise (1–2 sentences).
- Produce 3–6 discovery questions, grounded in the specific risks you found.
- Emit the <assessment> block only once, after research.`;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...CORS },
  });
}

/**
 * Read a secret from Supabase Vault via an RPC (the `vault` schema isn't
 * exposed through PostgREST directly). The `public.get_secret(text)` function
 * is security-definer and only executable by service_role.
 */
async function vaultSecret(
  sb: ReturnType<typeof createClient>,
  name: string
): Promise<string | null> {
  const { data, error } = await sb.rpc("get_secret", { secret_name: name });
  if (error) {
    console.error("vault read error:", error);
    return null;
  }
  return (data as string | null) ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }
  if (req.method !== "POST") {
    return json({ error: "method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) {
    return json({ error: "function is missing Supabase env vars" }, 500);
  }

  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }
  const id = body.id;
  if (!id) return json({ error: "missing id" }, 400);

  const sb = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Prefer env var (if set), fall back to Vault secret.
  const anthropicKey =
    Deno.env.get("ANTHROPIC_API_KEY") ??
    (await vaultSecret(sb, "ANTHROPIC_API_KEY"));
  if (!anthropicKey) {
    return json({ error: "ANTHROPIC_API_KEY not configured (env var or Vault)" }, 500);
  }

  const { data: row, error: readErr } = await sb
    .from("assessments")
    .select(
      "id,status,raw_email,email_summary,company_name,sender_name,sender_email,company_domain,updated_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (readErr || !row) {
    return json({ error: readErr?.message ?? "assessment not found" }, 404);
  }
  if (!row.raw_email) {
    return json({ error: "row has no raw_email to research" }, 400);
  }
  if (row.status === "complete") {
    return json({ id, status: "complete", message: "already complete" });
  }
  // Stuck-row auto-recovery
  if (row.status === "researching") {
    const ageMs = Date.now() - new Date(row.updated_at).getTime();
    if (ageMs < 90_000) {
      return json({
        id,
        status: "researching",
        message: `already in progress (${Math.round(ageMs / 1000)}s)`,
      });
    }
    console.warn(`reclaiming stuck row ${id}, age=${Math.round(ageMs / 1000)}s`);
  }

  await sb
    .from("assessments")
    .update({ status: "researching", error_message: null })
    .eq("id", id);

  // Prefer decoded, cleaned body_text (set by /api/intake). Fall back to raw
  // EML only if it's missing. The raw EML is MIME-encoded garbage that
  // triggers Claude's prompt-injection safety filter; the decoded body is
  // human-readable text.
  // deno-lint-ignore no-explicit-any
  const summary = (row as any).email_summary;
  const bodyForClaude: string =
    summary?.body_text ?? row.raw_email.slice(0, 40000);
  const bodyLabel = summary?.body_text ? "Email body (decoded)" : "Raw email (MIME)";

  const userMessage = `Today is ${new Date().toISOString().slice(0, 10)}.

Use the id "${id}" in your output.

Hints (confirm via web_search):
- Company: ${row.company_name}
- Sender: ${row.sender_name ?? "(unknown)"}
- Email: ${row.sender_email ?? "(unknown)"}
- Domain: ${row.company_domain ?? "(unknown)"}
- Subject: ${summary?.subject ?? "(unknown)"}

${bodyLabel}:
\`\`\`
${bodyForClaude}
\`\`\`

Research the sender's company via web_search and emit the <assessment> JSON block.`;

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        tools: [
          {
            type: "web_search_20250305",
            name: "web_search",
            max_uses: MAX_WEB_USES,
          },
        ],
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Anthropic API ${resp.status}: ${errText.slice(0, 500)}`);
    }

    const data = await resp.json();
    const content = data.content ?? [];
    let webSearches = 0;
    const texts: string[] = [];
    for (const block of content) {
      if (block.type === "server_tool_use" && block.name === "web_search") {
        webSearches++;
      }
      if (block.type === "text" && typeof block.text === "string") {
        texts.push(block.text);
      }
    }
    const text = texts.join("\n");
    const match = text.match(/<assessment>\s*([\s\S]+?)\s*<\/assessment>/);
    if (!match) {
      if (data.stop_reason === "refusal") {
        throw new Error(
          "Claude's safety filter declined to process this email. This usually happens when the email contains unusual encoded content (base64 blobs, tracking canaries). Try uploading a simpler version of the email, or use the Claude skill locally."
        );
      }
      throw new Error(
        `Claude returned no <assessment> block (stop_reason=${data.stop_reason}). Preview: ${text.slice(0, 400)}`
      );
    }

    // deno-lint-ignore no-explicit-any
    const a = JSON.parse(match[1].trim()) as any;

    const updateRow = {
      status: "complete",
      error_message: null,
      date: a.date ?? new Date().toISOString().slice(0, 10),
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

    const { error: updErr } = await sb
      .from("assessments")
      .update(updateRow)
      .eq("id", id);
    if (updErr) {
      await sb
        .from("assessments")
        .update({ status: "error", error_message: updErr.message })
        .eq("id", id);
      return json({ error: updErr.message }, 500);
    }
    return json({ id, status: "complete", web_searches: webSearches });
  } catch (err) {
    const msg = (err as Error).message ?? String(err);
    console.error("research error:", msg);
    await sb
      .from("assessments")
      .update({ status: "error", error_message: msg })
      .eq("id", id);
    return json({ error: msg }, 500);
  }
});
