"use client";

import { useApp } from "./app-context";
import { Icon } from "./ui";

export interface Crumb {
  name: string;
  screen?: string;
  params?: Record<string, unknown>;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const { navigate } = useApp();
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i}>
              {last || (!c.screen && !c.href) ? (
                <span aria-current={last ? "page" : undefined}>{c.name}</span>
              ) : (
                <a
                  href={c.href || "#"}
                  onClick={(e) => {
                    e.preventDefault();
                    if (c.screen) navigate(c.screen, c.params || {});
                  }}
                >
                  {c.name}
                </a>
              )}
              {!last && <Icon name="chevron" size={13} className="bc-sep" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
