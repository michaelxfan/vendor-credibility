import Anthropic from "@anthropic-ai/sdk";

/**
 * Runs the vendor credibility research against Claude.
 *
 * web_search_20250305 is an Anthropic **server tool** — Anthropic does the
 * searching internally and returns the synthesized message in a single
 * Messages API call. So this is just one `messages.stream()` call: no outer
 * tool-use loop needed. The whole research + scoring + JSON emit happens in
 * one response.
 *
 * Tuned for Vercel hobby (60s serverless budget): 4 searches, sonnet 4.5,
 * 16k max tokens, streaming so the connection stays active throughout.
 */

const MODEL = "claude-sonnet-4-5-20250929";
const MAX_WEB_USES = 4;
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

interface ResearchInput {
  id: string;
  raw_email: string;
  company_name_hint: string;
  sender_name_hint: string | null;
  sender_email_hint: string | null;
  domain_hint: string | null;
}

export interface ResearchResult {
  assessment: Record<string, unknown>;
  web_searches: number;
}

export async function runResearch(
  input: ResearchInput,
  apiKey: string
): Promise<ResearchResult> {
  const client = new Anthropic({ apiKey });

  const userMessage = `Today is ${new Date().toISOString().slice(0, 10)}.

Use the id "${input.id}" in your output.

Hints (confirm via web_search):
- Company: ${input.company_name_hint}
- Sender: ${input.sender_name_hint ?? "(unknown)"}
- Email: ${input.sender_email_hint ?? "(unknown)"}
- Domain: ${input.domain_hint ?? "(unknown)"}

Raw email:
\`\`\`
${input.raw_email.slice(0, 40000)}
\`\`\`

Research and emit the <assessment> JSON block.`;

  const stream = client.messages.stream({
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
  });

  const response = await stream.finalMessage();

  let webSearches = 0;
  const textBlocks: string[] = [];
  for (const block of response.content) {
    if (block.type === "server_tool_use" && block.name === "web_search") {
      webSearches++;
    }
    if (block.type === "text") {
      textBlocks.push(block.text);
    }
  }
  const text = textBlocks.join("\n");

  const match = text.match(/<assessment>\s*([\s\S]+?)\s*<\/assessment>/);
  if (!match) {
    throw new Error(
      `No <assessment> block in response (stop_reason=${response.stop_reason}). Text: ${text.slice(0, 500)}`
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(match[1].trim());
  } catch (err) {
    throw new Error(
      `Failed to parse assessment JSON: ${(err as Error).message}`
    );
  }

  return { assessment: parsed, web_searches: webSearches };
}
