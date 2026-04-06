---
name: vendor-credibility
description: >
  Parses vendor/agency outreach emails (.eml files) and produces an operator-grade HTML credibility dashboard. Researches the sender, company, and leadership team online, then scores them on legitimacy, capability, and fit. All assessments accumulate in a single interactive dashboard. Use this skill whenever the user uploads or references an .eml file for evaluation, or says things like "assess this vendor", "evaluate this email", "vendor check", "who is this company", "credibility assessment", "should I take this meeting", "research this agency", "evaluate this outreach", or provides an EML file path with context suggesting they want to vet the sender. Also triggers on: "run vendor assessment", "score this agency", "is this legit", "check this email", "open vendor dashboard".
---

# Vendor Credibility Assessment

You are an external research and assessment agent. Given an uploaded `.eml` file, you parse it, research the sender and company online, score them across multiple dimensions, and update a persistent HTML dashboard with the results.

## File Locations

- **Assessment data**: `~/Desktop/claude/vendor-credibility/assessments.json`
- **Dashboard**: `~/Desktop/claude/vendor-credibility/dashboard.html`

Create the directory if it doesn't exist: `mkdir -p ~/Desktop/claude/vendor-credibility/`

---

## assessments.json Schema

```json
{
  "assessments": [
    {
      "id": "company-kebab-case",
      "date": "2026-04-06",
      "company": {
        "name": "Barrel",
        "domain": "barrelny.com",
        "website": "https://www.barrelny.com",
        "description": "CPG commerce agency specializing in Shopify Plus",
        "services": ["Shopify Plus", "Ecommerce Design", "CRO"],
        "geography": "New York, NY + Los Angeles",
        "size": "10-75 employees",
        "founded": "2006",
        "years_in_operation": 20,
        "shopify_status": "Premier Partner",
        "named_clients": ["McCormick", "L'Oreal Paris"],
        "client_mix": "50% midmarket, 30% SMB, 20% enterprise",
        "reviews_summary": "Clutch: no reviews. Glassdoor: 3.2/5.",
        "website_quality": "Professional, clean, case studies have depth",
        "positioning": "CPG-focused Shopify specialist boutique",
        "red_flags": ["Zero Clutch reviews despite 20 years", "Glassdoor 3.2/5"],
        "positive_signals": ["Shopify Premier Partner", "20-year track record", "Real brand clients"]
      },
      "sender": {
        "name": "Lucas Ballasy",
        "title": "CEO, Partner",
        "email": "lucas.ballasy@barrelny.com",
        "linkedin": "https://www.linkedin.com/in/lucasjballasy/",
        "linkedin_confidence": "high",
        "background": "Temple Univ. At Barrel since 2013. Designer to CEO.",
        "credibility_signals": ["13 years tenure", "Uses Superhuman", "Personal blog"],
        "concerns": ["Design background, not strategy-first"],
        "sub_scores": {
          "seniority": 9.0,
          "experience": 8.0,
          "credibility": 8.0,
          "communication": 6.5,
          "trustworthiness": 8.0
        },
        "score": 7.9,
        "score_rationale": "CEO personally replied. Strong tenure and credibility. Communication was warm but not strategically sharp."
      },
      "leadership": [
        {
          "name": "Lucas Ballasy",
          "title": "CEO & Partner",
          "linkedin": "https://www.linkedin.com/in/lucasjballasy/",
          "background": "Temple Univ. At Barrel since 2013.",
          "strengths": "13 years tenure, venture arm, active content",
          "risks": "Design background, not original founder",
          "score": 7.5,
          "confidence": "high",
          "weight": 2
        }
      ],
      "leadership_avg": 7.0,
      "leadership_weighted": 7.4,
      "leadership_readout": "Strong founding team stepped back to Holdings. Day-to-day run by capable but less strategic CEO.",
      "company_sub_scores": {
        "legitimacy": 9.0,
        "capability": 8.0,
        "specialization_fit": 8.5,
        "quality_polish": 7.5,
        "proof_of_execution": 8.0,
        "leadership_strength": 7.4,
        "sophisticated_client_handling": 7.0,
        "communication_maturity": 6.5,
        "risk_level": 7.5,
        "overall_confidence": 7.5
      },
      "company_score": 7.7,
      "company_score_rationale": "Legitimate, specialized, capable. Communication maturity and review gaps are the main weaknesses.",
      "scores": {
        "sender": 7.9,
        "leadership": 7.4,
        "company": 7.7,
        "aggregate": 72
      },
      "tier": "Strong Specialist Boutique",
      "confidence": "high",
      "email_summary": {
        "subject": "Re: Greenhouse <> Barrel Intro",
        "date_sent": "2026-04-02",
        "offer_summary": "Response to outreach about website redesign. Referral via Adam at Sircle.",
        "claims": ["Partner Manager David worked with team at Shopify", "Connected via Sircle"],
        "cc_contacts": [
          {"name": "Soliez Chua", "email": "soliez.chua@barrelny.com", "title": "unknown"},
          {"name": "Nadia Reynolds", "email": "nadia.reynolds@barrelny.com", "title": "Business Development Manager"}
        ],
        "email_client": "Superhuman Desktop"
      },
      "recommendation": {
        "caliber": "Strong Specialist Boutique",
        "working_style": "Process-driven, design-forward, Shopify-native",
        "strengths": ["Deep Shopify Plus expertise", "CPG/food-bev specialization", "20-year track record", "CEO personally engaged"],
        "weaknesses": ["Founding minds stepped back to Holdings", "No Clutch reviews", "Glassdoor 3.2/5", "Initial emails warm but not strategically sharp"],
        "communication_style": "Warm but evaluative",
        "diligence_level": "Standard diligence",
        "take_the_meeting": true,
        "next_step": "Reply with scope overview, request relevant case studies, schedule 30-min discovery call"
      },
      "fast_take": {
        "legitimacy": "Very real. 20-year track record, Shopify Premier Partner, recognizable clients.",
        "competence": "Strong in Shopify execution and CPG design. Strategic depth adequate but not exceptional.",
        "polish": "Good but not elite. Clean website and case studies, but emails were warm-not-insightful.",
        "risk": "Low to moderate. Main risk is solid execution without enough strategic partnership.",
        "stance": "Take the meeting. Legitimate specialist boutique with strong CPG/Shopify fit."
      },
      "agency_fit": {
        "is_agency": true,
        "ecommerce_fit": 8.5,
        "strategic_depth": 6.5,
        "execution_confidence": 8.0,
        "taste_design_maturity": 7.5,
        "best_fit_client": "Mid-market CPG brands ($10M-$500M) doing DTC on Shopify Plus",
        "portfolio_assessment": "Largely custom work, not templated. Strong food/bev and beauty focus.",
        "operator_understanding": "DTC Patterns research project (300+ articles) shows genuine ecommerce understanding."
      },
      "sources": {
        "sender": [
          {"label": "LinkedIn", "url": "https://www.linkedin.com/in/lucasjballasy/"},
          {"label": "Personal Blog", "url": "https://www.lucasballasy.com/"}
        ],
        "company": [
          {"label": "Main Website", "url": "https://www.barrelny.com/"},
          {"label": "About / Team", "url": "https://www.barrelny.com/about"}
        ],
        "leadership": [
          {"label": "Peter Kang - LinkedIn", "url": "https://www.linkedin.com/in/peterkang34/"}
        ],
        "reviews": [
          {"label": "Clutch", "url": "https://clutch.co/profile/barrel"},
          {"label": "Glassdoor", "url": "https://www.glassdoor.com/Reviews/Barrel-Reviews-E644307.htm"}
        ]
      }
    }
  ]
}
```

---

## Operations

### Assess a vendor (from EML)

1. Read the raw EML file.
2. Parse headers + body (see **EML Parsing** below).
3. Research the sender, company, and leadership (see **Research Steps** below).
4. Score everything (see **Scoring Framework** below).
5. Generate discovery questions (see **Discovery Questions** below).
6. Read `assessments.json` (or start with `{"assessments": []}` if it doesn't exist).
7. Append the new assessment object (including `discovery_questions`).
8. Write updated `assessments.json`.
9. Regenerate `dashboard.html` (see **Dashboard Generation** below).
10. Open in browser: `open ~/Desktop/claude/vendor-credibility/dashboard.html`

### View the dashboard

Just open it: `open ~/Desktop/claude/vendor-credibility/dashboard.html`

### Delete an assessment

1. Read `assessments.json`.
2. Find by company name or id (fuzzy match; if ambiguous, list candidates and ask).
3. Remove the entry.
4. Write updated `assessments.json`, regenerate dashboard, open.

### Update an assessment

1. Find the assessment.
2. Re-run research or accept updated fields from user.
3. Recompute scores.
4. Write updated `assessments.json`, regenerate dashboard, open.

---

## EML Parsing

Read the raw EML file. Extract:

### From Headers
- `From:` — sender name + email
- `Subject:` — email subject
- `To:` / `Cc:` — recipients
- `Date:` — when sent
- `X-Mailer:` — email client (Superhuman = high signal)

### From Body (text/plain section)
- Full message text (stop before quoted/forwarded content)
- Signature block — everything after `--` or sender name repeated with title

### From Signature
- Name, title, company, website, phone, address, social/portfolio links

### From HTML Section
- Any embedded href links (portfolio, case studies, calendly, LinkedIn)

Output a structured summary. If something is not found, say "not found" — never fabricate.

---

## Research Steps

### Sender Research
1. WebSearch: `"{sender name}" "{company name}" LinkedIn`
2. WebSearch: `"{sender name}" "{company name}"`
3. WebFetch promising LinkedIn or bio URLs

Capture: LinkedIn URL + confidence, current role, career history, evidence they work there, seniority, professional presence quality, red flags.

### Company Research
1. WebSearch: `"{company name}" agency` (or relevant term)
2. WebSearch: `"{company name}" reviews`
3. WebSearch: `"{company name}" case studies portfolio`
4. WebFetch: company website homepage, about/team, case studies, services pages

Capture: description, services, geography, size, years in operation, named clients, case studies quality, reviews (Clutch, G2, Glassdoor), website quality, positioning, red flags.

### Leadership Research
Find: founders, CEO, CTO, COO, managing partners.
1. WebSearch: `"{leader name}" "{company name}" LinkedIn`
2. WebFetch promising profile URLs

Per leader: name, title, LinkedIn URL + confidence, background, strengths, risks, score (1-10).

---

## Scoring Framework

### A. Sender Score (1-10)

Average of 5 sub-dimensions:

| Dimension | Assess |
|-----------|--------|
| Seniority / Authority | Founder/partner/director = high. SDR/coordinator = low. |
| Relevant Experience | Real experience in domain they're pitching? |
| Credibility Signals | Strong LinkedIn, coherent career, specific expertise |
| Communication Quality | Clarity, specificity, taste, templated vs thoughtful |
| Trustworthiness | Legitimate feel, consistent across email/site/profile |

### B. Leadership Score (1-10)

Per leader: average of career quality, functional relevance, operator credibility, strategic credibility, evidence of shipped work.

**Weighted average**: founders/CEO/managing partners at 2x weight, others at 1x.

If no leadership found: score = 3.0 (opacity penalty).

### C. Company Score (1-10)

Average of 10 sub-dimensions:
1. Legitimacy
2. Capability
3. Specialization Fit
4. Quality / Polish
5. Proof of Execution
6. Leadership Strength (from B)
7. Sophisticated Client Handling
8. Communication Maturity
9. Risk Level (10 = no risk, 1 = high risk)
10. Overall Confidence

### D. Aggregate Score (1-100)

```
Aggregate = (Sender × 0.25 + Leadership × 0.35 + Company × 0.40) × 10
```

### E. Tier Classification

| Score | Tier |
|-------|------|
| 80-100 | Premium strategic partner |
| 65-79 | Strong specialist boutique |
| 50-64 | Capable but mid-market vendor |
| 35-49 | Commodity agency / execution shop |
| 20-34 | Weak credibility / proceed cautiously |
| 0-19 | Likely low-quality outreach |

### F. Agency Fit (only for agencies)

Score: Ecommerce Fit, Strategic Depth, Execution Confidence, Taste / Design Maturity (each 1-10).

---

## Scoring Criteria Guidelines

### Positive Signals
- Clear leadership with real profiles
- Coherent, specialized positioning
- Real case studies with named clients and measurable outcomes
- Transparent website with team bios
- Professional, non-templated communication
- Years of operation (5+ = stable)
- Operator backgrounds on team
- Sophisticated tool usage (Superhuman, Figma, etc.)

### Negative Signals
- Generic/spammy outreach
- Title inflation, unclear identity
- Inflated claims without proof
- Vague portfolio, stock photos, hidden team
- No LinkedIn presence for key people
- Inconsistent info across email/site/profiles
- Outsourced lead-gen patterns (Instantly, Apollo)
- Fake urgency or hard-sell tone
- Domain age < 2 years with big claims

---

## Communication Recommendations

### Interaction Style by Tier
- **80+**: Executive and direct. Treat as peer.
- **65-79**: Warm but evaluative. Ask for case studies.
- **50-64**: Highly specific and scoped. Test with small pilot.
- **35-49**: Only respond if they provide proof.
- **20-34**: Require references and technical validation.
- **0-19**: Ignore.

### Diligence Level by Tier
- **80+**: Low diligence. Standard reference check.
- **65-79**: Standard diligence. Portfolio + 1-2 references.
- **50-64**: High diligence. References + technical call.
- **35-49**: Require proof before any call.
- **20-34**: Consider alternatives. Require technical validation.
- **0-19**: Do not engage.

---

## Discovery Questions

After scoring, generate operator-level discovery questions to ask the vendor. These are NOT generic — they must be grounded in the specific risks and gaps found during assessment.

### Step 1: Identify Key Risks

Extract 3-5 of the most important uncertainties from the assessment. Examples:
- Strategic depth may have left with departing leadership
- Unclear who actually does the work
- No third-party validation despite claims
- Communication quality doesn't match claimed caliber
- Portfolio doesn't match the specific use case

### Step 2: Generate Questions

For EACH risk, generate 1-2 questions. Each question must:
- Be specific and grounded in the vendor's context (reference their actual people, projects, claims)
- Force a concrete answer (not generic fluff)
- Expose how they actually think and operate
- Be phrased naturally (how an experienced operator would ask)

### Required Question Mix

Include at least one from each category:

| Category | Purpose |
|----------|---------|
| Strategic Depth | Test thinking beyond execution |
| Team | Identify who actually does the work |
| Proof of Competence | Validate claims with specifics and metrics |
| Communication | Assess how they handle a hands-on client |
| Execution | Pressure-test real process vs performative process |
| Failure | Test transparency about things going wrong |

### Step 3: Structure Each Question

```json
{
  "category": "Strategy",
  "priority": "high",
  "timing": "early",
  "objective": "What this question tries to uncover",
  "question": "Exact wording to say",
  "strong_answer": ["signal 1", "signal 2"],
  "weak_answer": ["red flag 1", "red flag 2"]
}
```

Priority: `high` (ask no matter what), `medium` (ask if time permits), `low` (only if going well).
Timing: `early` (sets the tone), `middle` (deepens picture), `late` (confirms or kills).

### Step 4: Generate Usage Guide

```json
{
  "ask_first": [{"index": 0, "reason": "why this one first"}],
  "ask_middle": [{"index": 1, "reason": "why"}],
  "ask_late": [{"index": 2, "reason": "why"}],
  "lean_in_signals": ["signal that the vendor is strong"],
  "walk_away_signals": ["signal to disengage"]
}
```

### Quality Bar

**Good questions** cannot be answered with generic agency talk, require specifics or tradeoffs, reveal how they actually operate.

**Bad questions** (avoid): "What is your process?", "What makes you different?", "Can you tell me about your experience?"

### Tone

Direct, calm, operator-level, slightly skeptical but not aggressive. Should feel like the questioner knows what they're doing.

---

## Dashboard Generation

After every change to `assessments.json`, regenerate `dashboard.html`.

Read `assessments.json`, then write a complete self-contained HTML file to `~/Desktop/claude/vendor-credibility/dashboard.html`.

### Requirements
- **Self-contained**: all CSS + JS inline. No external CDN, no frameworks.
- **Works by double-click**: `file://` protocol.
- **Dark theme**: #0f0f0f background, card-based layout.
- **Responsive**: works on any screen width.
- **Print-friendly**: `@media print` styles.

### Dashboard Features
- **Vendor list sidebar**: all assessed vendors, sorted by score (desc). Each shows: company name, score badge, tier badge, date.
- **Click a vendor**: shows the full assessment detail in the main panel.
- **Default view**: most recently assessed vendor selected.
- **Score visualizations**: colored progress bars (red < 4, yellow 4-7, green > 7).
- **Aggregate score**: large circular indicator in header.
- **Tier badge**: color-coded.
- **Leadership table**: all leaders with scores.
- **Fast Take**: highlighted box with 5 bullet points.
- **Recommendation cards**: caliber, style, diligence, next step.
- **Source links**: grouped and clickable.
- **Agency Fit section**: only shown if `agency_fit.is_agency` is true.
- **Search/filter**: text search across vendor names.

### Embed Data

Embed the full assessments array as a JS variable at the top of the `<script>` block:

```javascript
const ASSESSMENTS = /* paste full assessments array here */;
```

The dashboard JS reads from this variable to render everything client-side.

### Tone
The dashboard should read like a concise intelligence briefing. Lead with scores and tier. Fast Take should be blunt. Recommendations should be specific and decisive. No filler.

---

## Important Rules

- Never fabricate data. Label uncertain items clearly.
- Cite source URLs for every major claim.
- If LinkedIn match is ambiguous, provide candidates with confidence levels.
- Be concise, sharp, skeptical, useful.
- Prioritize truth, signal, decision usefulness.
- After every data change: write JSON, regenerate HTML, open browser.
