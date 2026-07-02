"use client";

/* Organiser door check-in. Scans a ticket QR with the browser-native
   BarcodeDetector (Chrome/Android) when available, with a manual-code fallback
   that always works. Posts to /api/tickets/checkin, which authorises the
   organiser/admin and flips valid→used (rejecting re-scans). */
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon, MobileHeader } from "../ui";
import { useApp } from "../app-context";

type Result = { kind: "ok" | "warn" | "err"; msg: string; sub?: string };

// Minimal shape of the native BarcodeDetector (not in TS lib yet).
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}
interface BarcodeDetectorCtor {
  new (opts?: { formats?: string[] }): BarcodeDetectorLike;
}

export function CheckinScanner({ slug }: { slug: string }) {
  const { navigate } = useApp();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [count, setCount] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [camError, setCamError] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });

  const submit = useCallback(async (raw: string) => {
    const qrRef = raw.trim();
    if (!qrRef || busy) return;
    // Debounce duplicate scans of the same code within 3s.
    if (lastRef.current.code === qrRef && Date.now() - lastRef.current.at < 3000) return;
    lastRef.current = { code: qrRef, at: Date.now() };
    setBusy(true);
    try {
      const res = await fetch("/api/tickets/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrRef }),
      });
      const j = await res.json();
      if (j?.ok) {
        setCount((c) => c + 1);
        setResult({ kind: "ok", msg: `✓ Checked in — ${j.attendee}`, sub: j.tier });
      } else if (j?.reason === "already_used") {
        setResult({ kind: "warn", msg: "Already checked in", sub: j.checkedInAt ? new Date(j.checkedInAt).toLocaleTimeString() : undefined });
      } else if (j?.reason === "forbidden") {
        setResult({ kind: "err", msg: "Not your event", sub: "Sign in as the organiser" });
      } else if (j?.reason === "not_found") {
        setResult({ kind: "err", msg: "Ticket not recognised" });
      } else if (j?.reason === "refunded" || j?.reason === "cancelled") {
        setResult({ kind: "err", msg: `Ticket ${j.reason}` });
      } else {
        setResult({ kind: "err", msg: "Couldn’t check in", sub: j?.reason });
      }
    } catch {
      setResult({ kind: "err", msg: "Network error — try again" });
    }
    setBusy(false);
    setCode("");
  }, [busy]);

  // Camera scan loop (best-effort; manual entry always works).
  useEffect(() => {
    if (!scanning) return;
    const Ctor = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
    if (!Ctor) { setCamError("This browser can’t scan — type the code instead."); setScanning(false); return; }
    let raf = 0;
    let detector: BarcodeDetectorLike;
    try { detector = new Ctor({ formats: ["qr_code"] }); } catch { setCamError("Scanner unavailable."); setScanning(false); return; }
    let alive = true;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      } catch { setCamError("Camera blocked — allow access or type the code."); setScanning(false); return; }
      const tick = async () => {
        if (!alive || !videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes[0]?.rawValue) submit(codes[0].rawValue);
        } catch { /* transient */ }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    })();
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [scanning, submit]);

  const rc = result?.kind === "ok" ? "var(--emerald)" : result?.kind === "warn" ? "var(--gold)" : "var(--danger)";

  return (
    <div className="screen-in hh-page">
      <MobileHeader title="Door check-in" onBack={() => navigate("event-detail", { id: slug })} />
      <div className="hh-wrap" style={{ maxWidth: 560, paddingTop: 16 }}>
        <div className="flex between center">
          <h1 style={{ fontSize: "1.5rem" }}>Check in attendees</h1>
          <span className="tag green"><Icon name="check" size={14} /> {count} in</span>
        </div>
        <p className="muted" style={{ marginTop: 6 }}>Scan each ticket’s QR, or type the reference under it.</p>

        <div className="card" style={{ marginTop: 16, padding: 16 }}>
          {scanning ? (
            <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", background: "#000", aspectRatio: "4/3" }}>
              <video ref={videoRef} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button className="btn btn-ghost btn-sm" style={{ position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,.9)" }} onClick={() => setScanning(false)}>Stop</button>
            </div>
          ) : (
            <button className="btn btn-primary btn-block" onClick={() => { setCamError(""); setScanning(true); }}>
              <Icon name="camera" size={17} /> Scan with camera
            </button>
          )}
          {camError && <p className="field-error" style={{ marginTop: 8 }}>{camError}</p>}

          <div className="flex g8 center" style={{ marginTop: 14 }}>
            <input
              className="input" placeholder="Ticket reference / code" value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(code); }}
            />
            <button className="btn btn-gold" disabled={busy || !code.trim()} onClick={() => submit(code)}>
              {busy ? "…" : "Check in"}
            </button>
          </div>
        </div>

        {result && (
          <div className="card" style={{ marginTop: 14, padding: 16, borderColor: rc, borderWidth: 2 }}>
            <div style={{ fontWeight: 800, fontSize: "1.1rem", color: rc }}>{result.msg}</div>
            {result.sub && <div className="muted" style={{ marginTop: 4 }}>{result.sub}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
