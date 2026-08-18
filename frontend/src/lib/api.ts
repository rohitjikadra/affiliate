import { ApiError, type Product, type ProductCategory, type ProductPayload } from "@/types/product";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type HealthResponse = {
  status: "ok" | "degraded";
  service: string;
  timestamp: string;
  uptimeSeconds: number;
  checks: {
    database: {
      status: "up" | "down";
    };
  };
};

type ApiEnvelope<T> = {
  data: T;
  error?: {
    code: string;
    message: string;
    details?: { path: string; message: string }[];
  };
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const body = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      body?.error?.code ?? "REQUEST_FAILED",
      body?.error?.message ?? `Request failed with status ${response.status}`,
      body?.error?.details,
    );
  }

  return (body as ApiEnvelope<T>).data;
}

export async function getApiHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_URL}/api/health`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }

  return response.json() as Promise<HealthResponse>;
}

export type ListProductsQuery = {
  q?: string;
  category?: string;
  featured?: boolean;
  includeInactive?: boolean;
};

export async function listCategories(): Promise<ProductCategory[]> {
  return request<ProductCategory[]>("/api/categories");
}

export async function getCategory(slug: string): Promise<ProductCategory> {
  return request<ProductCategory>(`/api/categories/${encodeURIComponent(slug)}`);
}

export async function listProducts(query: ListProductsQuery = {}): Promise<Product[]> {
  const params = new URLSearchParams();

  if (query.q?.trim()) {
    params.set("q", query.q.trim());
  }

  if (query.category) {
    params.set("category", query.category);
  }

  if (query.featured) {
    params.set("featured", "true");
  }

  if (query.includeInactive) {
    params.set("includeInactive", "true");
  }

  const search = params.toString();
  return request<Product[]>(`/api/products${search ? `?${search}` : ""}`);
}

export async function getProduct(idOrSlug: string): Promise<Product> {
  return request<Product>(`/api/products/${encodeURIComponent(idOrSlug)}`);
}

export async function startCheckout(slug: string): Promise<{ url: string }> {
  return request<{ url: string }>(`/api/products/${encodeURIComponent(slug)}/go`, {
    method: "POST",
    body: JSON.stringify({
      referrer: typeof document === "undefined" ? undefined : document.referrer || window.location.href,
    }),
  });
}

export async function createProduct(payload: ProductPayload): Promise<Product> {
  return request<Product>("/api/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateProduct(id: string, payload: ProductPayload): Promise<Product> {
  return request<Product>(`/api/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function setProductStatus(id: string, isActive: boolean): Promise<Product> {
  return request<Product>(`/api/products/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
}

export async function deleteProduct(id: string): Promise<{ id: string }> {
  return request<{ id: string }>(`/api/products/${id}`, {
    method: "DELETE",
  });
}

export { API_URL };
