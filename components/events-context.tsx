"use client";

import { createContext, useContext, useMemo } from "react";
import { events as mockEvents } from "@/lib/events-data";
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

// Default value = the mock seed, so screens work even outside a provider.
const mockValue = build(mockEvents);
const EventsContext = createContext<EventsValue>(mockValue);

export function EventsProvider({ events, children }: { events?: EventItem[]; children: React.ReactNode }) {
  const value = useMemo(() => (events && events.length ? build(events) : mockValue), [events]);
  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
}

export function useEvents(): EventsValue {
  return useContext(EventsContext);
}
