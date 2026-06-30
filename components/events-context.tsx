"use client";

import { createContext, useContext, useMemo } from "react";
import type { EventItem } from "@/lib/types";

interface EventsValue {
  list: EventItem[];
  /** Resolve an event by slug or id (mirrors the old getEvent()). */
  get: (idOrSlug: string) => EventItem | undefined;
}

function build(list: EventItem[]): EventsValue {
  const byId = new Map(list.map((e) => [e.id, e]));
  // Fall back to id so events without a slug don't collide at the empty key.
  const bySlug = new Map(list.map((e) => [e.slug || e.id, e]));
  return { list, get: (x) => bySlug.get(x) || byId.get(x) };
}

// Default value = EMPTY, so screens outside a provider show a clean empty state
// (never fabricated data). The EventsProvider is always fed real getEvents() data.
const emptyValue = build([]);
const EventsContext = createContext<EventsValue>(emptyValue);

export function EventsProvider({ events, children }: { events?: EventItem[]; children: React.ReactNode }) {
  const value = useMemo(() => (events && events.length ? build(events) : emptyValue), [events]);
  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
}

export function useEvents(): EventsValue {
  return useContext(EventsContext);
}
