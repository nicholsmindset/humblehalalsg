// Browser-safe next/navigation stand-in: no app router exists in the DS
// rendering environment, so hooks return inert defaults instead of throwing.
const noop = () => {};

export function useRouter() {
  return {
    push: noop,
    replace: noop,
    back: noop,
    forward: noop,
    refresh: noop,
    prefetch: async () => {},
  };
}

export function usePathname(): string {
  return typeof window !== "undefined" ? window.location.pathname : "/";
}

export function useSearchParams(): URLSearchParams {
  return new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
}

export function useParams(): Record<string, string> {
  return {};
}

export function useSelectedLayoutSegment(): string | null {
  return null;
}

export function useSelectedLayoutSegments(): string[] {
  return [];
}

export function redirect(url: string): never {
  throw new Error(`redirect(${url}) called outside a Next.js runtime`);
}

export function notFound(): never {
  throw new Error("notFound() called outside a Next.js runtime");
}
