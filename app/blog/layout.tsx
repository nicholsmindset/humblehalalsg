import type { ReactNode } from "react";
// Route-scoped: blog.css (~19KB) loads only on /blog/** instead of every route.
// Its classes are used only within the blog vertical (verified).
import "../../styles/blog.css";

export default function BlogLayout({ children }: { children: ReactNode }) {
  return children;
}
