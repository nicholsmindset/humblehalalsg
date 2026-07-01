/* In-body editorial figure — breaks wider than the reading column, with caption.
   Server component; reuses the unoptimized-Unsplash helper (Vercel 402 dodge). */
import Image from "next/image";
import { isUnoptimizedImageSrc } from "@/lib/img";

export function ArticleFigure({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <figure className="article-fig">
      <div className="media">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width:760px) 100vw, 960px"
          unoptimized={isUnoptimizedImageSrc(src)}
          style={{ objectFit: "cover" }}
        />
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
