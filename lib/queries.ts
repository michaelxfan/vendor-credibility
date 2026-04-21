import "server-only";
import { getSupabaseServerOrNull } from "./supabase/server";
import type { AssessmentListItem, AssessmentRow } from "./types";

const LIST_COLUMNS =
  "id,date,status,tier,confidence,aggregate_score,company_name,company_domain,sender_name,take_the_meeting,last_meeting_at,next_meeting_at";

/** Fetch all assessments, sorted by aggregate score (desc). For sidebar. */
export async function fetchAssessmentList(): Promise<AssessmentListItem[]> {
  const sb = getSupabaseServerOrNull();
  if (!sb) return [];
  const { data, error } = await sb
    .from("assessments")
    .select(LIST_COLUMNS)
    .order("aggregate_score", { ascending: false });
  if (error) {
    console.error("fetchAssessmentList error:", error);
    return [];
  }
  return (data ?? []) as unknown as AssessmentListItem[];
}

/** Fetch a single assessment by id with full JSONB payload. */
export async function fetchAssessment(id: string): Promise<AssessmentRow | null> {
  const sb = getSupabaseServerOrNull();
  if (!sb) return null;
  const { data, error } = await sb
    .from("assessments")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("fetchAssessment error:", error);
    return null;
  }
  return (data ?? null) as AssessmentRow | null;
}
