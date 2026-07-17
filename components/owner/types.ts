/* Shared row shapes for the owner dashboard + its tab panels. */

export type OwnerBiz = {
  id: string;
  slug: string;
  name: string;
  area: string | null;
  cat_id: string | null;
  plan: string;
  featured: boolean;
  halal_tier: string | null;
  last_verified_at: string | null;
  /* Profile-strength inputs (all optional — selected by the dashboard only). */
  photos?: { url: string }[] | null;
  description?: string | null;
  opening_hours?: unknown[] | null;
  website?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  socials?: Record<string, string> | null;
};

export type OwnerEvent = {
  id: string;
  slug: string;
  title: string;
  status: string;
  taken: number;
  capacity: number;
  is_free: boolean;
  date_iso: string | null;
  display: { cat?: string; area?: string; priceFrom?: number; requiresApproval?: boolean } | null;
};
