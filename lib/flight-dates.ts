const DAY_MS = 86_400_000;

function isIsoDate(value: string | null | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function addDays(value: string, days: number): string {
  return new Date(Date.parse(`${value}T00:00:00.000Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

export function singaporeDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function normalizeFlightDates(
  outbound: string | null,
  inbound: string | null,
  tripType: "round" | "one",
  today = singaporeDate(),
): { date: string; returnDate: string | null } {
  const date = isIsoDate(outbound) && outbound >= today ? outbound : addDays(today, 21);

  if (tripType === "one") return { date, returnDate: null };

  const returnDate = isIsoDate(inbound) && inbound >= date ? inbound : addDays(date, 7);
  return { date, returnDate };
}
