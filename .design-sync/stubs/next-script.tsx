// next/script stand-in: third-party scripts have no place in DS previews or
// rendered designs — renders nothing.
export default function Script(_props: Record<string, unknown>) {
  return null;
}
