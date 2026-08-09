#!/usr/bin/env node
/* Read-only launch audit for businesses labelled `halal_tier = muis`.
 *
 * Input is a JSON array supplied through stdin or MUIS_AUDIT_INPUT_B64. Each
 * row may contain id, slug, name, address and postal. The script queries the
 * public MUIS HalalSG establishment search and writes an evidence report. It
 * never writes to Supabase.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const SEARCH_PAGE = "https://halal.muis.gov.sg/halal/establishments";
const SEARCH_API = "https://halal.muis.gov.sg/api/halal/establishments";

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const match = arg.match(/^--([^=]+)(?:=(.*))?$/);
  return match ? [match[1], match[2] ?? true] : [arg, true];
}));

function normalise(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(?:pte|ltd|limited|llp|singapore|sg)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function searchTerm(name) {
  return String(name || "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[–—-].*$/, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 5)
    .join(" ");
}

function cookieHeader(response) {
  const raw = response.headers.get("set-cookie") || "";
  return raw
    .split(/,(?=[^;,]+=)/)
    .map((part) => part.split(";")[0].trim())
    .filter(Boolean)
    .join("; ");
}

async function session() {
  const response = await fetch(SEARCH_PAGE, { headers: { "user-agent": "HumbleHalal launch audit/1.0" } });
  if (!response.ok) throw new Error(`MUIS search page returned ${response.status}`);
  const html = await response.text();
  const token = html.match(/name="__RequestVerificationToken"[^>]*value="([^"]+)"/)?.[1];
  if (!token) throw new Error("MUIS CSRF token was not present");
  return { token, cookie: cookieHeader(response) };
}

async function lookup(row, auth) {
  const term = searchTerm(row.name);
  if (term.length < 3) return { term, results: [], error: "search term too short" };
  const response = await fetch(SEARCH_API, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-csrf-token": auth.token,
      cookie: auth.cookie,
      "user-agent": "HumbleHalal launch audit/1.0",
    },
    body: JSON.stringify({ text: term }),
  });
  if (!response.ok) return { term, results: [], error: `HTTP ${response.status}` };
  const body = await response.json();
  return { term, results: Array.isArray(body?.data) ? body.data : [] };
}

function classify(row, lookupResult) {
  const wanted = normalise(row.name);
  const postal = String(row.postal || "").replace(/\D/g, "");
  const candidates = lookupResult.results.map((result) => {
    const resultName = normalise(result.name || result.establishment || result.businessName);
    const resultPostal = String(result.postal || "").replace(/\D/g, "");
    const nameMatch = wanted && resultName && (wanted.includes(resultName) || resultName.includes(wanted));
    const postalMatch = postal.length === 6 && resultPostal === postal;
    return { ...result, _match: { name: !!nameMatch, postal: postalMatch } };
  });
  // MUIS certification is premises-specific. A name-only chain match is useful
  // evidence for manual review, but it is never enough to verify this listing.
  const strong = candidates.filter((candidate) => postal.length === 6 && candidate._match.name && candidate._match.postal);
  const possible = candidates.filter((candidate) => candidate._match.name || candidate._match.postal);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    address: row.address || null,
    postal: row.postal || null,
    search_term: lookupResult.term,
    checked_at: new Date().toISOString(),
    source_url: SEARCH_PAGE,
    verdict: strong.length ? "register-match" : possible.length ? "manual-review" : "no-register-match",
    matches: strong.length ? strong : possible,
    result_count: candidates.length,
    error: lookupResult.error || null,
  };
}

async function main() {
  const encoded = process.env.MUIS_AUDIT_INPUT_B64;
  const raw = encoded ? Buffer.from(encoded, "base64").toString("utf8") : readFileSync(0, "utf8");
  const rows = JSON.parse(raw);
  if (!Array.isArray(rows)) throw new Error("Expected a JSON array of business rows");

  const auth = await session();
  const audited = [];
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const result = await lookup(row, auth);
    audited.push(classify(row, result));
    process.stderr.write(`\rMUIS checked ${index + 1}/${rows.length}`);
    await new Promise((resolve) => setTimeout(resolve, Number(args.delay || 150)));
  }
  process.stderr.write("\n");

  const counts = audited.reduce((out, row) => {
    out[row.verdict] = (out[row.verdict] || 0) + 1;
    return out;
  }, {});
  const report = { generated_at: new Date().toISOString(), source: SEARCH_PAGE, total: audited.length, counts, businesses: audited };
  const output = JSON.stringify(report, null, 2);
  if (typeof args.output === "string") {
    mkdirSync(dirname(args.output), { recursive: true });
    writeFileSync(args.output, `${output}\n`);
  }
  else process.stdout.write(`${output}\n`);
  process.stderr.write(`${JSON.stringify(counts)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
