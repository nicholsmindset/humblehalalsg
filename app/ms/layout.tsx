/**
 * Next only permits the document <html> element in the root layout. Set its
 * language immediately for this standalone Malay route tree; each page also
 * retains a server-rendered `lang="ms"` content wrapper.
 */
export default function MalayLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: "document.documentElement.lang='ms'" }} />
      <div lang="ms">{children}</div>
    </>
  );
}
