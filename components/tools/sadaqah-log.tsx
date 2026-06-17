"use client";

/* Sadaqah log — record your charity, track a running total and an optional goal.
   Local-first; entries stay on this device only. */
import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui";
import { useLocalState } from "./use-local-state";

const CURRENCIES = ["SGD", "USD", "GBP", "MYR", "EUR", "AED"];

interface Entry { id: number; amount: number; note: string; date: string }
interface SadaqahState { currency: string; goal: number; entries: Entry[] }

export function SadaqahLog() {
  const { value, setValue, ready } = useLocalState<SadaqahState>("hh_sadaqah_v1", {
    currency: "SGD",
    goal: 0,
    entries: [],
  });
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const total = value.entries.reduce((s, e) => s + e.amount, 0);
  const fmt = (n: number) =>
    new Intl.NumberFormat("en", { style: "currency", currency: value.currency, maximumFractionDigits: 2 }).format(n);
  const goalPct = value.goal > 0 ? Math.min(100, Math.round((total / value.goal) * 100)) : 0;

  const add = () => {
    const a = Number(amount);
    if (!Number.isFinite(a) || a <= 0) return;
    const entry: Entry = {
      id: Date.now(),
      amount: a,
      note: note.trim(),
      date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    };
    setValue((prev) => ({ ...prev, entries: [entry, ...prev.entries] }));
    setAmount("");
    setNote("");
  };

  const remove = (id: number) =>
    setValue((prev) => ({ ...prev, entries: prev.entries.filter((e) => e.id !== id) }));

  return (
    <div className="tracker sadaqah-log">
      <div className="sadaqah-summary card">
        <div className="sadaqah-total">
          <span className="faint">Total given</span>
          <strong>{ready ? fmt(total) : fmt(0)}</strong>
        </div>
        <div className="sadaqah-goal-controls">
          <div className="field">
            <label htmlFor="sd-cur">Currency</label>
            <select
              id="sd-cur"
              className="select"
              value={value.currency}
              onChange={(e) => setValue((p) => ({ ...p, currency: e.target.value }))}
            >
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="field f1">
            <label htmlFor="sd-goal">Goal (optional)</label>
            <input
              id="sd-goal"
              className="input"
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              value={value.goal || ""}
              onChange={(e) => setValue((p) => ({ ...p, goal: Math.max(0, Number(e.target.value) || 0) }))}
            />
          </div>
        </div>
        {value.goal > 0 && (
          <>
            <div className="tracker-bar" aria-hidden="true">
              <span className="tracker-bar-fill" style={{ width: `${goalPct}%` }} />
            </div>
            <span className="faint" style={{ fontSize: ".84rem" }}>{goalPct}% of {fmt(value.goal)}</span>
          </>
        )}
      </div>

      <div className="sadaqah-add">
        <div className="field f1">
          <label htmlFor="sd-amount">Amount</label>
          <input
            id="sd-amount"
            className="input"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") add(); }}
          />
        </div>
        <div className="field f1">
          <label htmlFor="sd-note">Note (optional)</label>
          <input
            id="sd-note"
            className="input"
            type="text"
            placeholder="e.g. masjid fund"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") add(); }}
          />
        </div>
        <button className="btn btn-primary" onClick={add}><Icon name="plus" size={16} /> Add</button>
      </div>

      {value.entries.length > 0 ? (
        <ul className="sadaqah-list">
          {value.entries.map((e) => (
            <li key={e.id} className="sadaqah-row">
              <div style={{ minWidth: 0 }}>
                <span className="sadaqah-amt">{fmt(e.amount)}</span>
                {e.note && <span className="faint sadaqah-note"> · {e.note}</span>}
                <div className="faint" style={{ fontSize: ".78rem" }}>{e.date}</div>
              </div>
              <button className="btn btn-ghost btn-sm" aria-label="Delete entry" onClick={() => remove(e.id)}>
                <Icon name="x" size={15} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        ready && <p className="faint" style={{ textAlign: "center" }}>No entries yet — add your first sadaqah above.</p>
      )}

      <Link href="/mosques" className="btn btn-soft btn-block mt12">
        <Icon name="mosque" size={16} /> Find a mosque or cause to give to
      </Link>
      <p className="faint" style={{ fontSize: ".82rem", marginTop: 8, textAlign: "center" }}>
        A private record for yourself — saved on this device only, never uploaded.
      </p>
    </div>
  );
}
