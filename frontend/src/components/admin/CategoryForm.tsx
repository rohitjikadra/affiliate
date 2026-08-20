"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/types/product";
import type { ProductCategory } from "@/types/product";
import {
  slugifyTitle,
  toCategoryPayload,
  validateCategoryForm,
  type CategoryFormValues,
} from "@/lib/category-form";
import { createCategory, updateCategory } from "@/lib/api";
import { redirectToLogin } from "@/lib/admin";
import { revalidateShop } from "@/lib/revalidate-shop";

type CategoryFormProps = {
  mode: "create" | "edit";
  category?: ProductCategory;
};

const emptyValues: CategoryFormValues = {
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
};

function valuesFromCategory(category: ProductCategory): CategoryFormValues {
  return {
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    imageUrl: category.imageUrl ?? "",
  };
}

export function CategoryForm({ mode, category }: CategoryFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<CategoryFormValues>(
    category ? valuesFromCategory(category) : emptyValues,
  );
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slugTouched) {
      setValues((current) => ({ ...current, slug: slugifyTitle(current.name) }));
    }
  }, [values.name, slugTouched]);

  function updateField<K extends keyof CategoryFormValues>(key: K, value: CategoryFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateCategoryForm(values);
    setErrors(nextErrors);
    setFormError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      const payload = toCategoryPayload(values);
      if (mode === "create") {
        await createCategory(payload);
      } else if (category) {
        await updateCategory(category.id, payload);
      }
      await revalidateShop(["/", `/categories/${values.slug.trim() || category?.slug || ""}`]);
      router.push("/admin/categories");
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
        setFormError("Could not save the category. Try again.");
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
        <Field label="Name" error={errors.name} required>
          <input
            value={values.name}
            onChange={(event) => updateField("name", event.target.value)}
            className={inputClass}
            maxLength={120}
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
            placeholder="auto-generated-from-name"
          />
        </Field>
        <Field label="Image URL" error={errors.imageUrl}>
          <input
            value={values.imageUrl}
            onChange={(event) => updateField("imageUrl", event.target.value)}
            className={inputClass}
            placeholder="https://example.com/category.jpg"
          />
        </Field>
      </div>

      <Field label="Description" error={errors.description}>
        <textarea
          value={values.description}
          onChange={(event) => updateField("description", event.target.value)}
          className={`${inputClass} min-h-28`}
          maxLength={1000}
        />
      </Field>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {submitting ? "Saving…" : mode === "create" ? "Create category" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/categories")}
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
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-neutral-700">
      {label}
      {required ? <span className="text-red-600"> *</span> : null}
      {children}
      {error ? <span className="mt-1 block text-xs font-normal text-red-600">{error}</span> : null}
    </label>
  );
}
