import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

/**
 * Thin compatibility shim. Research actually runs as a Supabase Edge Function
 * (Deno, 150s timeout) so a Claude + web_search call has breathing room. We
 * just forward the request there without waiting for the full response.
 *
 * Why edge runtime here? It streams the response and lets us return as soon
 * as the forward goes out, so Vercel's 60s hobby cap doesn't matter.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_SUPABASE_URL not set" },
      { status: 503 }
    );
  }

  // Fire-and-forget: start the request, don't await its completion.
  // The caller gets an immediate 202 and polls the DB for status updates.
  const ctl = new AbortController();
  fetch(`${supabaseUrl}/functions/v1/research`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: ctl.signal,
  }).catch(() => {
    /* ignore — row-state recovery handles failures */
  });

  return NextResponse.json(
    { forwarded: true, message: "research dispatched to Supabase edge function" },
    { status: 202 }
  );
}
