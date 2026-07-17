import { Icon } from "@/components/ui";
import type { HalalStatus } from "@/lib/halal-status";
import { methodLines } from "@/lib/halal-status-content";

/* Side panel: branded monogram (never a stock photo — same policy as
   BusinessMediaFallback) + "How we reached this answer" checklist. */

export function BrandMonogram({ brand, category, tone }: { brand: string; category: string; tone: string }) {
  const initials = brand
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Za-z0-9]/g, "")[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className={`hcx-monogram hcx-tone-${tone} hh-pattern`} role="img" aria-label={`${brand} — ${category}`}>
      <span className="hcx-monogram-letter">{initials}</span>
      <span className="hcx-monogram-cat">{category}</span>
    </div>
  );
}

export function MethodPanel({ status, lastChecked }: { status: HalalStatus; lastChecked: string }) {
  return (
    <div className="hcx-method card">
      <h3>How we reached this answer</h3>
      <ul>
        {methodLines(status, lastChecked).map((l) => (
          <li key={l}>
            <Icon name="check" size={15} /> <span>{l}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
