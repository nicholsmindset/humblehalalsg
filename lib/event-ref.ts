/* Safe event reference guard.

   Several routes resolve an event by id-or-slug with a PostgREST `.or()` filter:
     .or(`id.eq.${ref},slug.eq.${ref}`)
   PostgREST splits `.or()` on commas at parse time, so an attacker-supplied ref
   containing a comma/dot/paren can inject extra OR conditions (e.g. `x,id.gte.0`
   to match every row). Every legitimate ref is a mock id (`e1`), a UUID, or a
   slug (`[a-z0-9-]`) — none contain PostgREST metacharacters. Reject anything
   else BEFORE interpolation. */
export function isSafeEventRef(ref: string): boolean {
  return /^[A-Za-z0-9_-]{1,64}$/.test(ref);
}
