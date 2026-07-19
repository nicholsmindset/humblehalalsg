import type { ReactNode } from "react";
// Route-scoped: hawker.css (~6KB) loads only on /hawker/** instead of every
// route. Its .hk-* classes are used only within the hawker vertical (verified
// by cross-reference grep). The `.tool-card-ico` base still comes from the
// global tools.css.
import "../../styles/hawker.css";

export default function HawkerLayout({ children }: { children: ReactNode }) {
  return children;
}
