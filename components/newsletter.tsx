"use client";

import { useState } from "react";
import { Icon } from "./ui";
import { track } from "@/lib/analytics";

export function Newsletter({
  source = "footer",
  variant = "inline",
  collectName = false,
  cta = "Subscribe",
}: {
  source?: string;
  variant?: "inline" | "card";
  /** Show an optional first-name field (high-intent surfaces only). */
  collectName?: boolean;
  /** Submit button label. */
  cta?: string;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("error");
      setMsg("Please enter a valid email");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source, ...(collectName && name ? { name } : {}) }),
      });
      const data = await res.json();
      if (data.ok) {
        if (!data.already) track.newsletterSignup(source);
        setStatus("done");
        setMsg(data.already ? "You're already on the list — jazakallah!" : "You're in! Check your inbox.");
        setEmail("");
        setName("");
      } else {
        setStatus("error");
        setMsg(data.error || "Something went wrong");
      }
    } catch {
      setStatus("error");
      setMsg("Network error — please try again");
    }
  };

  return (
    <div className={`newsletter newsletter-${variant}`}>
      {status === "done" ? (
        <p className="newsletter-done" role="status">
          <Icon name="check" size={16} /> {msg}
        </p>
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
                style={{ marginBottom: 8 }}
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
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === "error") setStatus("idle");
              }}
              aria-invalid={status === "error"}
              aria-describedby={status === "error" ? `nl-${source}-err` : undefined}
            />
            <button className="btn btn-primary" type="submit" disabled={status === "loading"}>
              {status === "loading" ? "Joining…" : cta}
            </button>
          </div>
          {status === "error" && (
            <span id={`nl-${source}-err`} className="field-error" style={{ marginTop: 6 }}>
              <Icon name="warning" size={13} /> {msg}
            </span>
          )}
        </form>
      )}
    </div>
  );
}
