// Browser-safe next/image stand-in: renders a plain <img>, honoring fill
// layout so cards keep their cover-image geometry.
import * as React from "react";

type Props = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string | { src: string };
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  unoptimized?: boolean;
  placeholder?: string;
  blurDataURL?: string;
  sizes?: string;
  loader?: unknown;
};

const Image = React.forwardRef<HTMLImageElement, Props>(function Image(
  { src, fill, priority, quality, unoptimized, placeholder, blurDataURL, loader, style, ...rest },
  ref,
) {
  const resolved = typeof src === "string" ? src : src?.src;
  const fillStyle: React.CSSProperties | undefined = fill
    ? { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: (style as React.CSSProperties)?.objectFit ?? "cover" }
    : undefined;
  return <img ref={ref} src={resolved} style={{ ...fillStyle, ...style }} {...rest} />;
});

export default Image;
