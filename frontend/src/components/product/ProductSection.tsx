import type { ReactNode } from "react";

type ProductSectionProps = {
  id?: string;
  title?: string;
  children: ReactNode;
  className?: string;
};

export function ProductSection({ id, title, children, className = "" }: ProductSectionProps) {
  return (
    <section id={id} className={`product-section ${className}`}>
      {title ? <h2 className="product-section-title">{title}</h2> : null}
      {children}
    </section>
  );
}
