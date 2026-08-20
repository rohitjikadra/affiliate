import Image from "next/image";

const ALLOWED = new Set([
  "images.unsplash.com",
  "m.media-amazon.com",
  "images-eu.ssl-images-amazon.com",
  "images-na.ssl-images-amazon.com",
]);

function hostOf(src: string): string | null {
  try {
    return new URL(src).hostname;
  } catch {
    return null;
  }
}

export function ProductImage({
  src,
  alt,
  className = "",
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  if (!src) {
    return (
      <div className={`flex aspect-square items-center justify-center bg-neutral-50 text-5xl font-semibold text-navy ${className}`}>
        {alt.charAt(0)}
      </div>
    );
  }

  const host = hostOf(src);
  const canOptimize = Boolean(host && ALLOWED.has(host));

  if (!canOptimize) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={`aspect-square w-full object-contain ${className}`} />
    );
  }

  return (
    <div className={`relative aspect-square w-full ${className}`}>
      <Image src={src} alt={alt} fill className="object-contain" sizes="(min-width: 1024px) 480px, 100vw" />
    </div>
  );
}
