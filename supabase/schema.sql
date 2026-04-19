-- Vendor Credibility Assessment Schema
-- Single table: each row is one vendor assessment.
-- Rich nested structures (leadership, sub_scores, sources, questions) are JSONB.

create table if not exists public.assessments (
  id text primary key,                      -- kebab-case, e.g. "barrel"
  date date not null default current_date,
  tier text not null,                       -- "Strong Specialist Boutique" etc.
  confidence text not null check (confidence in ('high','medium','low')),

  -- Flat scores for fast filtering / sorting
  aggregate_score integer not null check (aggregate_score between 0 and 100),
  sender_score numeric(3,1) not null check (sender_score between 0 and 10),
  leadership_score numeric(3,1) not null check (leadership_score between 0 and 10),
  company_score numeric(3,1) not null check (company_score between 0 and 10),

  -- Denormalized headline fields for list views
  company_name text not null,
  company_domain text,
  company_website text,
  sender_name text,
  sender_title text,
  sender_email text,
  take_the_meeting boolean,

  -- Rich JSONB blobs (mirror assessments.json structure)
  company jsonb not null,
  sender jsonb not null,
  leadership jsonb not null default '[]',
  leadership_avg numeric(3,1),
  leadership_weighted numeric(3,1),
  leadership_readout text,
  company_sub_scores jsonb,
  company_score_rationale text,
  scores jsonb not null,
  email_summary jsonb,
  recommendation jsonb,
  fast_take jsonb,
  agency_fit jsonb,
  sources jsonb not null default '{}',
  discovery_questions jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assessments_aggregate_score_idx on public.assessments (aggregate_score desc);
create index if not exists assessments_date_idx on public.assessments (date desc);
create index if not exists assessments_tier_idx on public.assessments (tier);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

drop trigger if exists assessments_touch_updated_at on public.assessments;
create trigger assessments_touch_updated_at
  before update on public.assessments
  for each row execute function public.touch_updated_at();

alter table public.assessments enable row level security;
