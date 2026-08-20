"use client";

import { useState } from "react";
import { ProductImage } from "@/components/media/ProductImage";

export function ProductGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [index, setIndex] = useState(0);
  const current = images[index] ?? null;

  return (
    <div>
      <ProductImage src={current} alt={alt} />
      {images.length > 1 ? (
        <ul className="mt-3 grid grid-cols-5 gap-2">
          {images.map((src, imageIndex) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setIndex(imageIndex)}
                aria-pressed={imageIndex === index}
                aria-label={`Image ${imageIndex + 1}`}
                className={`block w-full overflow-hidden rounded-md border ${
                  imageIndex === index ? "border-navy ring-1 ring-navy" : "border-neutral-200"
                }`}
              >
                <ProductImage src={src} alt="" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
