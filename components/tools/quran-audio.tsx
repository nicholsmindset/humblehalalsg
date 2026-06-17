"use client";

/* Recitation player for a surah — one <audio> element that plays each ayah in
   sequence (Mishary al-Afasy). Self-contained client island; the verse text is
   server-rendered separately. */
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui";

export function QuranAudio({ urls }: { urls: string[] }) {
  const tracks = urls.filter(Boolean);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.src = tracks[index] || "";
      el.play().catch(() => setPlaying(false));
    } else {
      el.pause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, index]);

  if (!tracks.length) return null;

  const onEnded = () => {
    if (index < tracks.length - 1) setIndex((i) => i + 1);
    else setPlaying(false);
  };
  const go = (i: number) => {
    if (i < 0 || i >= tracks.length) return;
    setIndex(i);
    setPlaying(true);
  };

  return (
    <div className="quran-audio">
      <button className="btn btn-soft btn-sm" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous ayah">
        <Icon name="back" size={16} />
      </button>
      <button className="btn btn-primary btn-sm" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause" : "Play recitation"}>
        <Icon name={playing ? "minus" : "arrow"} size={16} /> {playing ? "Pause" : "Play"}
      </button>
      <button className="btn btn-soft btn-sm" onClick={() => go(index + 1)} disabled={index >= tracks.length - 1} aria-label="Next ayah">
        <Icon name="chevron" size={16} />
      </button>
      <span className="faint" style={{ fontSize: ".84rem" }}>Ayah {index + 1} / {tracks.length}</span>
      <audio ref={audioRef} onEnded={onEnded} preload="none" />
    </div>
  );
}
