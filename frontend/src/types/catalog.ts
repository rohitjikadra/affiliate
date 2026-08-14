export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  productCount: number;
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  currency: "INR";
  categorySlug: string;
  categoryName: string;
  featured: boolean;
  rating: number;
  accent: string;
};
