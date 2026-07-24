// Browser-safe next/link stand-in for the DS bundle: claude.ai/design renders
// components without a Next runtime, so Link degrades to a plain anchor.
import * as React from "react";

type Href = string | { pathname?: string; query?: Record<string, string | number | undefined>; hash?: string };

function hrefToString(href: Href): string {
  if (typeof href === "string") return href;
  const q = href.query
    ? "?" + Object.entries(href.query)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&")
    : "";
  return `${href.pathname ?? ""}${q}${href.hash ? `#${href.hash}` : ""}`;
}

const Link = React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: Href;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  legacyBehavior?: boolean;
}>(function Link({ href, prefetch, replace, scroll, shallow, legacyBehavior, children, ...rest }, ref) {
  return (
    <a ref={ref} href={hrefToString(href)} {...rest}>
      {children}
    </a>
  );
});

export default Link;
