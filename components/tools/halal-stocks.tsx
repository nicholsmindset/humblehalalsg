"use client";

/* Halal stock screener (AAOIFI-style). Manual input — the user enters the
   figures from a company's financials; nothing is fetched or stored. Educational
   / informational only, NOT investment advice; thresholds vary by standard and
   scholar. Two screens: business activity, then financial ratios. */
import { useMemo, useState } from "react";
import { Icon } from "@/components/ui";

const PROHIBITED = [
  "Alcohol",
  "Pork / non-halal food",
  "Conventional finance / interest (riba)",
  "Gambling",
  "Tobacco",
  "Adult entertainment",
  "Weapons / defence (debated)",
];

// Common AAOIFI-style thresholds (vary by standard/index).
const DEBT_MAX = 30; // interest-bearing debt / market cap
const SECURITIES_MAX = 30; // (cash + interest-bearing securities) / market cap
const IMPURE_MAX = 5; // non-compliant income / total revenue

export function HalalStocks() {
  const [sectors, setSectors] = useState<Record<string, boolean>>({});
  const [marketCap, setMarketCap] = useState("");
  const [debt, setDebt] = useState("");
  const [securities, setSecurities] = useState("");
  const [impure, setImpure] = useState("");

  const num = (v: string) => Math.max(0, Number(v) || 0);
  const toggle = (s: string) => setSectors((p) => ({ ...p, [s]: !p[s] }));

  const result = useMemo(() => {
    const mc = num(marketCap);
    const businessFail = Object.values(sectors).some(Boolean);
    const debtRatio = mc > 0 ? (num(debt) / mc) * 100 : 0;
    const secRatio = mc > 0 ? (num(securities) / mc) * 100 : 0;
    const impureRatio = num(impure);
    const checks = [
      { label: "Core business is permissible", pass: !businessFail, detail: businessFail ? "Non-compliant sector selected" : "No prohibited sector selected" },
      { label: `Debt / market cap < ${DEBT_MAX}%`, pass: mc > 0 && debtRatio < DEBT_MAX, detail: mc > 0 ? `${debtRatio.toFixed(1)}%` : "Enter market cap" },
      { label: `Cash & interest securities / market cap < ${SECURITIES_MAX}%`, pass: mc > 0 && secRatio < SECURITIES_MAX, detail: mc > 0 ? `${secRatio.toFixed(1)}%` : "Enter market cap" },
      { label: `Non-compliant income < ${IMPURE_MAX}%`, pass: impureRatio < IMPURE_MAX, detail: `${impureRatio.toFixed(1)}%` },
    ];
    const compliant = mc > 0 && checks.every((c) => c.pass);
    return { checks, compliant, impureRatio, hasInput: mc > 0 };
  }, [sectors, marketCap, debt, securities, impure]);

  return (
    <div className="stocks">
      <div className="stocks-section">
        <h3 className="stocks-h">1. Business activity</h3>
        <p className="faint" style={{ fontSize: ".88rem" }}>Tick any that describe a material part of the company&apos;s business.</p>
        <div className="stocks-sectors">
          {PROHIBITED.map((s) => (
            <button key={s} className={`chip ${sectors[s] ? "active" : ""}`} aria-pressed={!!sectors[s]} onClick={() => toggle(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="stocks-section">
        <h3 className="stocks-h">2. Financial ratios</h3>
        <p className="faint" style={{ fontSize: ".88rem" }}>Enter figures in the same currency/unit (e.g. all in millions).</p>
        <div className="stocks-inputs">
          <div className="field"><label htmlFor="st-mc">Market capitalisation</label><input id="st-mc" className="input" type="number" min={0} inputMode="decimal" value={marketCap} onChange={(e) => setMarketCap(e.target.value)} placeholder="0" /></div>
          <div className="field"><label htmlFor="st-debt">Interest-bearing debt</label><input id="st-debt" className="input" type="number" min={0} inputMode="decimal" value={debt} onChange={(e) => setDebt(e.target.value)} placeholder="0" /></div>
          <div className="field"><label htmlFor="st-sec">Cash + interest-bearing securities</label><input id="st-sec" className="input" type="number" min={0} inputMode="decimal" value={securities} onChange={(e) => setSecurities(e.target.value)} placeholder="0" /></div>
          <div className="field"><label htmlFor="st-imp">Non-compliant income (% of revenue)</label><input id="st-imp" className="input" type="number" min={0} max={100} inputMode="decimal" value={impure} onChange={(e) => setImpure(e.target.value)} placeholder="0" /></div>
        </div>
      </div>

      <div className="stocks-result card" aria-live="polite">
        {result.hasInput ? (
          <>
            <div className={`stocks-verdict ${result.compliant ? "pass" : "fail"}`}>
              <Icon name={result.compliant ? "shield-check" : "warning"} size={20} />
              {result.compliant ? "Passes these screens" : "Does not pass these screens"}
            </div>
            <ul className="stocks-checks">
              {result.checks.map((c) => (
                <li key={c.label} className={c.pass ? "ok" : "no"}>
                  <Icon name={c.pass ? "check" : "x"} size={15} />
                  <span>{c.label}</span>
                  <span className="faint">{c.detail}</span>
                </li>
              ))}
            </ul>
            {result.compliant && result.impureRatio > 0 && (
              <p className="faint" style={{ fontSize: ".84rem" }}>
                Purify roughly {result.impureRatio.toFixed(1)}% of any dividends by giving it to charity.
              </p>
            )}
          </>
        ) : (
          <p className="muted">Enter the market cap to see the screen result.</p>
        )}
      </div>

      <p className="faint" style={{ fontSize: ".82rem", marginTop: 4 }}>
        Beta · informational only, not investment advice. Screening standards and thresholds differ between
        scholars and indices (e.g. AAOIFI, Dow Jones Islamic, S&P Shariah). Confirm a stock&apos;s status with a
        certified Islamic finance authority. Nothing here is stored or sent anywhere.
      </p>
    </div>
  );
}
