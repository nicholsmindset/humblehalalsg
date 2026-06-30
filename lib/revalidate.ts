import { revalidatePath } from "next/cache";

/* Refresh the public surfaces that render directory / event content so that an
   approval, add, edit or verification shows up immediately instead of waiting
   for the static (ISR) cache to expire. Call from any route handler after a
   content mutation. Best-effort — never throws into the caller. */
const PUBLIC_PATHS = ["/", "/explore", "/map", "/events", "/travel", "/halal", "/mosques"];

export function revalidatePublic(extra?: string[]): void {
  for (const p of [...PUBLIC_PATHS, ...(extra || [])]) {
    try {
      revalidatePath(p);
    } catch {
      /* best-effort */
    }
  }
}
