"use client";

/* Search box for the Qur'an word search. Navigates to the server-rendered
   results page (/tools/quran/search?q=…) — the search itself runs server-side
   via AlQuran.cloud, so there's no large index shipped to the browser. */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui";

export function QuranSearchBox({ initial = "" }: { initial?: string }) {
  const [q, setQ] = useState(initial);
  const router = useRouter();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (term) router.push(`/tools/quran/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <form className="searchbar quran-search-box" onSubmit={submit} role="search">
      <Icon name="search" size={20} className="lead" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search the Quran for a word (e.g. mercy, patience)…"
        aria-label="Search the Quran"
      />
      <button type="submit" className="btn btn-primary btn-sm sb-btn">Search</button>
    </form>
  );
}
