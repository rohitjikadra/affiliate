"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/types/product";
import type { Product, ProductCategory } from "@/types/product";
import {
  slugifyTitle,
  toProductPayload,
  validateProductForm,
  type ProductFormValues,
} from "@/lib/product-form";
import { createProduct, updateProduct } from "@/lib/api";

type ProductFormProps = {
  mode: "create" | "edit";
  categories: ProductCategory[];
  product?: Product;
};

const emptyValues: ProductFormValues = {
  title: "",
  slug: "",
  description: "",
  imageUrl: "",
  price: "",
  originalPrice: "",
  rating: "",
  currency: "INR",
  affiliateUrl: "",
  source: "MANUAL",
  sourceId: "",
  featured: false,
  isActive: true,
  categoryId: "",
};

function valuesFromProduct(product: Product): ProductFormValues {
  return {
    title: product.title,
    slug: product.slug,
    description: product.description ?? "",
    imageUrl: product.imageUrl ?? "",
    price: product.price,
    originalPrice: product.originalPrice ?? "",
    rating: product.rating ?? "",
    currency: product.currency,
    affiliateUrl: product.affiliateUrl ?? "",
    source: product.source,
    sourceId: product.sourceId ?? "",
    featured: product.featured,
    isActive: product.isActive,
    categoryId: product.categoryId ?? "",
  };
}

export function ProductForm({ mode, categories, product }: ProductFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>(
    product ? valuesFromProduct(product) : emptyValues,
  );
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slugTouched) {
      setValues((current) => ({ ...current, slug: slugifyTitle(current.title) }));
    }
  }, [values.title, slugTouched]);

  const imagePreview = useMemo(() => values.imageUrl.trim(), [values.imageUrl]);

  function updateField<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateProductForm(values);
    setErrors(nextErrors);
    setFormError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      const payload = toProductPayload(values);
      if (mode === "create") {
        await createProduct(payload);
      } else if (product) {
        await updateProduct(product.id, payload);
      }
      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError) {
        const fieldErrors: Record<string, string> = {};
        for (const detail of error.details ?? []) {
          if (detail.path) {
            fieldErrors[detail.path] = detail.message;
          }
        }
        setErrors(fieldErrors);
        setFormError(error.message);
      } else {
        setFormError("Could not save the product. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {formError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Title" error={errors.title} required>
          <input
            value={values.title}
            onChange={(event) => updateField("title", event.target.value)}
            className={inputClass}
            maxLength={200}
          />
        </Field>
        <Field label="Slug" error={errors.slug}>
          <input
            value={values.slug}
            onChange={(event) => {
              setSlugTouched(true);
              updateField("slug", event.target.value);
            }}
            className={inputClass}
            placeholder="auto-generated-from-title"
          />
        </Field>
        <Field label="Price" error={errors.price} required>
          <input
            type="number"
            min="0"
            step="0.01"
            value={values.price}
            onChange={(event) => updateField("price", event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Original price" error={errors.originalPrice}>
          <input
            type="number"
            min="0"
            step="0.01"
            value={values.originalPrice}
            onChange={(event) => updateField("originalPrice", event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Rating (0-5)" error={errors.rating}>
          <input
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={values.rating}
            onChange={(event) => updateField("rating", event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Currency" error={errors.currency} required>
          <input
            value={values.currency}
            onChange={(event) => updateField("currency", event.target.value.toUpperCase())}
            className={inputClass}
            maxLength={3}
          />
        </Field>
        <Field label="Category" error={errors.categoryId}>
          <select
            value={values.categoryId}
            onChange={(event) => updateField("categoryId", event.target.value)}
            className={inputClass}
          >
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Source" error={errors.source}>
          <select
            value={values.source}
            onChange={(event) => updateField("source", event.target.value as ProductFormValues["source"])}
            className={inputClass}
          >
            <option value="MANUAL">Manual</option>
            <option value="AMAZON">Amazon</option>
            <option value="FLIPKART">Flipkart</option>
          </select>
        </Field>
        <Field label="Image URL" error={errors.imageUrl}>
          <input
            value={values.imageUrl}
            onChange={(event) => updateField("imageUrl", event.target.value)}
            className={inputClass}
            placeholder="https://example.com/product.jpg"
          />
        </Field>
        <Field label="Affiliate URL" error={errors.affiliateUrl}>
          <input
            value={values.affiliateUrl}
            onChange={(event) => updateField("affiliateUrl", event.target.value)}
            className={inputClass}
            placeholder="https://"
          />
        </Field>
        <Field label="Source ID" error={errors.sourceId}>
          <input
            value={values.sourceId}
            onChange={(event) => updateField("sourceId", event.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      {imagePreview ? (
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Image preview</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagePreview}
            alt="Product preview"
            className="h-40 w-full max-w-md rounded-xl border border-slate-200 object-cover"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        </div>
      ) : null}

      <Field label="Description" error={errors.description}>
        <textarea
          value={values.description}
          onChange={(event) => updateField("description", event.target.value)}
          className={`${inputClass} min-h-28`}
          maxLength={5000}
        />
      </Field>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={values.featured}
            onChange={(event) => updateField("featured", event.target.checked)}
          />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={values.isActive}
            onChange={(event) => updateField("isActive", event.target.checked)}
          />
          Active
        </label>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {submitting ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20";

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {required ? <span className="text-red-600"> *</span> : null}
      {children}
      {error ? <span className="mt-1 block text-xs font-normal text-red-600">{error}</span> : null}
    </label>
  );
}
