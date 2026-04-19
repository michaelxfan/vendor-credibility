import Anthropic from "@anthropic-ai/sdk";

/**
 * Runs the vendor credibility research loop against Claude.
 * Uses the built-in web_search_20250305 tool so Claude can do its own research.
 *
 * Returns a parsed assessment JSON on success.
 */

const MODEL = "claude-sonnet-4-5-20250929";
const MAX_TOOL_ROUNDS = 15;
const MAX_WEB_USES = 10;

const SYSTEM_PROMPT = `You are an operator-grade vendor credibility research agent.

Given a raw email from a vendor (typically a web/creative/marketing agency reaching out to a CPG brand), you will:

1. Identify the sender (name, title, email, LinkedIn) and the company (name, domain, services, size, years in operation, named clients).
2. Use web_search to find the sender on LinkedIn and any bio/team pages.
3. Use web_search to find company leadership (founders, CEO, CTO, managing partners) with LinkedIn profiles.
4. Use web_search to find third-party reviews (Clutch, G2, Glassdoor).
5. Score across multiple dimensions.
6. Generate operator-level discovery questions grounded in the actual risks you found.

Weighting for the aggregate score: sender 25%, leadership 35%, company 40%.

Tier by aggregate (1–100):
- 80–100: Premium strategic partner
- 65–79: Strong specialist boutique
- 50–64: Capable but mid-market vendor
- 35–49: Commodity agency / execution shop
- 20–34: Weak credibility / proceed cautiously
- 0–19: Likely low-quality outreach

OUTPUT PROTOCOL

When research is complete, emit ONE and only one <assessment>...</assessment> block containing a SINGLE JSON object (no prose before or after the tags) matching this schema exactly:

{
  "id": "kebab-case-slug",
  "date": "YYYY-MM-DD",
  "tier": "Strong Specialist Boutique",
  "confidence": "high" | "medium" | "low",
  "scores": { "sender": 0-10, "leadership": 0-10, "company": 0-10, "aggregate": 0-100 },
  "company": {
    "name": "", "domain": "", "website": "",
    "description": "", "services": [], "geography": "", "size": "",
    "founded": "", "years_in_operation": 0, "shopify_status": "",
    "named_clients": [], "client_mix": "", "reviews_summary": "",
    "website_quality": "", "positioning": "",
    "red_flags": [], "positive_signals": []
  },
  "sender": {
    "name": "", "title": "", "email": "", "linkedin": "",
    "linkedin_confidence": "high" | "medium" | "low",
    "background": "", "credibility_signals": [], "concerns": [],
    "sub_scores": {
      "seniority": 0-10, "experience": 0-10, "credibility": 0-10,
      "communication": 0-10, "trustworthiness": 0-10
    },
    "score": 0-10,
    "score_rationale": ""
  },
  "leadership": [
    {
      "name": "", "title": "", "linkedin": "",
      "background": "", "strengths": "", "risks": "",
      "score": 0-10, "confidence": "high" | "medium" | "low",
      "weight": 1 | 2
    }
  ],
  "leadership_avg": 0-10,
  "leadership_weighted": 0-10,
  "leadership_readout": "",
  "company_sub_scores": {
    "legitimacy": 0-10, "capability": 0-10, "specialization_fit": 0-10,
    "quality_polish": 0-10, "proof_of_execution": 0-10,
    "leadership_strength": 0-10, "sophisticated_client_handling": 0-10,
    "communication_maturity": 0-10, "risk_level": 0-10, "overall_confidence": 0-10
  },
  "company_score": 0-10,
  "company_score_rationale": "",
  "email_summary": {
    "subject": "", "date_sent": "", "offer_summary": "",
    "claims": [], "cc_contacts": [{"name":"","email":"","title":""}],
    "email_client": ""
  },
  "recommendation": {
    "caliber": "", "working_style": "",
    "strengths": [], "weaknesses": [],
    "communication_style": "", "diligence_level": "",
    "take_the_meeting": true | false,
    "next_step": ""
  },
  "fast_take": {
    "legitimacy": "", "competence": "", "polish": "", "risk": "", "stance": ""
  },
  "agency_fit": {
    "is_agency": true | false,
    "ecommerce_fit": 0-10, "strategic_depth": 0-10,
    "execution_confidence": 0-10, "taste_design_maturity": 0-10,
    "best_fit_client": "", "portfolio_assessment": "",
    "operator_understanding": ""
  },
  "sources": {
    "sender": [{"label":"","url":""}],
    "company": [{"label":"","url":""}],
    "leadership": [{"label":"","url":""}],
    "reviews": [{"label":"","url":""}]
  },
  "discovery_questions": {
    "key_risks": [],
    "questions": [
      {
        "category": "", "priority": "high"|"medium"|"low", "timing": "early"|"middle"|"late",
        "objective": "",
        "question": "",
        "strong_answer": [], "weak_answer": []
      }
    ],
    "usage_guide": {
      "ask_first": [{"index":0,"reason":""}],
      "ask_middle": [{"index":0,"reason":""}],
      "ask_late": [{"index":0,"reason":""}],
      "lean_in_signals": [],
      "walk_away_signals": []
    }
  }
}

Rules:
- NEVER fabricate LinkedIn URLs or sources — only include URLs you actually retrieved from web_search.
- Label uncertain items clearly (use "uncertain" or "unverified" in text fields).
- Be concise, sharp, skeptical, and useful — operator-grade, not fluffy.
- Emit the <assessment> block only once, at the end, after you have enough info to score confidently.`;

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
  steps: number;
  web_searches: number;
}

export async function runResearch(
  input: ResearchInput,
  apiKey: string
): Promise<ResearchResult> {
  const client = new Anthropic({ apiKey });

  const initialUserMessage = `Today is ${new Date().toISOString().slice(0, 10)}.

I need you to run a full vendor credibility assessment. Use the tentative id "${input.id}" in your output.

Tentative context (confirm via research; correct if wrong):
- Company name hint: ${input.company_name_hint}
- Sender name hint: ${input.sender_name_hint ?? "(unknown)"}
- Sender email hint: ${input.sender_email_hint ?? "(unknown)"}
- Domain hint: ${input.domain_hint ?? "(unknown)"}

Here is the raw email:

\`\`\`eml
${input.raw_email.slice(0, 50000)}
\`\`\`

Run the research now. Use web_search as needed. When done, emit the <assessment>...</assessment> JSON block.`;

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: initialUserMessage },
  ];

  let webSearches = 0;
  let steps = 0;

  while (steps < MAX_TOOL_ROUNDS) {
    steps++;

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 16384,
      system: SYSTEM_PROMPT,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: MAX_WEB_USES - webSearches,
        },
      ],
      messages,
    });

    // Count web searches used
    for (const block of response.content) {
      if (block.type === "server_tool_use" && block.name === "web_search") {
        webSearches++;
      }
    }

    if (response.stop_reason === "end_turn" || response.stop_reason === "stop_sequence") {
      // Extract text and look for <assessment> block
      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n");

      const match = text.match(/<assessment>\s*([\s\S]+?)\s*<\/assessment>/);
      if (!match) {
        throw new Error(
          "Claude stopped without emitting an <assessment> block. Raw output: " +
            text.slice(0, 500)
        );
      }
      const raw = match[1].trim();
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(raw);
      } catch (err) {
        throw new Error(
          "Failed to parse assessment JSON: " + (err as Error).message + "\nRaw: " + raw.slice(0, 500)
        );
      }
      return { assessment: parsed, steps, web_searches: webSearches };
    }

    // Append assistant message so the next turn has context (server_tool_use
    // results are returned inline by the web_search tool, so we just feed the
    // whole response content back in).
    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason !== "tool_use") {
      // Unexpected stop (max_tokens, pause, etc.). Prompt to continue.
      messages.push({
        role: "user",
        content:
          "Continue. If you have enough research, emit the final <assessment> JSON block now.",
      });
    } else {
      // Web search is a server tool — results come back automatically, no user
      // tool_result block needed. Just prompt Claude to proceed.
      messages.push({
        role: "user",
        content:
          "Continue the research. Emit the <assessment> JSON block when you have enough data.",
      });
    }
  }

  throw new Error(`Research loop exceeded ${MAX_TOOL_ROUNDS} rounds without finishing`);
}
