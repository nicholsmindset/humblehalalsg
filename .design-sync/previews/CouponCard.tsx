import { CouponCard } from "humblehalalsg";

type Coupon = Parameters<typeof CouponCard>[0]["coupon"];

const base: Coupon = {
  id: "cpn-1",
  business_id: "biz-1",
  business_name: "Warung Bumbu Rempah",
  business_slug: "warung-bumbu-rempah",
  title: "15% off any nasi padang spread",
  details: "Dine-in only, valid for the whole table on weekdays.",
  discount_type: "percent",
  discount_value: 15,
  reward_text: null,
  min_spend_cents: 1500,
  starts_at: "2026-07-01",
  ends_at: "2026-08-31",
  valid_days: [1, 2, 3, 4, 5],
  redeem_start: null,
  redeem_end: null,
  total_limit: 100,
  claimed_count: 88,
  terms: "One coupon per table. Not valid with other promotions or set menus. Show the code to staff before ordering.",
};

const mk = (o: Partial<Coupon>): Coupon => ({ ...base, ...o });

export const PercentOff = () => (
  <div style={{ maxWidth: 380 }}>
    <CouponCard coupon={mk({})} />
  </div>
);

export const FixedAmount = () => (
  <div style={{ maxWidth: 380 }}>
    <CouponCard
      coupon={mk({
        id: "cpn-2",
        business_name: "Qahwa & Co.",
        business_slug: "qahwa-co",
        title: "$5 off weekend brunch",
        details: "Pour-overs and kunafa cheesecake included.",
        discount_type: "fixed",
        discount_value: 500,
        min_spend_cents: 3000,
        total_limit: 50,
        claimed_count: 41,
      })}
    />
  </div>
);

export const FreeItem = () => (
  <div style={{ maxWidth: 380 }}>
    <CouponCard
      coupon={mk({
        id: "cpn-3",
        business_name: "Tok Tok Mee Pok House",
        business_slug: "tok-tok-mee-pok",
        title: "Free teh tarik with any noodle bowl",
        details: "Redeemable once per visit, all day.",
        discount_type: "free_item",
        discount_value: null,
        reward_text: "Free teh tarik",
        min_spend_cents: 0,
        total_limit: null,
        claimed_count: 0,
        terms: null,
      })}
    />
  </div>
);

export const Compact = () => (
  <div style={{ maxWidth: 340 }}>
    <CouponCard
      compact
      coupon={mk({
        id: "cpn-4",
        business_name: "Rahmah Bakes",
        business_slug: "rahmah-bakes",
        title: "1-for-1 kaya butter croissant",
        details: null,
        discount_type: "bundle",
        discount_value: null,
        reward_text: "1-for-1 croissant",
        min_spend_cents: 0,
        total_limit: 30,
        claimed_count: 18,
        terms: null,
      })}
    />
  </div>
);
