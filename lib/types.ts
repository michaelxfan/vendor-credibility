// Types that mirror the `assessments` table and its nested JSONB shapes.

export type Confidence = "high" | "medium" | "low";

export interface Company {
  name: string;
  domain?: string;
  website?: string;
  description?: string;
  services?: string[];
  geography?: string;
  size?: string;
  founded?: string;
  years_in_operation?: number;
  shopify_status?: string;
  named_clients?: string[];
  client_mix?: string;
  reviews_summary?: string;
  website_quality?: string;
  positioning?: string;
  red_flags?: string[];
  positive_signals?: string[];
}

export interface SenderSubScores {
  seniority: number;
  experience: number;
  credibility: number;
  communication: number;
  trustworthiness: number;
}

export interface Sender {
  name: string;
  title?: string;
  email?: string;
  linkedin?: string;
  linkedin_confidence?: Confidence;
  background?: string;
  credibility_signals?: string[];
  concerns?: string[];
  sub_scores: SenderSubScores;
  score: number;
  score_rationale?: string;
}

export interface Leader {
  name: string;
  title: string;
  linkedin?: string;
  background?: string;
  strengths?: string;
  risks?: string;
  score: number;
  confidence: Confidence;
  weight: number; // 2 for founders/CEO/managing partners, 1 otherwise
}

export interface CompanySubScores {
  legitimacy: number;
  capability: number;
  specialization_fit: number;
  quality_polish: number;
  proof_of_execution: number;
  leadership_strength: number;
  sophisticated_client_handling: number;
  communication_maturity: number;
  risk_level: number;
  overall_confidence: number;
}

export interface Scores {
  sender: number;
  leadership: number;
  company: number;
  aggregate: number;
}

export interface EmailSummary {
  subject?: string;
  date_sent?: string;
  offer_summary?: string;
  claims?: string[];
  cc_contacts?: Array<{ name: string; email: string; title?: string }>;
  email_client?: string;
}

export interface Recommendation {
  caliber: string;
  working_style: string;
  strengths: string[];
  weaknesses: string[];
  communication_style: string;
  diligence_level: string;
  take_the_meeting: boolean;
  next_step: string;
}

export interface FastTake {
  legitimacy: string;
  competence: string;
  polish: string;
  risk: string;
  stance: string;
}

export interface AgencyFit {
  is_agency: boolean;
  ecommerce_fit: number;
  strategic_depth: number;
  execution_confidence: number;
  taste_design_maturity: number;
  best_fit_client?: string;
  portfolio_assessment?: string;
  operator_understanding?: string;
}

export interface SourceLink {
  label: string;
  url: string;
}

export interface Sources {
  sender?: SourceLink[];
  company?: SourceLink[];
  leadership?: SourceLink[];
  reviews?: SourceLink[];
}

export interface DiscoveryQuestion {
  category: string;
  priority: "high" | "medium" | "low";
  timing: "early" | "middle" | "late";
  objective: string;
  question: string;
  strong_answer: string[];
  weak_answer: string[];
}

export interface UsageGuide {
  ask_first: Array<{ index: number; reason: string }>;
  ask_middle: Array<{ index: number; reason: string }>;
  ask_late: Array<{ index: number; reason: string }>;
  lean_in_signals: string[];
  walk_away_signals: string[];
}

export interface DiscoveryQuestions {
  key_risks: string[];
  questions: DiscoveryQuestion[];
  usage_guide: UsageGuide;
}

// Shape of a row pulled from Supabase (camelCase of column name).
export interface AssessmentRow {
  id: string;
  date: string;
  tier: string;
  confidence: Confidence;
  aggregate_score: number;
  sender_score: number;
  leadership_score: number;
  company_score: number;
  company_name: string;
  company_domain: string | null;
  company_website: string | null;
  sender_name: string | null;
  sender_title: string | null;
  sender_email: string | null;
  take_the_meeting: boolean | null;

  company: Company;
  sender: Sender;
  leadership: Leader[];
  leadership_avg: number | null;
  leadership_weighted: number | null;
  leadership_readout: string | null;
  company_sub_scores: CompanySubScores | null;
  company_score_rationale: string | null;
  scores: Scores;
  email_summary: EmailSummary | null;
  recommendation: Recommendation | null;
  fast_take: FastTake | null;
  agency_fit: AgencyFit | null;
  sources: Sources;
  discovery_questions: DiscoveryQuestions | null;

  created_at: string;
  updated_at: string;
}

/** Trimmed row for sidebar / list views (avoids pulling all JSONB). */
export interface AssessmentListItem {
  id: string;
  date: string;
  tier: string;
  confidence: Confidence;
  aggregate_score: number;
  company_name: string;
  company_domain: string | null;
  sender_name: string | null;
  take_the_meeting: boolean | null;
}
