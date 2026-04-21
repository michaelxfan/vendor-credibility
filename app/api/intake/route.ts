import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";
import { parseEml, companyToId } from "@/lib/eml";

export const runtime = "nodejs";
// Pending row creation is cheap; kick off research async.
export const maxDuration = 30;

function humanizeDomain(domain: string): string {
  return domain
    .replace(/^www\./, "")
    .replace(/\.(com|net|org|io|co|ca|us|ai|agency|studio|design)$/i, "")
    .split(".")
    .map((seg) =>
      seg
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    )
    .join(" ");
}

/**
 * Try to infer the company name from an email.
 * Order: sender domain > signature ALL-CAPS brand line > fallback.
 *
 * Previously we preferred the ALL-CAPS line, but agency taglines like
 * "OUTSMART. OUTPLAY. OUTPERFORM." can shadow the real company name. Domain
 * is usually the safer first guess (e.g. gofishdigital.com → "Go Fish Digital").
 */
function guessCompanyName(parsed: ReturnType<typeof parseEml>): string {
  // Prefer domain — it's the most reliable signal.
  if (parsed.domain) {
    return humanizeDomain(parsed.domain);
  }
  // Fall back to signature brand line only if domain is unknown.
  if (parsed.signature) {
    const lines = parsed.signature
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    for (const line of lines) {
      const cleaned = line.replace(/\*+/g, "").trim();
      // Skip if it looks like a tagline (multiple periods/dots, multiple words)
      const wordCount = cleaned.split(/\s+/).length;
      const dotCount = (cleaned.match(/\./g) ?? []).length;
      if (dotCount >= 2 && wordCount >= 2) continue;
      // Single-brand ALL-CAPS line
      if (/^[A-Z][A-Z+]{1,30}$/.test(cleaned) && cleaned.length >= 3) {
        return cleaned;
      }
    }
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
      // Full decoded plaintext (scrubbed of prompt-injection canaries and
      // base64 blobs) — this is what the Edge Function hands to Claude.
      // Much cleaner than the raw 600KB+ MIME-encoded EML.
      body_text: parsed.body_text.slice(0, 40000),
      signature: parsed.signature,
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

  // The client (StatusBanner) fires POST /api/research after redirecting to
  // the new row — a server-side fire-and-forget fetch is unreliable on Vercel
  // serverless because the outbound request can be killed when /api/intake's
  // response is sent. Keeping the trigger client-side means it's driven by
  // the user's tab, which is more robust.
  return NextResponse.json(
    { id, status: "pending", message: "stub created; client will trigger research" },
    { status: 202 }
  );
}
