// Browser-safe next/dynamic stand-in backed by React.lazy.
import * as React from "react";

type Loader = () => Promise<{ default: React.ComponentType<unknown> } | React.ComponentType<unknown>>;

export default function dynamic(loader: Loader, opts?: { loading?: React.ComponentType; ssr?: boolean }) {
  const Lazy = React.lazy(() =>
    Promise.resolve(loader()).then((m) => ("default" in (m as object) ? (m as { default: React.ComponentType<unknown> }) : { default: m as React.ComponentType<unknown> })),
  );
  return function DynamicStub(props: Record<string, unknown>) {
    const fallback = opts?.loading ? React.createElement(opts.loading) : null;
    return (
      <React.Suspense fallback={fallback}>
        <Lazy {...props} />
      </React.Suspense>
    );
  };
}
