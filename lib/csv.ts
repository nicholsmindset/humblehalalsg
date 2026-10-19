/** Minimal RFC-4180 CSV parser: quoted fields, escaped quotes (""), newlines
 *  inside quotes, and both \n and \r\n row endings. Blank rows are dropped.
 *  Small by design — the admin import needs nothing more, and a dependency
 *  would be overkill for one endpoint. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else inQuotes = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"') { inQuotes = true; continue; }
    if (ch === ",") { row.push(cell); cell = ""; continue; }
    if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
      continue;
    }
    cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

const FORMULA_PREFIX = /^[\t\r ]*[=+\-@]/;

/** Encode a value as a CSV cell and neutralize spreadsheet formulas. */
export function csvCell(value: unknown): string {
  const raw = value == null ? "" : String(value);
  const safe = FORMULA_PREFIX.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}
