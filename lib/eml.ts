// Minimal EML parser — extracts headers, plaintext body, and a signature block guess.
// Not a full RFC 5322 implementation; good enough for agency outreach emails.

export interface ParsedEml {
  from_name: string | null;
  from_email: string | null;
  to: string | null;
  cc: string | null;
  subject: string | null;
  date: string | null;
  x_mailer: string | null;
  message_id: string | null;
  body_text: string; // plaintext body (or best-effort from html)
  signature: string | null; // guess at signature block
  website_url: string | null; // first URL that looks like a homepage
  domain: string | null; // domain from sender email or website
  raw_size: number;
}

function unfoldHeaders(raw: string): string {
  // RFC 5322 header unfolding: CRLF followed by whitespace continues the previous line.
  return raw.replace(/\r?\n[ \t]/g, " ");
}

function decodeMimeHeader(v: string): string {
  // Decode `=?utf-8?Q?...?=` and `=?utf-8?B?...?=` encoded words.
  return v.replace(/=\?([^?]+)\?([QqBb])\?([^?]+)\?=/g, (_, charset, enc, text) => {
    try {
      if (enc.toLowerCase() === "b") {
        return Buffer.from(text, "base64").toString(
          charset.toLowerCase().includes("utf") ? "utf8" : "latin1"
        );
      }
      // Q encoding
      const decoded = text
        .replace(/_/g, " ")
        .replace(/=([0-9A-F]{2})/g, (_m: string, hex: string) =>
          String.fromCharCode(parseInt(hex, 16))
        );
      return Buffer.from(decoded, "binary").toString(
        charset.toLowerCase().includes("utf") ? "utf8" : "latin1"
      );
    } catch {
      return text;
    }
  });
}

function parseHeaders(raw: string): Map<string, string> {
  const unfolded = unfoldHeaders(raw);
  const map = new Map<string, string>();
  for (const line of unfolded.split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).toLowerCase().trim();
    const val = line.slice(idx + 1).trim();
    if (!map.has(key)) map.set(key, decodeMimeHeader(val));
  }
  return map;
}

function parseFromHeader(from: string): { name: string | null; email: string | null } {
  // Formats: "Name <email>", "email", or "<email>"
  const m = from.match(/^\s*(?:"?([^"<]*?)"?\s*)?<?([^<>\s]+@[^<>\s]+)>?\s*$/);
  if (m) {
    const name = (m[1] ?? "").trim().replace(/^"|"$/g, "");
    return { name: name || null, email: m[2] };
  }
  return { name: null, email: null };
}

function decodeQuotedPrintable(s: string): string {
  return s
    .replace(/=\r?\n/g, "") // soft line breaks
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

function extractBody(raw: string, contentType: string | undefined): string {
  const headerEnd = raw.indexOf("\r\n\r\n") >= 0 ? raw.indexOf("\r\n\r\n") + 4 : raw.indexOf("\n\n") + 2;
  const rawBody = raw.slice(headerEnd);

  if (!contentType || !contentType.includes("multipart/")) {
    // Single-part body: may be quoted-printable
    const isQP = /quoted-printable/i.test(raw.slice(0, headerEnd));
    return isQP ? decodeQuotedPrintable(rawBody) : rawBody;
  }

  const boundaryMatch = contentType.match(/boundary="?([^";\s]+)"?/i);
  if (!boundaryMatch) return rawBody;
  const boundary = boundaryMatch[1];
  const parts = rawBody.split(new RegExp(`--${boundary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));

  let plain = "";
  let html = "";
  for (const part of parts) {
    const sepIdx = part.indexOf("\r\n\r\n") >= 0 ? part.indexOf("\r\n\r\n") + 4 : part.indexOf("\n\n") + 2;
    if (sepIdx <= 2) continue;
    const partHeaders = part.slice(0, sepIdx);
    let partBody = part.slice(sepIdx);
    const partCT = /content-type:\s*([^\r\n;]+)/i.exec(partHeaders)?.[1] ?? "";
    const partCTE = /content-transfer-encoding:\s*([^\r\n;]+)/i.exec(partHeaders)?.[1] ?? "";

    if (/quoted-printable/i.test(partCTE)) {
      partBody = decodeQuotedPrintable(partBody);
    } else if (/base64/i.test(partCTE)) {
      try {
        partBody = Buffer.from(partBody.replace(/\s+/g, ""), "base64").toString("utf8");
      } catch {}
    }

    if (/text\/plain/i.test(partCT) && !plain) plain = partBody;
    else if (/text\/html/i.test(partCT) && !html) html = partBody;

    // Recurse into nested multiparts
    if (/multipart\//i.test(partCT)) {
      const nested = extractBody(part, partCT + (partHeaders.match(/boundary="?([^";\s]+)"?/i)?.[0] ?? ""));
      if (!plain && nested) plain = nested;
    }
  }
  return plain || stripHtml(html) || rawBody;
}

/**
 * Remove noisy tokens that trip prompt-injection safety filters without
 * adding any useful signal: email client canaries like `[fn18...]`, long
 * unbroken base64 strings, Sophos/Outlook tracking URLs, and HTML
 * protection wrappers.
 */
function scrubInjectionNoise(body: string): string {
  let out = body;
  // [fnNN...] canaries (e.g. [fn18e3p5...] — Microsoft Office test pattern)
  out = out.replace(/\[fn\d+[A-Za-z0-9+/=]{20,}\]/g, "[canary-stripped]");
  // Sophos safelink wrappers — replace with a terse placeholder
  out = out.replace(
    /https?:\/\/[a-z0-9.-]*protection\.sophos\.com\/\?[^\s>\]]+/gi,
    "[sophos-safelink]"
  );
  // Very long unbroken base64-ish blobs (≥80 chars of base64 alphabet)
  out = out.replace(/[A-Za-z0-9+/]{80,}={0,2}/g, "[base64-blob]");
  // Collapse repeated placeholders
  out = out.replace(/(\[(canary-stripped|sophos-safelink|base64-blob)\][\s,]*){3,}/g, "[...stripped...]");
  return out;
}

function extractSignature(body: string): string | null {
  // Try to cut at the quoted-reply section (lines starting with > or "On ... wrote:")
  const cutMarkers = [
    /\n>\s/,
    /\nOn\s[A-Z][a-z]+,?\s.+\swrote:/,
    /\n\s*[\u2014\u2013-]{2,}\s*Original Message\s*[\u2014\u2013-]{2,}/i,
    /\n\s*From:\s/i,
  ];
  let clean = body;
  for (const rx of cutMarkers) {
    const m = rx.exec(clean);
    if (m) clean = clean.slice(0, m.index);
  }

  // Signature often starts with "--" line or a capitalized name block near the end
  const sigRegex = /\n\s*--\s*\n([\s\S]+)$/;
  const m = sigRegex.exec(clean);
  if (m) return m[1].trim().slice(0, 2000);

  // Fallback: last 8 lines
  const lines = clean.trim().split(/\r?\n/).slice(-10).join("\n").trim();
  return lines.length > 10 ? lines : null;
}

function extractWebsite(body: string, signature: string | null): string | null {
  const hay = (signature ?? body).slice(0, 5000);
  // Look for a bare URL
  const rx = /https?:\/\/[\w.-]+(?:\/[\w./?&=%#~-]*)?/gi;
  const matches = hay.match(rx) ?? [];
  // Filter out tracking/safelinks, superhuman, gmail sig trackers
  const skip = /safelinks|superhuman\.com\/refer|ci3\.googleusercontent|tracking|unsubscribe|\.gif|\.png|\.jpg/i;
  for (const u of matches) {
    if (skip.test(u)) continue;
    return u;
  }
  return null;
}

function domainFromEmail(email: string | null): string | null {
  if (!email) return null;
  const at = email.lastIndexOf("@");
  if (at < 0) return null;
  return email.slice(at + 1).toLowerCase();
}

function domainFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export function parseEml(raw: string): ParsedEml {
  // Split headers from body
  const sep = raw.search(/\r?\n\r?\n/);
  const headerBlock = sep > 0 ? raw.slice(0, sep) : raw;
  const headers = parseHeaders(headerBlock);

  const fromRaw = headers.get("from") ?? "";
  const { name: from_name, email: from_email } = parseFromHeader(fromRaw);

  const contentType = headers.get("content-type");
  const rawBodyText = extractBody(raw, contentType);
  const body_text = scrubInjectionNoise(rawBodyText);
  const signature = extractSignature(body_text);
  const website_url = extractWebsite(body_text, signature);

  const senderDomain = domainFromEmail(from_email);
  const websiteDomain = domainFromUrl(website_url);

  return {
    from_name,
    from_email,
    to: headers.get("to") ?? null,
    cc: headers.get("cc") ?? null,
    subject: headers.get("subject") ?? null,
    date: headers.get("date") ?? null,
    x_mailer: headers.get("x-mailer") ?? null,
    message_id: headers.get("message-id") ?? null,
    body_text: body_text.trim(),
    signature,
    website_url,
    domain: websiteDomain ?? senderDomain,
    raw_size: raw.length,
  };
}

/** Turn a company name into a kebab-case id, stable enough for upsert. */
export function companyToId(name: string, domain: string | null): string {
  // Prefer domain-based id (e.g. "barrel" from "barrelny.com" is hard; use full domain stem)
  if (domain) {
    const stem = domain.replace(/\.(com|net|org|io|co|ca|us|ai)$/i, "").replace(/\./g, "-");
    return stem.toLowerCase();
  }
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}
