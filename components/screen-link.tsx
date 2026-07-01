"use client";

/* next/link wrapper that speaks the app's screen/params vocabulary (lib/routes).
   Gives every primary link real prefetch — the fix for slow-feeling page-to-page
   navigation, where the old `<a onClick={navigate}>` pattern fetched the next
   route's payload only on click.

   - Nav links (few, always visible): pass `activeClassName` → viewport prefetch
     (next/link default) + active-state highlighting.
   - Cards (many, e.g. 50 on /explore): pass `intent` → hover/touch prefetch only,
     using Next 16's documented `prefetch={active ? null : false}` pattern, so we
     don't eagerly pull dozens of detail payloads on mobile data.

   NOTE: automatic prefetch runs in PRODUCTION only — verify on a build/preview,
   not `next dev`. Client-side transitions (no full reload) work in dev. */

import Link from "next/link";
import { useState, type MouseEvent } from "react";
import { useApp } from "./app-context";
import { screenToPath, type Params } from "@/lib/routes";

type Props = {
  screen: string;
  params?: Params;
  children?: React.ReactNode;
  className?: string;
  /** When set, the link highlights + prefetches in-viewport as a primary nav item. */
  activeClassName?: string;
  /** Prefetch on hover/touch only (for lists with many links). */
  intent?: boolean;
  /** Explicit prefetch override passed to next/link (ignored when `intent`). */
  prefetch?: boolean;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
  "aria-label"?: string;
  title?: string;
  style?: React.CSSProperties;
  role?: string;
  tabIndex?: number;
};

export function ScreenLink({
  screen,
  params,
  children,
  className,
  activeClassName,
  intent,
  prefetch,
  onClick,
  ...rest
}: Props) {
  const { route } = useApp();
  const [warm, setWarm] = useState(false);
  const href = screenToPath(screen, params);
  // Only nav-style links opt into active marking (cards must never light up).
  const active = activeClassName != null && route.screen === screen;
  const cn = [className, active ? activeClassName : ""].filter(Boolean).join(" ") || undefined;

  const intentProps = intent
    ? {
        // false until the user shows intent, then null = restore default prefetch.
        prefetch: (warm ? null : false) as null | false,
        onMouseEnter: () => setWarm(true),
        onTouchStart: () => setWarm(true),
      }
    : { prefetch };

  return (
    <Link
      href={href}
      className={cn}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      {...intentProps}
      {...rest}
    >
      {children}
    </Link>
  );
}
