/* Humble Halal — THE status glossary (audit Gap 3).
 *
 * One place where every trust label and its one-line definition is worded.
 * Cards, pills, the trust-at-a-glance panel, the homepage legend, llms.txt
 * and the score tiers all read from here, so a wording change cannot drift
 * between surfaces — the drift between "Self-declared" (pill), "Halal-Friendly"
 * (badge) and llms.txt prose is exactly the bug class this file removes.
 *
 * LEAF MODULE: import nothing from lib/data.ts or lib/halal-score.ts (they
 * import from here). The Deno copy supabase/functions/_shared/halal-score.ts
 * cannot import across runtimes — when editing a label here, sync it there.
 */

export const STATUS_GLOSSARY = {
  // Halal-status tiers (lib/halal-score.ts HalalTier)
  muis: {
    label: "MUIS Certified",
    def: "Holds a valid official MUIS halal certificate, with the certificate number on file.",
  },
  "muis-listed": {
    label: "MUIS-listed",
    def: "On the MUIS HalalSG register per our records — certificate not yet on file; always confirm on the official register.",
  },
  admin: {
    label: "Admin Verified",
    def: "Documents checked by the Humble Halal team (a trust signal, not MUIS certification).",
  },
  community: {
    label: "Community Confirmed",
    def: "Confirmed halal by the community — not officially certified.",
  },
  declared: {
    label: "Self-declared",
    def: "Self-declared by the business — not certified.",
  },
  pending: {
    label: "Pending Verification",
    def: "Verification documents under review.",
  },
  reported: {
    label: "Status changed",
    def: "Halal status recently changed — re-confirm before visiting.",
  },
  // Badge-only axes (ownership / self-declaration / features)
  owned: {
    label: "Muslim-Owned",
    def: "Confirmed Muslim-owned business.",
  },
  friendly: {
    label: "Halal-Friendly",
    def: "Self-declared halal-friendly by the business — explicitly NOT certified.",
  },
  nopork: {
    label: "No Pork No Lard",
    def: "Self-declared by the business — explicitly NOT certified.",
  },
  family: {
    label: "Family Friendly",
    def: "Family-friendly, per the business or community.",
  },
  prayer: {
    label: "Prayer Space",
    def: "Prayer space available on-site or nearby.",
  },
} as const;

export type GlossaryKey = keyof typeof STATUS_GLOSSARY;

export const statusLabel = (k: GlossaryKey): string => STATUS_GLOSSARY[k].label;
export const statusDef = (k: GlossaryKey): string => STATUS_GLOSSARY[k].def;
