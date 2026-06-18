/** Join only the non-empty parts with a separator. Prevents stray separators
    and empty segments ("Name — , Area", "Tampines ·", "across .") when a field
    such as cuisine/distance is missing (audit #5/#10). */
export function joinParts(parts: Array<string | number | null | undefined>, sep = " · "): string {
  return parts
    .map((p) => (p == null ? "" : String(p).trim()))
    .filter(Boolean)
    .join(sep);
}
