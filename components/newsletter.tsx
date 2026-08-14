"use client";

import { useRef, useState } from "react";
import { Icon } from "./ui";
import { track } from "@/lib/analytics";
import { Turnstile } from "./turnstile";

export function Newsletter({
  source = "footer",
  variant = "inline",
  collectName = false,
  cta = "Subscribe",
  stage,
  consent = true,
  successHref,
  successCta,
  successMessage,
}: {
  source?: string;
  variant?: "inline" | "card";
  /** Show an optional first-name field (high-intent surfaces only). */
  collectName?: boolean;
  /** Submit button label. */
  cta?: string;
  /** Owner-funnel lifecycle stage (lead | listed | claimed) forwarded to beehiiv. */
  stage?: string;
  /** Show the PDPA consent + privacy line under the form (default true). */
  consent?: boolean;
  /** Optional immediate-access link shown after a successful signup. */
  successHref?: string;
  /** Label for the immediate-access link. */
  successCta?: string;
  /** Override the default post-submit confirmation. */
  successMessage?: string;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [tsToken, setTsToken] = useState("");
  const started = useRef(false);
  const isMalay = source.startsWith("ms-");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("error");
      setMsg(isMalay ? "Sila masukkan alamat e-mel yang sah" : "Please enter a valid email");
      track.newsletterFormError(source, "invalid_email");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source, ...(collectName && name ? { name } : {}), ...(stage ? { stage } : {}), ...(tsToken ? { turnstileToken: tsToken } : {}) }),
      });
      const data = await res.json();
      if (data.ok) {
        if (!data.already) track.newsletterSignup(source, email);
        setStatus("done");
        setMsg(successMessage || (data.already
          ? (isMalay ? "Anda sudah berada dalam senarai — jazakallah!" : "You're already on the list — jazakallah!")
          : (isMalay ? "Pendaftaran berjaya! Semak peti masuk anda." : "You're in! Check your inbox.")));
        setEmail("");
        setName("");
      } else {
        setStatus("error");
        setMsg(data.error || (isMalay ? "Sesuatu telah berlaku — sila cuba lagi" : "Something went wrong"));
        track.newsletterFormError(source, data.error || "provider_error");
      }
    } catch {
      setStatus("error");
      setMsg(isMalay ? "Ralat rangkaian — sila cuba lagi" : "Network error — please try again");
      track.newsletterFormError(source, "network_error");
    }
  };

  return (
    <div className={`newsletter newsletter-${variant}`}>
      {status === "done" ? (
        <div className="newsletter-done" role="status">
          <p><Icon name="check" size={16} /> {msg}</p>
          {successHref && (
            <a className="btn btn-primary" href={successHref} style={{ marginTop: 12 }}>
              {successCta || (isMalay ? "Buka panduan" : "Open the planner")}
            </a>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="newsletter-form" noValidate>
          {collectName && (
            <>
              <label htmlFor={`nl-name-${source}`} className="sr-only">
                First name
              </label>
              <input
                id={`nl-name-${source}`}
                className="input"
                type="text"
                autoComplete="given-name"
                placeholder="First name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ marginBottom: 8, fontSize: 16 }}
              />
            </>
          )}
          <label htmlFor={`nl-${source}`} className="sr-only">
            Email address
          </label>
          <div className="newsletter-row">
            <input
              id={`nl-${source}`}
              className="input"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@email.com"
              value={email}
              onFocus={() => {
                if (started.current) return;
                started.current = true;
                track.newsletterFormStart(source);
              }}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === "error") setStatus("idle");
              }}
              aria-invalid={status === "error"}
              aria-describedby={status === "error" ? `nl-${source}-err` : undefined}
              style={{ fontSize: 16 }}
            />
            <button className="btn btn-primary" type="submit" disabled={status === "loading"}>
              {status === "loading" ? (isMalay ? "Mendaftar…" : "Joining…") : cta}
            </button>
          </div>
          <Turnstile onToken={setTsToken} />
          {status === "error" && (
            <span id={`nl-${source}-err`} className="field-error" style={{ marginTop: 6 }}>
              <Icon name="warning" size={13} /> {msg}
            </span>
          )}
          {consent && (
            <p className="newsletter-consent" style={{ marginTop: 8, fontSize: ".72rem", lineHeight: 1.4, color: "var(--ink-faint)" }}>
              {isMalay ? (
                <>Dengan melanggan, anda bersetuju menerima e-mel pemasaran Humble Halal dan menerima <a href="/privacy">Dasar Privasi</a> kami. Sumber yang diminta akan dihantar sekarang. Berhenti melanggan pada bila-bila masa.</>
              ) : (
                <>By subscribing you agree to receive marketing emails from HumbleHalal and accept our <a href="/privacy">Privacy Policy</a>. We&apos;ll email your requested resource right away. Unsubscribe anytime.</>
              )}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
