# Vendor Credibility

Operator-grade vendor credibility assessments. Parse an outbound agency email, research the sender/company/leadership, score across multiple dimensions, and surface the decision in 10 seconds.

## Architecture

- **Next.js 15 + TypeScript + Tailwind** (App Router, server-first, Server Components for reads)
- **Supabase Postgres** as the single source of truth (one `assessments` table with JSONB columns)
- **Deployed on Vercel**, data in Supabase

Service-role Supabase access happens only on the server (`lib/supabase/server.ts`). No anon key, no client-side SDK.

## Local dev

```bash
cp .env.local.example .env.local
# fill NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from Supabase dashboard
npm install
npm run dev
```

Visit http://localhost:3000

## Schema

See `supabase/schema.sql`. One table (`assessments`) with:
- Flat columns for fast list/sort (aggregate_score, tier, company_name, etc.)
- JSONB columns for rich nested shapes (leadership, sub_scores, sources, discovery_questions)

## API

- `GET /api/assessments` — list all assessments
- `POST /api/assessments` — upsert one (body = full assessment object, Bearer `VC_API_SECRET`)
- `DELETE /api/assessments?id=slug` — delete one

## Claude skill

The `vendor-credibility` skill (see `SKILL.md`) parses `.eml` files and produces the assessment JSON. POST it to `/api/assessments` and it shows up in the dashboard.
