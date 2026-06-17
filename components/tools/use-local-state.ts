"use client";

/* Local-first state hook for the Deen Tools trackers. State starts from a
   deterministic default (so SSR and the first client render match), then
   hydrates from localStorage on mount and persists on change. Storage failures
   are swallowed so private/incognito modes still work. Returns `ready` so
   callers can avoid flashing default data before hydration. */
import { useEffect, useState } from "react";

export function useLocalState<T>(key: string, initial: T): {
  value: T;
  setValue: React.Dispatch<React.SetStateAction<T>>;
  ready: boolean;
} {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) setValue(JSON.parse(raw) as T);
    } catch {
      /* storage blocked / bad JSON — keep defaults */
    }
    setReady(true);
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [key, value, ready]);

  return { value, setValue, ready };
}
