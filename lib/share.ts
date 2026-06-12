/* Web Share API with clipboard fallback. */
export async function shareOrCopy(data: {
  title: string;
  text?: string;
  path: string;
}): Promise<"shared" | "copied" | "failed"> {
  const url = typeof window !== "undefined" ? window.location.origin + data.path : data.path;
  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ title: data.title, text: data.text, url });
      return "shared";
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      return "copied";
    }
  } catch {
    return "failed";
  }
  return "failed";
}
