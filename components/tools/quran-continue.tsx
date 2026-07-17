"use client";

/* "Continue where you left off" card — renders ONLY when a last-read position
   exists in this browser (written by QuranLastRead on the surah pages). */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui";
import { QURAN_LAST_READ_KEY, type QuranLastRead } from "./quran-last-read";

export function QuranContinue() {
  const [last, setLast] = useState<QuranLastRead | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(QURAN_LAST_READ_KEY);
      if (!raw) return;
      const v = JSON.parse(raw) as QuranLastRead;
      if (v && Number.isFinite(v.surah)) setLast(v);
    } catch { /* corrupt store — hide card */ }
  }, []);
  if (!last) return null;
  return (
    <Link href={`/tools/quran/${last.surah}`} className="tools-continue-card">
      <span className="tool-card-ico"><Icon name="doc" size={18} /></span>
      <span className="tools-continue-body">
        <em>Continue where you left off</em>
        <strong>Quran Reader</strong>
        <span>
          {last.surahName ? `Surah ${last.surahName}` : `Surah ${last.surah}`}
          {last.ayah ? ` · Ayah ${last.ayah}` : ""}
        </span>
      </span>
      <span className="tools-continue-cta">Continue reading <Icon name="arrow" size={14} /></span>
    </Link>
  );
}
