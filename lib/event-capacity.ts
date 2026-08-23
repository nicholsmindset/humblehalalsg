const POSTGRES_INTEGER_MAX = 2_147_483_647;

/** Parse a seat capacity that can be stored in the events integer column. */
export function eventCapacity(value: unknown): number | null {
  const capacity =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : Number.NaN;
  return Number.isInteger(capacity) && capacity >= 0 && capacity <= POSTGRES_INTEGER_MAX
    ? capacity
    : null;
}
