"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Props = {
  slug: string;
  fallbackSrc: string;
  alt: string;
};

export function PlaceCardImage({ slug, fallbackSrc, alt }: Props) {
  const [src, setSrc] = useState(fallbackSrc);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(`/api/place-media/${slug}`);
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { heroImageUrl?: string | null };
        if (!cancelled && data.heroImageUrl) {
          setSrc(data.heroImageUrl);
        }
      } catch {
        // Keep the seeded fallback image if the real-photo lookup fails.
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover"
      sizes="(max-width: 768px) 100vw, 33vw"
      unoptimized
    />
  );
}
