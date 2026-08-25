"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const ALLOWED = new Set([
  "images.unsplash.com",
  "m.media-amazon.com",
  "images-eu.ssl-images-amazon.com",
  "images-na.ssl-images-amazon.com",
  "www.hostinger.com",
]);

function hostOf(src: string): string | null {
  try {
    return new URL(src).hostname;
  } catch {
    return null;
  }
}

type ProductImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  placeholder?: "letter" | "blank";
  onError?: () => void;
};

export function ProductImage({
  src,
  alt,
  className = "",
  priority = false,
  sizes = "(min-width: 1024px) 480px, 100vw",
  placeholder = "letter",
  onError,
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  function fail() {
    setFailed(true);
    onError?.();
  }

  const frame = `relative aspect-square w-full bg-paper ${className}`;

  if (!src || failed) {
    if (placeholder === "blank") {
      return <div className={frame} />;
    }
    const mark = alt.trim().charAt(0) || "–";
    return (
      <div className={`flex aspect-square items-center justify-center bg-paper text-4xl font-semibold text-forest ${className}`} role="img" aria-label={alt}>
        {mark}
      </div>
    );
  }

  const host = hostOf(src);
  const canOptimize = Boolean(host && ALLOWED.has(host));

  if (!canOptimize) {
    return (
      <div className={frame}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          onError={fail}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 h-full w-full object-contain"
        />
      </div>
    );
  }

  return (
    <div className={frame}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-contain"
        onError={fail}
      />
    </div>
  );
}
