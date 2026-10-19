const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isValidHotelStay(checkin: string, checkout: string): boolean {
  return isValidIsoDate(checkin) && isValidIsoDate(checkout) && checkout > checkin;
}

export function validHotelStayOrFallback(
  checkin: unknown,
  checkout: unknown,
  fallback: { checkin: string; checkout: string },
): { checkin: string; checkout: string } {
  return typeof checkin === "string" &&
    typeof checkout === "string" &&
    isValidHotelStay(checkin, checkout)
    ? { checkin, checkout }
    : fallback;
}
