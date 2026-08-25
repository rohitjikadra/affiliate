"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ProductImage } from "@/components/media/ProductImage";

function resolveImages(images: string[], imageUrl?: string | null): string[] {
  const seen = new Set<string>();
  const resolved: string[] = [];

  for (const value of [...images, imageUrl ?? ""]) {
    const src = value.trim();
    if (!src || seen.has(src) || !/^https?:\/\//i.test(src)) {
      continue;
    }
    seen.add(src);
    resolved.push(src);
  }

  return resolved;
}

type ProductGalleryProps = {
  images: string[];
  imageUrl?: string | null;
  alt: string;
};

export function ProductGallery({ images, imageUrl, alt }: ProductGalleryProps) {
  const sources = resolveImages(images, imageUrl);
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stripDriven = useRef(false);
  const usable = sources.filter((src) => !failed.has(src));
  const current = usable[index] ?? null;
  const multiple = usable.length > 1;
  const showDots = multiple && usable.length <= 8;

  const step = useCallback(
    (delta: number) => {
      setIndex((currentIndex) => {
        if (usable.length < 2) {
          return currentIndex;
        }
        return (currentIndex + delta + usable.length) % usable.length;
      });
    },
    [usable.length],
  );

  const goTo = useCallback((next: number) => {
    setIndex((currentIndex) => {
      if (usable.length === 0) {
        return currentIndex;
      }
      return (next + usable.length) % usable.length;
    });
  }, [usable.length]);

  function markFailed(src: string) {
    setFailed((currentFailed) => {
      if (currentFailed.has(src)) {
        return currentFailed;
      }
      const next = new Set(currentFailed);
      next.add(src);
      return next;
    });
  }

  useEffect(() => {
    if (index >= usable.length) {
      setIndex(Math.max(0, usable.length - 1));
    }
  }, [index, usable.length]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (lightbox && !dialog.open) {
      dialog.showModal();
    }
    if (!lightbox && dialog.open) {
      dialog.close();
    }
  }, [lightbox]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !multiple) {
      return;
    }
    if (stripDriven.current) {
      stripDriven.current = false;
      return;
    }
    const slide = scroller.children[index] as HTMLElement | undefined;
    if (!slide) {
      return;
    }
    const target = slide.offsetLeft;
    if (Math.abs(scroller.scrollLeft - target) > 8) {
      scroller.scrollTo({ left: target, behavior: "smooth" });
    }
  }, [index, multiple]);

  useEffect(() => {
    if (!lightbox) {
      return;
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, step]);

  function onStripScroll() {
    const scroller = scrollerRef.current;
    if (!scroller || scroller.clientWidth === 0) {
      return;
    }
    const next = Math.round(scroller.scrollLeft / scroller.clientWidth);
    if (next !== index && next >= 0 && next < usable.length) {
      stripDriven.current = true;
      setIndex(next);
    }
  }

  if (usable.length === 0) {
    return <ProductImage src={null} alt={alt} />;
  }

  const counter = `${index + 1} / ${usable.length}`;

  return (
    <div
      className="flex flex-col gap-3 lg:flex-row"
      role="region"
      aria-label={`${alt} images`}
      tabIndex={multiple ? 0 : undefined}
      onKeyDown={(event) => {
        if (lightbox || !multiple) {
          return;
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          step(1);
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          step(-1);
        }
      }}
    >
      {multiple ? (
        <ul className="hidden max-h-[min(32rem,70vw)] w-20 shrink-0 flex-col gap-2 overflow-y-auto lg:flex">
          {usable.map((src, imageIndex) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => goTo(imageIndex)}
                aria-label={`Show image ${imageIndex + 1} of ${usable.length}`}
                aria-current={imageIndex === index ? "true" : undefined}
                className={`block w-full overflow-hidden rounded-md border bg-paper ${
                  imageIndex === index ? "border-forest ring-1 ring-forest" : "border-line"
                }`}
              >
                <ProductImage
                  src={src}
                  alt=""
                  sizes="80px"
                  placeholder="blank"
                  onError={() => markFailed(src)}
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="relative hidden min-w-0 flex-1 lg:block">
        <button
          type="button"
          onClick={() => setLightbox(true)}
          aria-label={`View larger image, ${counter}`}
          className="block w-full overflow-hidden rounded-md bg-paper"
        >
          <ProductImage
            src={current}
            alt={alt}
            priority={index === 0}
            sizes="(min-width: 1024px) 520px, 100vw"
            placeholder="blank"
            onError={() => current && markFailed(current)}
          />
        </button>
        {multiple ? (
          <>
            <NavButton label="Previous image" side="left" onClick={() => step(-1)} />
            <NavButton label="Next image" side="right" onClick={() => step(1)} />
            <p className="pointer-events-none absolute right-3 bottom-3 rounded-md bg-ink/70 px-2 py-1 text-xs font-medium text-white tabular-nums">
              {counter}
            </p>
          </>
        ) : null}
      </div>

      <div className="lg:hidden">
        <div
          ref={scrollerRef}
          className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain touch-pan-x"
          onScroll={onStripScroll}
        >
          {usable.map((src, imageIndex) => (
            <div key={src} className="w-full min-w-full shrink-0 basis-full snap-start">
              <button
                type="button"
                onClick={() => setLightbox(true)}
                aria-label={`View larger image, ${imageIndex + 1} of ${usable.length}`}
                className="block w-full overflow-hidden rounded-md bg-paper"
              >
                <ProductImage
                  src={src}
                  alt={imageIndex === index ? alt : ""}
                  priority={imageIndex === 0}
                  sizes="100vw"
                  placeholder="blank"
                  onError={() => markFailed(src)}
                />
              </button>
            </div>
          ))}
        </div>
        {multiple ? (
          <div className="mt-3 flex items-center justify-center gap-3">
            {showDots ? (
              <div className="flex gap-1.5">
                {usable.map((src, imageIndex) => (
                  <button
                    key={src}
                    type="button"
                    aria-label={`Go to image ${imageIndex + 1}`}
                    onClick={() => goTo(imageIndex)}
                    className={`h-1.5 rounded-full ${imageIndex === index ? "w-4 bg-forest" : "w-1.5 bg-line"}`}
                  />
                ))}
              </div>
            ) : null}
            <p className="text-xs font-medium tabular-nums text-ink-muted">{counter}</p>
          </div>
        ) : null}
      </div>

      <p className="sr-only" aria-live="polite">
        {multiple ? `Image ${index + 1} of ${usable.length}` : alt}
      </p>

      <dialog
        ref={dialogRef}
        className="gallery-lightbox m-0 h-full max-h-none w-full max-w-none border-0 bg-ink/95 p-4 text-white"
        aria-label={`${alt} lightbox`}
        onClose={() => setLightbox(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            setLightbox(false);
          }
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-white/80">{multiple ? counter : alt}</p>
            <button
              type="button"
              onClick={() => setLightbox(false)}
              className="rounded-md border border-white/20 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10"
            >
              Close
            </button>
          </div>
          <div className="relative mx-auto flex min-h-0 w-full max-w-[min(80vh,56rem)] flex-1 items-center justify-center py-4">
            <ProductImage
              src={current}
              alt={alt}
              sizes="100vw"
              placeholder="blank"
              className="bg-transparent"
              onError={() => current && markFailed(current)}
            />
            {multiple ? (
              <>
                <NavButton label="Previous image" side="left" onClick={() => step(-1)} light />
                <NavButton label="Next image" side="right" onClick={() => step(1)} light />
              </>
            ) : null}
          </div>
        </div>
      </dialog>
    </div>
  );
}

function NavButton({
  label,
  side,
  onClick,
  light = false,
}: {
  label: string;
  side: "left" | "right";
  onClick: () => void;
  light?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={`absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-lg ${
        side === "left" ? "left-2" : "right-2"
      } ${light ? "bg-white/15 text-white hover:bg-white/25" : "bg-surface/90 text-ink shadow-hairline hover:bg-surface"}`}
    >
      {side === "left" ? "‹" : "›"}
    </button>
  );
}
