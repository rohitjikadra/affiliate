"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/types/product";
import type { Product, ProductCategory } from "@/types/product";
import {
  slugifyTitle,
  specsToText,
  scoreBreakdownToText,
  imageUrlsToText,
  textToImageUrls,
  toProductPayload,
  validateProductForm,
  type ProductFormValues,
} from "@/lib/product-form";
import { createProduct, publishProduct, updateProduct } from "@/lib/api";
import { amazonTagWarning } from "@/lib/amazon";
import { redirectToLogin } from "@/lib/admin";
import { revalidateShop } from "@/lib/revalidate-shop";

type ProductFormProps = {
  mode: "create" | "edit";
  categories: ProductCategory[];
  product?: Product;
  amazonAssociateTag?: string | null;
};

const emptyValues: ProductFormValues = {
  title: "",
  slug: "",
  description: "",
  features: "",
  pros: "",
  cons: "",
  bestFor: "",
  faq: "",
  brand: "",
  modelNumber: "",
  whoShouldAvoid: "",
  warranty: "",
  specs: "",
  scoreBreakdown: "",
  images: "",
  price: "",
  originalPrice: "",
  ourScore: "",
  currency: "INR",
  affiliateUrl: "",
  source: "MANUAL",
  sourceId: "",
  seoTitle: "",
  seoDescription: "",
  featured: false,
  isActive: true,
  status: "PUBLISHED",
  categoryId: "",
};

function valuesFromProduct(product: Product): ProductFormValues {
  return {
    title: product.title,
    slug: product.slug,
    description: product.description ?? "",
    features: product.features ?? "",
    pros: product.pros ?? "",
    cons: product.cons ?? "",
    bestFor: product.bestFor ?? "",
    faq: product.faq ?? "",
    brand: product.brand ?? "",
    modelNumber: product.modelNumber ?? "",
    whoShouldAvoid: product.whoShouldAvoid ?? "",
    warranty: product.warranty ?? "",
    specs: specsToText(product.specs),
    scoreBreakdown: scoreBreakdownToText(product.scoreBreakdown),
    images: imageUrlsToText(product.images, product.imageUrl),
    price: product.price ?? "",
    originalPrice: product.originalPrice ?? "",
    ourScore: product.ourScore ?? "",
    currency: product.currency,
    affiliateUrl: product.affiliateUrl ?? "",
    source: product.source,
    sourceId: product.sourceId ?? "",
    seoTitle: product.seoTitle ?? "",
    seoDescription: product.seoDescription ?? "",
    featured: product.featured,
    isActive: product.isActive,
    status: product.status,
    categoryId: product.categoryId ?? "",
  };
}

export function ProductForm({
  mode,
  categories,
  product,
  amazonAssociateTag = null,
}: ProductFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>(
    product ? valuesFromProduct(product) : emptyValues,
  );
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!slugTouched) {
      setValues((current) => ({ ...current, slug: slugifyTitle(current.title) }));
    }
  }, [values.title, slugTouched]);

  const imagePreviews = useMemo(() => textToImageUrls(values.images), [values.images]);
  const tagWarning = useMemo(
    () => amazonTagWarning(values.affiliateUrl, values.source, amazonAssociateTag),
    [values.affiliateUrl, values.source, amazonAssociateTag],
  );

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
      await revalidateShop(["/products", `/products/${values.slug.trim() || product?.slug || ""}`]);
      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        redirectToLogin();
        return;
      }
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

  async function onPublish() {
    if (!product) {
      return;
    }
    setPublishing(true);
    setFormError("");
    try {
      await publishProduct(product.id);
      await revalidateShop(["/products", `/products/${product.slug}`]);
      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        redirectToLogin();
        return;
      }
      setFormError(error instanceof ApiError ? error.message : "Could not publish this product.");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-md border border-neutral-200 bg-white p-5 shadow-sm">
      {formError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p>
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
        <Field label="Brand" error={errors.brand}>
          <input
            value={values.brand}
            onChange={(event) => updateField("brand", event.target.value)}
            className={inputClass}
            maxLength={80}
          />
        </Field>
        <Field label="Model number" error={errors.modelNumber} hint="Shown on the product page and used in search.">
          <input
            value={values.modelNumber}
            onChange={(event) => updateField("modelNumber", event.target.value)}
            className={inputClass}
            maxLength={80}
          />
        </Field>
        <Field label="Fallback price" error={errors.price} hint="Optional. Live price belongs on the Amazon offer below.">
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
        <Field label="Our Score (0-10)" error={errors.ourScore} hint="Editorial score. Not a customer or Amazon rating.">
          <input
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={values.ourScore}
            onChange={(event) => updateField("ourScore", event.target.value)}
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
        <Field
          label="Image URLs"
          error={errors.images}
          hint="One https URL per line. First image is the cover. Up to 12."
        >
          <textarea
            value={values.images}
            onChange={(event) => updateField("images", event.target.value)}
            className={`${inputClass} min-h-24`}
            placeholder="https://m.media-amazon.com/images/P/ASIN.jpg"
          />
        </Field>
        <Field
          label="Legacy affiliate URL"
          error={errors.affiliateUrl}
          hint="Prefer a merchant offer. This is only used if the product has no offers."
          warning={tagWarning}
        >
          <input
            value={values.affiliateUrl}
            onChange={(event) => updateField("affiliateUrl", event.target.value)}
            className={inputClass}
            placeholder="https://www.amazon.in/dp/...?tag=yourid-21"
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

      {imagePreviews.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-medium text-neutral-700">Image preview</p>
          <div className="flex flex-wrap gap-2">
            {imagePreviews.map((src, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${src}-${index}`}
                src={src}
                alt=""
                className="h-24 w-24 rounded-md border border-neutral-200 object-contain"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ))}
          </div>
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

      <Field
        label="About this item"
        error={errors.features}
        hint="Amazon-style feature bullets. One point per line. Up to 12."
      >
        <textarea
          value={values.features}
          onChange={(event) => updateField("features", event.target.value)}
          className={`${inputClass} min-h-28`}
          maxLength={4000}
          placeholder={"Non-stick grill plates\nMakes two sandwiches at a time\n800W heating"}
        />
      </Field>

      <Field label="Best for" error={errors.bestFor}>
        <input
          value={values.bestFor}
          onChange={(event) => updateField("bestFor", event.target.value)}
          className={inputClass}
          maxLength={500}
        />
      </Field>

      <Field
        label="Who should avoid"
        error={errors.whoShouldAvoid}
        hint="Honest limits: noise, wattage, capacity, or cookware. Shown on the product page, compare table, and best-of lists."
      >
        <textarea
          value={values.whoShouldAvoid}
          onChange={(event) => updateField("whoShouldAvoid", event.target.value)}
          className={`${inputClass} min-h-20`}
          maxLength={2000}
        />
      </Field>

      <Field label="Warranty" error={errors.warranty} hint="Only from the manufacturer or listing. Leave blank if unverified.">
        <input
          value={values.warranty}
          onChange={(event) => updateField("warranty", event.target.value)}
          className={inputClass}
          maxLength={160}
        />
      </Field>

      <Field label="Key specifications" error={errors.specs} hint="One per line, like Wattage: 750 W">
        <textarea
          value={values.specs}
          onChange={(event) => updateField("specs", event.target.value)}
          className={`${inputClass} min-h-28`}
        />
      </Field>

      <Field
        label="Score breakdown"
        error={errors.scoreBreakdown}
        hint="Editorial factors, one per line, like Motor: 8.2"
      >
        <textarea
          value={values.scoreBreakdown}
          onChange={(event) => updateField("scoreBreakdown", event.target.value)}
          className={`${inputClass} min-h-24`}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Pros" error={errors.pros} hint="One point per line.">
          <textarea
            value={values.pros}
            onChange={(event) => updateField("pros", event.target.value)}
            className={`${inputClass} min-h-28`}
            maxLength={4000}
          />
        </Field>
        <Field label="Cons" error={errors.cons} hint="One point per line.">
          <textarea
            value={values.cons}
            onChange={(event) => updateField("cons", event.target.value)}
            className={`${inputClass} min-h-28`}
            maxLength={4000}
          />
        </Field>
      </div>

      <Field
        label="FAQ"
        error={errors.faq}
        hint="Alternate paragraphs: question, then answer. Used for FAQ structured data."
      >
        <textarea
          value={values.faq}
          onChange={(event) => updateField("faq", event.target.value)}
          className={`${inputClass} min-h-28`}
          maxLength={8000}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="SEO title" error={errors.seoTitle} hint="Optional. Defaults to the product title.">
          <input
            value={values.seoTitle}
            onChange={(event) => updateField("seoTitle", event.target.value)}
            className={inputClass}
            maxLength={120}
          />
        </Field>
        <Field label="SEO description" error={errors.seoDescription}>
          <textarea
            value={values.seoDescription}
            onChange={(event) => updateField("seoDescription", event.target.value)}
            className={`${inputClass} min-h-20`}
            maxLength={300}
          />
        </Field>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={values.featured}
            onChange={(event) => updateField("featured", event.target.checked)}
          />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={values.isActive}
            onChange={(event) => updateField("isActive", event.target.checked)}
          />
          Active
        </label>
      </div>
      <label className="block max-w-xs text-sm font-medium text-neutral-700">
        Catalog status
        <select
          value={values.status}
          onChange={(event) => updateField("status", event.target.value as ProductFormValues["status"])}
          className={inputClass}
        >
          <option value="DRAFT">Draft</option>
          <option value="REVIEW">Review</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <span className="mt-1 block text-xs font-normal text-neutral-500">
          Imports stay Draft until you publish. Shoppers only see Published + Active products.
        </span>
      </label>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting || publishing}
          className="rounded-md bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {submitting ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
        </button>
        {mode === "edit" && product && product.status !== "PUBLISHED" ? (
          <button
            type="button"
            disabled={submitting || publishing}
            onClick={() => void onPublish()}
            className="rounded-md border border-navy px-5 py-2.5 text-sm font-semibold text-navy hover:bg-mist disabled:opacity-60"
          >
            {publishing ? "Publishing…" : "Publish to shop"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-navy";

function Field({
  label,
  error,
  warning,
  hint,
  required,
  children,
}: {
  label: string;
  error?: string;
  warning?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-neutral-700">
      {label}
      {required ? <span className="text-red-600"> *</span> : null}
      {children}
      {hint ? <span className="mt-1 block text-xs font-normal text-neutral-500">{hint}</span> : null}
      {warning ? <span className="mt-1 block text-xs font-normal text-amber-700">{warning}</span> : null}
      {error ? <span className="mt-1 block text-xs font-normal text-red-600">{error}</span> : null}
    </label>
  );
}
