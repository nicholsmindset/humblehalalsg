"use client";

/* Prayer times for the user's location. Local-first: the chosen location and
   method are remembered in this browser only; coordinates are sent to our own
   endpoint solely to look up times (Aladhan), never stored server-side. */
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui";
import { PRAYER_METHODS, DEFAULT_METHOD } from "@/lib/tools/prayer-methods";

const KEY = "hh_prayer_v1";

interface PrayerTime { name: string; time: string; mins: number; isPrayer: boolean }
interface Result {
  date: string;
  hijri: string;
  timezone: string;
  methodName: string;
  times: PrayerTime[];
}
type Status = "idle" | "loading" | "ready" | "denied" | "error";

interface Saved { lat: number; lng: number; method: number }

function loadSaved(): Saved | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<Saved>;
    if (Number.isFinite(p.lat) && Number.isFinite(p.lng)) {
      return { lat: Number(p.lat), lng: Number(p.lng), method: Number(p.method) || DEFAULT_METHOD };
    }
  } catch {
    /* ignore */
  }
  return null;
}

function nowMins(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

export function PrayerTimesTool() {
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<Result | null>(null);
  const [method, setMethod] = useState<number>(DEFAULT_METHOD);
  const coords = useRef<{ lat: number; lng: number } | null>(null);

  const fetchTimes = useCallback(async (lat: number, lng: number, m: number) => {
    setStatus("loading");
    try {
      const res = await fetch(`/api/tools/prayer-times?lat=${lat}&lng=${lng}&method=${m}`);
      const json = await res.json();
      if (json?.ok) {
        setData(json as Result);
        setStatus("ready");
        try {
          localStorage.setItem(KEY, JSON.stringify({ lat, lng, method: m }));
        } catch {
          /* ignore */
        }
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }, []);

  // Restore a saved location on mount and load its times.
  useEffect(() => {
    const s = loadSaved();
    if (s) {
      coords.current = { lat: s.lat, lng: s.lng };
      setMethod(s.method);
      void fetchTimes(s.lat, s.lng, s.method);
    }
  }, [fetchTimes]);

  const useMyLocation = () => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        coords.current = { lat, lng };
        void fetchTimes(lat, lng, method);
      },
      (err) => setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "error"),
      { enableHighAccuracy: false, timeout: 10000 },
    );
  };

  const onMethod = (m: number) => {
    setMethod(m);
    if (coords.current) void fetchTimes(coords.current.lat, coords.current.lng, m);
  };

  // Next upcoming prayer (skips Sunrise).
  const prayers = data?.times.filter((t) => t.isPrayer) ?? [];
  const now = nowMins();
  const nextPrayer = prayers.find((p) => p.mins > now) ?? prayers[0] ?? null;

  return (
    <div className="prayer">
      <div className="prayer-controls">
        <button className="btn btn-primary" onClick={useMyLocation}>
          <Icon name="near" size={17} /> {data ? "Update location" : "Use my location"}
        </button>
        <div className="field">
          <label htmlFor="pt-method" className="sr-only">Calculation method</label>
          <select id="pt-method" className="select" value={method} onChange={(e) => onMethod(Number(e.target.value))}>
            {PRAYER_METHODS.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div aria-live="polite">
        {status === "idle" && <p className="muted">Allow location access to see today&apos;s prayer times where you are.</p>}
        {status === "loading" && <p className="muted">Loading prayer times…</p>}
        {status === "denied" && <p className="muted">Location permission was denied. Enable it and try again.</p>}
        {status === "error" && <p className="muted">Couldn&apos;t load prayer times right now. Please try again.</p>}

        {status === "ready" && data && (
          <div className="prayer-card card">
            <div className="prayer-head">
              <div>
                <div className="prayer-date">{data.date}</div>
                {data.hijri && <div className="faint">{data.hijri}</div>}
              </div>
              {nextPrayer && (
                <div className="prayer-next">
                  <span className="faint">Next</span>
                  <strong>{nextPrayer.name} · {nextPrayer.time}</strong>
                </div>
              )}
            </div>
            <ul className="prayer-list">
              {data.times.map((t) => (
                <li key={t.name} className={`prayer-row ${nextPrayer && t.name === nextPrayer.name ? "next" : ""} ${!t.isPrayer ? "sun" : ""}`}>
                  <span className="prayer-name">{t.name}</span>
                  <span className="prayer-time">{t.time}</span>
                </li>
              ))}
            </ul>
            <div className="faint prayer-foot">
              {data.methodName}{data.timezone && <> · {data.timezone}</>}
            </div>
          </div>
        )}
      </div>

      <p className="faint" style={{ fontSize: ".82rem", marginTop: 4 }}>
        Times are calculated (via Aladhan) for your coordinates and chosen method, and can differ slightly from
        your local mosque. Confirm with your masjid where it matters. Your location stays on this device.
      </p>
    </div>
  );
}
