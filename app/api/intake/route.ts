import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";
import { parseEml, companyToId } from "@/lib/eml";

export const runtime = "nodejs";
// Pending row creation is cheap; kick off research async.
export const maxDuration = 30;

function guessCompanyName(parsed: ReturnType<typeof parseEml>): string {
  // Try signature first — usually has brand prominently displayed
  if (parsed.signature) {
    const lines = parsed.signature
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    // Look for ALL-CAPS line (common in signatures like "*BARREL*" or "PULP+WIRE")
    for (const line of lines) {
      if (/^[A-Z][A-Z+.\s]{2,30}$/.test(line) && line.length >= 3) {
        return line.replace(/\*+/g, "").trim();
      }
    }
  }
  // Fall back to domain stem
  if (parsed.domain) {
    return parsed.domain
      .replace(/\.(com|net|org|io|co|ca|us|ai)$/i, "")
      .replace(/\./g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return "Unknown Vendor";
}

/**
 * POST /api/intake
 * Accepts either:
 *   - multipart/form-data with `file` field (.eml)
 *   - application/json with `{ filename, content }`
 *
 * Creates a stub assessment row with status='pending', parsed email headers,
 * and the raw email body. Fires off /api/research (best-effort).
 */
export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  let raw: string;
  let filename = "intake.eml";

  const ct = req.headers.get("content-type") ?? "";
  try {
    if (ct.startsWith("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "missing 'file' field" }, { status: 400 });
      }
      filename = file.name || filename;
      raw = await file.text();
    } else {
      const body = (await req.json()) as { filename?: string; content?: string };
      if (!body?.content) {
        return NextResponse.json({ error: "missing content" }, { status: 400 });
      }
      raw = body.content;
      filename = body.filename ?? filename;
    }
  } catch (err) {
    return NextResponse.json(
      { error: "failed to read body: " + (err as Error).message },
      { status: 400 }
    );
  }

  if (!raw || raw.length < 50) {
    return NextResponse.json({ error: "empty or too-small email" }, { status: 400 });
  }
  if (raw.length > 1024 * 1024) {
    return NextResponse.json({ error: "email too large (>1MB)" }, { status: 413 });
  }

  const parsed = parseEml(raw);
  const companyName = guessCompanyName(parsed);
  const id = companyToId(companyName, parsed.domain);
  const today = new Date().toISOString().slice(0, 10);

  const sb = getSupabaseServer();

  // Preserve any existing completed row — only insert a pending stub if this id is new.
  const { data: existing } = await sb
    .from("assessments")
    .select("id,status")
    .eq("id", id)
    .maybeSingle();

  if (existing && existing.status === "complete") {
    return NextResponse.json(
      { id, alreadyComplete: true, message: "assessment already exists" },
      { status: 200 }
    );
  }

  const row = {
    id,
    date: today,
    status: "pending" as const,
    company_name: companyName,
    company_domain: parsed.domain,
    company_website: parsed.website_url,
    sender_name: parsed.from_name,
    sender_email: parsed.from_email,
    raw_email: raw,
    email_summary: {
      subject: parsed.subject,
      date_sent: parsed.date,
      email_client: parsed.x_mailer,
      offer_summary: parsed.body_text.slice(0, 500),
      claims: [],
      cc_contacts: [],
    },
    sources: {},
    leadership: [],
  };

  const { error } = await sb
    .from("assessments")
    .upsert(row, { onConflict: "id" });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fire-and-forget research call. Don't await — return immediately so UI can
  // redirect. Research route is idempotent and owns its own lifecycle.
  const origin = new URL(req.url).origin;
  const secret = process.env.VC_API_SECRET;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (secret) headers["Authorization"] = `Bearer ${secret}`;
  fetch(`${origin}/api/research`, {
    method: "POST",
    headers,
    body: JSON.stringify({ id }),
  }).catch((err) => {
    console.error("intake → research fetch failed:", err);
  });

  return NextResponse.json(
    { id, status: "pending", message: "research starting" },
    { status: 202 }
  );
}
