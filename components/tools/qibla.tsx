"use client";

/* Qibla compass — points toward the Kaaba from the user's location. Reuses the
   shared great-circle helpers in lib/qibla.ts (no duplicate geometry) and
   lib/geo for distance. Location + device-orientation are read only in the
   browser, on a user gesture, and never stored or sent anywhere. */
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui";
import { qiblaBearing, compassLabel } from "@/lib/qibla";
import { haversineKm } from "@/lib/geo";

const KAABA = { lat: 21.4225, lng: 39.8262 };

type Status = "idle" | "locating" | "ready" | "denied" | "error";

export function QiblaTool() {
  const [status, setStatus] = useState<Status>("idle");
  const [bearing, setBearing] = useState<number | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const orientationHandler = useRef<((e: DeviceOrientationEvent) => void) | null>(null);

  // Tidy up the orientation listener on unmount.
  useEffect(() => {
    return () => {
      if (orientationHandler.current) {
        window.removeEventListener("deviceorientationabsolute", orientationHandler.current as EventListener);
        window.removeEventListener("deviceorientation", orientationHandler.current as EventListener);
      }
    };
  }, []);

  const startOrientation = async () => {
    try {
      // iOS 13+ requires explicit permission, granted inside a user gesture.
      const DOE = window.DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<"granted" | "denied">;
      };
      if (DOE && typeof DOE.requestPermission === "function") {
        const res = await DOE.requestPermission();
        if (res !== "granted") return;
      }
      const handler = (e: DeviceOrientationEvent) => {
        const webkitHeading = (e as unknown as { webkitCompassHeading?: number }).webkitCompassHeading;
        if (typeof webkitHeading === "number") {
          setHeading(webkitHeading); // already relative to true north
        } else if (e.absolute && typeof e.alpha === "number") {
          setHeading((360 - e.alpha) % 360);
        }
      };
      orientationHandler.current = handler;
      window.addEventListener("deviceorientationabsolute", handler as EventListener);
      window.addEventListener("deviceorientation", handler as EventListener);
    } catch {
      /* orientation unavailable — we fall back to a static dial */
    }
  };

  const findQibla = () => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setStatus("error");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setBearing(qiblaBearing(lat, lng));
        setDistanceKm(haversineKm({ lat, lng }, KAABA));
        setStatus("ready");
        void startOrientation();
      },
      (err) => setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "error"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // Needle angle relative to the top of the dial. With a live heading the needle
  // tracks the real Qibla as you turn; otherwise the dial is "North-up".
  const needle = bearing == null ? 0 : (bearing - (heading ?? 0) + 360) % 360;
  const live = heading != null;

  return (
    <div className="qibla">
      <div className={`qibla-dial ${status === "ready" ? "on" : ""}`} aria-hidden={status !== "ready"}>
        <span className="qibla-mark n">N</span>
        <span className="qibla-mark e">E</span>
        <span className="qibla-mark s">S</span>
        <span className="qibla-mark w">W</span>
        <div className="qibla-needle" style={{ transform: `translate(-50%, -100%) rotate(${needle}deg)` }}>
          <Icon name="near" size={20} />
        </div>
        <div className="qibla-center" />
      </div>

      <div className="qibla-readout" aria-live="polite">
        {status === "idle" && <p className="muted">Tap below to find the Qibla from your current location.</p>}
        {status === "locating" && <p className="muted">Locating you…</p>}
        {status === "denied" && (
          <p className="muted">Location permission was denied. Enable location access and try again.</p>
        )}
        {status === "error" && (
          <p className="muted">Couldn&apos;t get your location on this device. Try on a phone with location enabled.</p>
        )}
        {status === "ready" && bearing != null && (
          <>
            <strong className="qibla-bearing">
              {Math.round(bearing)}° {compassLabel(bearing)}
            </strong>
            <span className="faint">
              from true north{distanceKm != null && <> · {Math.round(distanceKm).toLocaleString()} km to Makkah</>}
            </span>
            <span className="faint" style={{ fontSize: ".84rem", marginTop: 6 }}>
              {live
                ? "Live compass on — turn until the arrow points straight up."
                : "Live compass unavailable: align the top of the dial with North, then the arrow shows the Qibla."}
            </span>
          </>
        )}
      </div>

      <button className="btn btn-primary" onClick={findQibla}>
        <Icon name="near" size={17} /> {status === "ready" ? "Recalculate" : "Find the Qibla"}
      </button>

      <p className="faint" style={{ fontSize: ".82rem", marginTop: 4, textAlign: "center", maxWidth: 460 }}>
        Phone compasses can be off by several degrees and need calibration (move the device in a figure-8).
        For prayer, confirm with a reliable local reference where possible. Nothing here is stored or uploaded.
      </p>
    </div>
  );
}
