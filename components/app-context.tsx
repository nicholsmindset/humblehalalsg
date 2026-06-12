"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { myTickets as defaultTickets } from "@/lib/data";
import { pathToScreen, screenToPath, type Params } from "@/lib/routes";
import { t as translate } from "@/lib/i18n";
import { DEFAULT_FLAGS, type Flags } from "@/lib/flags";
import type { Collection, Lang, Prefs, Ticket, Tweaks, UserState } from "@/lib/types";

const DEFAULT_COLLECTIONS: Collection[] = [
  { id: "family-weekend", name: "Family weekend", ids: [] },
  { id: "iftar-2026", name: "Iftar 2026", ids: [] },
];

export const DEFAULT_TWEAKS: Tweaks = {
  hero: "split",
  heading: "Spectral",
  badge: "premium",
  card: "standard",
  accent: "balanced",
  radius: 20,
};

interface AppState {
  saved: string[];
  wishlist: string[];
  recent: string[];
  user: UserState;
  tweaks: Tweaks;
  prefs: Prefs;
  savedEvents: string[];
  tickets: Ticket[];
  collections: Collection[];
}

interface AppContextValue {
  route: { screen: string; params: Params };
  params: Params;
  navigate: (screen: string, params?: Params) => void;
  back: () => void;
  state: AppState;
  setUser: (u: UserState) => void;
  toggleSave: (id: string) => void;
  toggleWish: (id: string) => void;
  toast: (msg: string) => void;
  setTweak: (key: string, value: string | number) => void;
  setPref: (patch: Partial<Prefs>) => void;
  toggleCertifiedOnly: () => void;
  toggleEventSave: (id: string) => void;
  bookEvent: (eventId: string, tier: string, qty: number) => void;
  toastMsg: string;
  // collections
  createCollection: (name: string) => string;
  toggleInCollection: (collectionId: string, listingId: string) => void;
  // language + ramadan
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: Parameters<typeof translate>[1]) => string;
  ramadan: boolean;
  toggleRamadan: () => void;
  // monetization kill-switches (admin-controlled; UI gating only)
  flags: Flags;
  setFlag: (key: keyof Flags, value: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);
export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};

const LS = "hh_state_v1";
type Persisted = Partial<AppState> & { flags?: Flags };
function loadLS(): Persisted {
  try {
    return JSON.parse(localStorage.getItem(LS) || "{}") || {};
  } catch {
    return {};
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const routeParams = useParams();
  const search = useSearchParams();

  const [saved, setSaved] = useState<string[]>(["l2", "l10"]);
  const [wishlist, setWishlist] = useState<string[]>(["l4"]);
  const [recent, setRecent] = useState<string[]>(["l1", "l7"]);
  const [user, setUserState] = useState<UserState>({ loggedIn: false, role: "user", name: "Aisyah" });
  const [prefs, setPrefs] = useState<Prefs>({ onboarded: false, homeArea: "", certifiedOnly: false });
  const [savedEvents, setSavedEvents] = useState<string[]>(["e1"]);
  const [tickets, setTickets] = useState<Ticket[]>(defaultTickets);
  const [tweaks, setTweaks] = useState<Tweaks>(DEFAULT_TWEAKS);
  const [collections, setCollections] = useState<Collection[]>(DEFAULT_COLLECTIONS);
  const [flags, setFlags] = useState<Flags>(DEFAULT_FLAGS);
  const [toastMsg, setToastMsg] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    const ls = loadLS();
    if (ls.saved) setSaved(ls.saved);
    if (ls.wishlist) setWishlist(ls.wishlist);
    if (ls.recent) setRecent(ls.recent);
    if (ls.user) setUserState(ls.user);
    if (ls.prefs) setPrefs(ls.prefs);
    if (ls.savedEvents) setSavedEvents(ls.savedEvents);
    if (ls.tickets) setTickets(ls.tickets);
    if (ls.tweaks) setTweaks({ ...DEFAULT_TWEAKS, ...ls.tweaks });
    if (ls.collections) setCollections(ls.collections);
    if (ls.flags) setFlags({ ...DEFAULT_FLAGS, ...ls.flags });
    setHydrated(true);
  }, []);

  // persist
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        LS,
        JSON.stringify({ saved, wishlist, recent, user, prefs, savedEvents, tickets, tweaks, collections, flags }),
      );
    } catch {
      /* ignore */
    }
  }, [saved, wishlist, recent, user, prefs, savedEvents, tickets, tweaks, collections, flags, hydrated]);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(""), 2200);
  }, []);

  const navigate = useCallback(
    (screen: string, params: Params = {}) => {
      if (screen === "detail" && params.id) {
        const id = String(params.id);
        setRecent((r) => [id, ...r.filter((x) => x !== id)].slice(0, 8));
      }
      router.push(screenToPath(screen, params));
      window.scrollTo({ top: 0 });
    },
    [router],
  );

  const back = useCallback(() => router.back(), [router]);

  const setUser = useCallback((u: UserState) => setUserState(u), []);

  const toggleSave = useCallback(
    (id: string) =>
      setSaved((s) => {
        const has = s.includes(id);
        toast(has ? "Removed from Saved" : "Saved to your list");
        return has ? s.filter((x) => x !== id) : [id, ...s];
      }),
    [toast],
  );
  const toggleWish = useCallback(
    (id: string) =>
      setWishlist((s) => {
        const has = s.includes(id);
        toast(has ? "Removed from Wishlist" : "Added to Wishlist");
        return has ? s.filter((x) => x !== id) : [id, ...s];
      }),
    [toast],
  );
  const toggleEventSave = useCallback(
    (id: string) =>
      setSavedEvents((s) => {
        const has = s.includes(id);
        toast(has ? "Removed from Saved" : "Event saved");
        return has ? s.filter((x) => x !== id) : [id, ...s];
      }),
    [toast],
  );
  const bookEvent = useCallback((eventId: string, tier: string, qty: number) => {
    const ref =
      (tier === "RSVP" ? "HH-RSVP-" : "HH-TKT-") + Math.floor(1000 + Math.random() * 9000);
    setTickets((t) => [
      { eventId, tier, qty, ref, status: "upcoming" },
      ...t.filter((x) => x.eventId !== eventId),
    ]);
  }, []);

  const setPref = useCallback((patch: Partial<Prefs>) => setPrefs((p) => ({ ...p, ...patch })), []);
  const toggleCertifiedOnly = useCallback(
    () =>
      setPrefs((p) => {
        const v = !p.certifiedOnly;
        toast(v ? "Showing certified places only" : "Showing all places");
        return { ...p, certifiedOnly: v };
      }),
    [toast],
  );
  const setTweak = useCallback(
    (key: string, value: string | number) => setTweaks((t) => ({ ...t, [key]: value })),
    [],
  );

  // collections
  const createCollection = useCallback((name: string) => {
    const id = "col-" + Math.floor(1000 + Math.random() * 9000);
    setCollections((c) => [...c, { id, name: name.trim() || "New collection", ids: [] }]);
    return id;
  }, []);
  const toggleInCollection = useCallback(
    (collectionId: string, listingId: string) =>
      setCollections((cols) =>
        cols.map((c) => {
          if (c.id !== collectionId) return c;
          const has = c.ids.includes(listingId);
          toast(has ? `Removed from ${c.name}` : `Added to ${c.name}`);
          return { ...c, ids: has ? c.ids.filter((x) => x !== listingId) : [listingId, ...c.ids] };
        }),
      ),
    [toast],
  );

  // language + ramadan
  const lang: Lang = prefs.lang || "en";
  const setLang = useCallback(
    (l: Lang) => setPrefs((p) => ({ ...p, lang: l })),
    [],
  );
  const t = useCallback(
    (key: Parameters<typeof translate>[1]) => translate(prefs.lang, key),
    [prefs.lang],
  );
  const setFlag = useCallback(
    (key: keyof Flags, value: boolean) => setFlags((f) => ({ ...f, [key]: value })),
    [],
  );

  const ramadan = !!prefs.ramadan;
  const toggleRamadan = useCallback(
    () =>
      setPrefs((p) => {
        const v = !p.ramadan;
        toast(v ? "Ramadan mode on — iftar & open-late surfaced" : "Ramadan mode off");
        return { ...p, ramadan: v };
      }),
    [toast],
  );

  // reflect chosen language on <html lang> for a11y + SEO
  useEffect(() => {
    document.documentElement.lang = prefs.lang === "ms" ? "ms" : "en";
  }, [prefs.lang]);

  // apply tweaks to the DOM (heading font, badge/card style, accent, radius)
  useEffect(() => {
    const r = document.documentElement;
    const fontMap: Record<string, string> = {
      Spectral: "var(--font-spectral), Georgia, serif",
      Cormorant: "var(--font-cormorant), Georgia, serif",
      "Libre Caslon": "var(--font-libre), Georgia, serif",
      Newsreader: "var(--font-newsreader), Georgia, serif",
    };
    r.style.setProperty("--serif", fontMap[tweaks.heading] || fontMap.Spectral);
    const rad = tweaks.radius;
    r.style.setProperty("--r-md", rad * 0.7 + "px");
    r.style.setProperty("--r-lg", rad + "px");
    r.style.setProperty("--r-xl", rad * 1.4 + "px");
    document.body.dataset.badge = tweaks.badge;
    document.body.dataset.card = tweaks.card;
    document.body.dataset.accent = tweaks.accent;
  }, [tweaks.heading, tweaks.radius, tweaks.badge, tweaks.card, tweaks.accent]);

  const params = useMemo<Params>(() => {
    const merged: Params = {};
    Object.entries(routeParams || {}).forEach(([k, v]) => {
      merged[k] = Array.isArray(v) ? v[0] : v;
    });
    search.forEach((v, k) => {
      merged[k] = v;
    });
    return merged;
  }, [routeParams, search]);

  const screen = pathToScreen(pathname);

  const value = useMemo<AppContextValue>(
    () => ({
      route: { screen, params },
      params,
      navigate,
      back,
      state: { saved, wishlist, recent, user, tweaks, prefs, savedEvents, tickets, collections },
      setUser,
      toggleSave,
      toggleWish,
      toast,
      setTweak,
      setPref,
      toggleCertifiedOnly,
      toggleEventSave,
      bookEvent,
      toastMsg,
      createCollection,
      toggleInCollection,
      lang,
      setLang,
      t,
      ramadan,
      toggleRamadan,
      flags,
      setFlag,
    }),
    [
      screen, params, navigate, back, saved, wishlist, recent, user, tweaks, prefs,
      savedEvents, tickets, collections, setUser, toggleSave, toggleWish, toast, setTweak, setPref,
      toggleCertifiedOnly, toggleEventSave, bookEvent, toastMsg,
      createCollection, toggleInCollection, lang, setLang, t, ramadan, toggleRamadan,
      flags, setFlag,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
