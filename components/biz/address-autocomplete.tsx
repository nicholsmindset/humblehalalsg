"use client";

import { useEffect, useRef, useState } from "react";

export interface AddrPick {
  address: string;
  road: string;
  building: string;
  postal: string;
  lat: number;
  lng: number;
}

/* Debounced Singapore address autocomplete backed by /api/geocode (OneMap).
   `value`/`onChange` keep the text controlled by the parent; `onPick` fires
   with the full record (incl. coords + postal) when a suggestion is chosen. */
export function AddressAutocomplete({
  id,
  value,
  placeholder,
  onChange,
  onPick,
}: {
  id?: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
  onPick: (r: AddrPick) => void;
}) {
  const [results, setResults] = useState<AddrPick[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const skip = useRef(false); // don't re-search the value we just picked

  useEffect(() => {
    const v = (value || "").trim();
    if (skip.current) {
      skip.current = false;
      return;
    }
    if (v.length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(v)}`);
        const data = await res.json();
        setResults(Array.isArray(data?.results) ? data.results : []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [value]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const pick = (r: AddrPick) => {
    skip.current = true;
    onChange(r.address);
    onPick(r);
    setOpen(false);
    setResults([]);
  };

  return (
    <div className="addr-ac" ref={wrap}>
      <input
        id={id}
        className="input"
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
      />
      {open && (loading || results.length > 0) && (
        <ul className="addr-ac-list" role="listbox">
          {loading && <li className="addr-ac-empty">Searching addresses…</li>}
          {!loading &&
            results.map((r, i) => (
              <li key={i}>
                <button type="button" className="addr-ac-item" onClick={() => pick(r)}>
                  <span className="addr-ac-main">{r.building || r.road || r.address}</span>
                  <span className="addr-ac-sub">{r.address}</span>
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
