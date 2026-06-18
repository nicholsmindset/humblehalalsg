"use client";

/* Zakat calculator — 2.5% on zakatable wealth held above the nisab for a lunar
   year. Computes entirely on the client; nothing is sent or stored. Metal prices
   change daily, so nisab uses an editable price-per-gram (with a starting
   placeholder) — users should confirm today's price. Educational starting point,
   not a fatwa; complex cases should be checked with a knowledgeable person. */
import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui";

// Commonly-cited classical nisab weights. Exact values vary by scholar.
const GOLD_NISAB_G = 87.48;
const SILVER_NISAB_G = 612.36;

const CURRENCIES = ["SGD", "USD", "GBP", "MYR", "EUR", "AED"] as const;
type Currency = (typeof CURRENCIES)[number];

// Rough starting placeholders only (per gram) — prompt the user to verify.
const DEFAULT_PRICE: Record<Currency, { gold: number; silver: number }> = {
  SGD: { gold: 112, silver: 1.3 },
  USD: { gold: 85, silver: 1.0 },
  GBP: { gold: 66, silver: 0.78 },
  MYR: { gold: 395, silver: 4.6 },
  EUR: { gold: 78, silver: 0.92 },
  AED: { gold: 312, silver: 3.6 },
};

const num = (v: string | undefined) => Math.max(0, Number(v) || 0);

const ASSET_FIELDS: { key: string; label: string; hint?: string }[] = [
  { key: "cash", label: "Cash, bank & savings" },
  { key: "metals", label: "Gold & silver you own", hint: "Market value of jewellery / bullion" },
  { key: "investments", label: "Shares & investments", hint: "Zakatable portion / market value" },
  { key: "receivables", label: "Money owed to you", hint: "Loans you expect to be repaid" },
  { key: "business", label: "Business stock & assets", hint: "Resale inventory, cash in the business" },
];

export function ZakatTool() {
  const [currency, setCurrency] = useState<Currency>("SGD");
  const [basis, setBasis] = useState<"gold" | "silver">("silver");
  const [price, setPrice] = useState<number>(DEFAULT_PRICE.SGD.silver);
  const [assets, setAssets] = useState<Record<string, string>>({});
  const [liabilities, setLiabilities] = useState<string>("");

  const onCurrency = (c: Currency) => {
    setCurrency(c);
    setPrice(DEFAULT_PRICE[c][basis]);
  };
  const onBasis = (b: "gold" | "silver") => {
    setBasis(b);
    setPrice(DEFAULT_PRICE[currency][b]);
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 2 }).format(n);

  const { totalAssets, totalLiab, zakatable, nisab, aboveNisab, zakatDue } = useMemo(() => {
    const totalAssets = ASSET_FIELDS.reduce((s, f) => s + num(assets[f.key]), 0);
    const totalLiab = num(liabilities);
    const zakatable = Math.max(0, totalAssets - totalLiab);
    const grams = basis === "gold" ? GOLD_NISAB_G : SILVER_NISAB_G;
    const nisab = grams * Math.max(0, price || 0);
    const aboveNisab = zakatable >= nisab && nisab > 0;
    const zakatDue = aboveNisab ? zakatable * 0.025 : 0;
    return { totalAssets, totalLiab, zakatable, nisab, aboveNisab, zakatDue };
  }, [assets, liabilities, basis, price]);

  return (
    <div className="zakat">
      <div className="zakat-controls">
        <div className="field">
          <label htmlFor="z-cur">Currency</label>
          <select id="z-cur" className="select" value={currency} onChange={(e) => onCurrency(e.target.value as Currency)}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="field f1">
          <label>Nisab basis</label>
          <div className="pillbar" role="group" aria-label="Nisab basis">
            <button className={`chip ${basis === "silver" ? "active" : ""}`} aria-pressed={basis === "silver"} onClick={() => onBasis("silver")}>
              Silver ({SILVER_NISAB_G} g)
            </button>
            <button className={`chip ${basis === "gold" ? "active" : ""}`} aria-pressed={basis === "gold"} onClick={() => onBasis("gold")}>
              Gold ({GOLD_NISAB_G} g)
            </button>
          </div>
        </div>
        <div className="field">
          <label htmlFor="z-price">{basis === "gold" ? "Gold" : "Silver"} price / gram ({currency})</label>
          <input id="z-price" className="input" type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))} />
          <span className="hint">Verify today&apos;s rate — prices change daily.</span>
        </div>
      </div>

      <div className="zakat-grid">
        <div className="zakat-col">
          <h3 className="zakat-col-h">Zakatable assets</h3>
          {ASSET_FIELDS.map((f) => (
            <div className="field" key={f.key}>
              <label htmlFor={`z-${f.key}`}>{f.label}</label>
              <input
                id={`z-${f.key}`}
                className="input"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                value={assets[f.key] ?? ""}
                onChange={(e) => setAssets((a) => ({ ...a, [f.key]: e.target.value }))}
              />
              {f.hint && <span className="hint">{f.hint}</span>}
            </div>
          ))}
          <div className="field">
            <label htmlFor="z-liab">Debts due now</label>
            <input
              id="z-liab"
              className="input"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              value={liabilities}
              onChange={(e) => setLiabilities(e.target.value)}
            />
            <span className="hint">Immediate liabilities — subtracted from your assets.</span>
          </div>
        </div>

        <div className="zakat-col">
          <div className="zakat-result card" aria-live="polite">
            <div className="zakat-row"><span className="faint">Total assets</span><span>{fmt(totalAssets)}</span></div>
            <div className="zakat-row"><span className="faint">Less debts</span><span>− {fmt(totalLiab)}</span></div>
            <hr className="divider" />
            <div className="zakat-row"><span>Net zakatable wealth</span><strong>{fmt(zakatable)}</strong></div>
            <div className="zakat-row"><span className="faint">Nisab ({basis})</span><span>{fmt(nisab)}</span></div>
            <div className={`zakat-status ${aboveNisab ? "due" : "below"}`}>
              {aboveNisab ? (
                <><Icon name="check" size={16} /> Above nisab — zakat is due</>
              ) : (
                <><Icon name="info" size={16} /> Below nisab — no zakat due on these figures</>
              )}
            </div>
            <div className="zakat-due">
              <span className="faint">Zakat due (2.5%)</span>
              <strong className="zakat-amount">{fmt(zakatDue)}</strong>
            </div>
            {aboveNisab && (
              <Link href="/mosques" className="btn btn-primary btn-block mt12">
                <Icon name="mosque" size={17} /> Find a mosque to give through
              </Link>
            )}
            <p className="faint" style={{ fontSize: ".8rem", marginTop: 10 }}>
              Verified one-tap giving to mosques &amp; charities is coming to Humble Halal.
            </p>
          </div>
        </div>
      </div>

      <p className="faint" style={{ fontSize: ".82rem", marginTop: 4 }}>
        A starting estimate only. Zakat is due on wealth held above the nisab for a full lunar year (hawl).
        Rules for business assets, debts, pensions and shares can be detailed — confirm your situation with a
        knowledgeable person or your local zakat authority. Nothing here is stored or sent anywhere.
      </p>
    </div>
  );
}
