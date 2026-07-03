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
