const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (value: number) => String(value).padStart(2, "0");

/** Calendar date for the user's current timezone, suitable for a query string. */
export function localDateISO(date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Convert YYYY-MM-DD to Aladhan's DD-MM-YYYY path format after validation. */
export function aladhanDatePath(value: string): string | null {
  const match = ISO_DATE_RE.exec(value);
  if (!match) return null;

  const [, year, month, day] = match;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) return null;

  return `${day}-${month}-${year}`;
}
