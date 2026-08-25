"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/types/product";
import type { ProductCategory } from "@/types/product";
import type { Guide } from "@/types/guide";
import {
  slugifyTitle,
  toGuidePayload,
  validateGuideForm,
  type GuideFormValues,
} from "@/lib/guide-form";
import { createGuide, updateGuide } from "@/lib/api";
import { redirectToLogin } from "@/lib/admin";
import { revalidateShop } from "@/lib/revalidate-shop";

type GuideFormProps = {
  mode: "create" | "edit";
  categories: ProductCategory[];
  guide?: Guide;
};

const emptyValues: GuideFormValues = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  kind: "ARTICLE",
  published: false,
  methodology: "",
  seoTitle: "",
  seoDescription: "",
  categoryId: "",
  relatedProductIds: "",
};

function valuesFromGuide(guide: Guide): GuideFormValues {
  return {
    title: guide.title,
    slug: guide.slug,
    excerpt: guide.excerpt ?? "",
    body: guide.body,
    kind: guide.kind,
    published: guide.published,
    methodology: guide.methodology ?? "",
    seoTitle: guide.seoTitle ?? "",
    seoDescription: guide.seoDescription ?? "",
    categoryId: guide.categoryId ?? "",
    relatedProductIds: (guide.products ?? []).map((item) => item.product.id).join("\n"),
  };
}

export function GuideForm({ mode, categories, guide }: GuideFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<GuideFormValues>(guide ? valuesFromGuide(guide) : emptyValues);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slugTouched) {
      setValues((current) => ({ ...current, slug: slugifyTitle(current.title) }));
    }
  }, [values.title, slugTouched]);

  function updateField<K extends keyof GuideFormValues>(key: K, value: GuideFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateGuideForm(values);
    setErrors(nextErrors);
    setFormError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      const payload = toGuidePayload(values);
      if (mode === "create") {
        await createGuide(payload);
      } else if (guide) {
        await updateGuide(guide.id, payload);
      }
      const prefix = values.kind === "BEST_OF" ? "/best" : "/guides";
      await revalidateShop(["/guides", "/best", `${prefix}/${values.slug.trim() || guide?.slug || ""}`]);
      router.push("/admin/guides");
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
        setFormError("Could not save the guide. Try again.");
      }
    } finally {
      setSubmitting(false);
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
        <Field label="Kind">
          <select
            value={values.kind}
            onChange={(event) => updateField("kind", event.target.value as GuideFormValues["kind"])}
            className={inputClass}
          >
            <option value="ARTICLE">Article (/guides)</option>
            <option value="BEST_OF">Best-of (/best)</option>
          </select>
        </Field>
      </div>

      <Field label="Excerpt" error={errors.excerpt} hint="Short summary shown on the guides index.">
        <textarea
          value={values.excerpt}
          onChange={(event) => updateField("excerpt", event.target.value)}
          className={`${inputClass} min-h-20`}
          maxLength={500}
        />
      </Field>

      <Field label="Body (Markdown)" error={errors.body} required>
        <textarea
          value={values.body}
          onChange={(event) => updateField("body", event.target.value)}
          className={`${inputClass} min-h-64 font-mono`}
          maxLength={50000}
        />
      </Field>

      <Field
        label="Related product IDs"
        hint="One product id per line. First becomes Best overall on best-of pages."
      >
        <textarea
          value={values.relatedProductIds}
          onChange={(event) => updateField("relatedProductIds", event.target.value)}
          className={`${inputClass} min-h-24 font-mono`}
        />
      </Field>

      <Field label="Ranking methodology" hint="Shown on best-of pages. Be honest about how you ranked.">
        <textarea
          value={values.methodology}
          onChange={(event) => updateField("methodology", event.target.value)}
          className={`${inputClass} min-h-20`}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="SEO title">
          <input
            value={values.seoTitle}
            onChange={(event) => updateField("seoTitle", event.target.value)}
            className={inputClass}
            maxLength={120}
          />
        </Field>
        <Field label="SEO description">
          <textarea
            value={values.seoDescription}
            onChange={(event) => updateField("seoDescription", event.target.value)}
            className={`${inputClass} min-h-20`}
            maxLength={300}
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={values.published}
          onChange={(event) => updateField("published", event.target.checked)}
        />
        Published
      </label>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {submitting ? "Saving…" : mode === "create" ? "Create guide" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/guides")}
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
  hint,
  required,
  children,
}: {
  label: string;
  error?: string;
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
      {error ? <span className="mt-1 block text-xs font-normal text-red-600">{error}</span> : null}
    </label>
  );
}
