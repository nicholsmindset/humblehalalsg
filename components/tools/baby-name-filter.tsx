"use client";

/* Filter controls for the baby-name finder. The actual filtering happens
   server-side (the page reads ?gender & ?q), so results are SEO-friendly and
   work without JS; these controls just update the URL. */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui";

type Gender = "all" | "boy" | "girl";

function href(gender: Gender, q: string): string {
  const sp = new URLSearchParams();
  if (gender !== "all") sp.set("gender", gender);
  if (q.trim()) sp.set("q", q.trim());
  const s = sp.toString();
  return `/tools/baby-names${s ? `?${s}` : ""}`;
}

export function BabyNameFilter({ gender, q }: { gender: Gender; q: string }) {
  const router = useRouter();
  const [term, setTerm] = useState(q);

  const setGender = (g: Gender) => router.push(href(g, term));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(href(gender, term));
  };

  return (
    <div className="babyname-filter">
      <div className="pillbar" role="group" aria-label="Filter by gender">
        {(["all", "boy", "girl"] as Gender[]).map((g) => (
          <button key={g} className={`chip ${gender === g ? "active" : ""}`} aria-pressed={gender === g} onClick={() => setGender(g)}>
            {g === "all" ? "All" : g === "boy" ? "Boys" : "Girls"}
          </button>
        ))}
      </div>
      <form className="searchbar" onSubmit={submit} role="search">
        <Icon name="search" size={20} className="lead" />
        <input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search names or meanings…"
          aria-label="Search baby names"
        />
        <button type="submit" className="btn btn-primary btn-sm sb-btn">Search</button>
      </form>
    </div>
  );
}
