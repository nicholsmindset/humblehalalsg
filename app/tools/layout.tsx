import type { ReactNode } from "react";
// Route-scoped: tools.css (~52KB) loads only on /tools/** instead of every
// route. Its rules are tools-prefixed or tool-container-scoped; the few classes
// it shared with the global chrome / travel vertical (.prayer-next, .prayer-foot,
// .prayer-row, .qibla-dial, .tool-card-ico) are covered by their intended global
// sheets (moat.css / travel.css / hawker.css), so scoping tools.css removes the
// accidental global bleed that moat.css previously had to !important around.
import "../../styles/tools.css";

export default function ToolsLayout({ children }: { children: ReactNode }) {
  return children;
}
