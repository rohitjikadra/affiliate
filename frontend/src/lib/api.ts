import {
  ApiError,
  type Merchant,
  type MerchantPayload,
  type Offer,
  type OfferPayload,
  type PaginationMeta,
  type Product,
  type ProductCategory,
  type ProductPayload,
  type CategoryPayload,
} from "@/types/product";
import type { Guide, GuidePayload } from "@/types/guide";
import type { Comparison, ComparisonPayload } from "@/types/comparison";

function apiBase(): string {
  if (typeof window !== "undefined") {
    return "";
  }
  return process.env.API_ORIGIN ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

export type HealthResponse = {
  status: "ok" | "degraded";
  service: string;
  timestamp: string;
  uptimeSeconds: number;
  checks: {
    database: {
      status: "up" | "down";
    };
    worker?: {
      status: "up" | "down";
      lastSeenAt?: string | null;
    };
  };
};

type ApiEnvelope<T> = {
  data: T;
  meta?: PaginationMeta;
  error?: {
    code: string;
    message: string;
    details?: { path: string; message: string }[] | { toSlug?: string; entityType?: string };
  };
};

type RequestOptions = RequestInit & { revalidate?: number | false };

async function request<T>(path: string, init?: RequestOptions): Promise<{ data: T; meta?: PaginationMeta }> {
  const cookie = await incomingCookieHeader();
  const isMutating = Boolean(init?.method && init.method !== "GET");
  const revalidate = init?.revalidate;
  const cacheMode = isMutating || cookie || revalidate === false ? "no-store" : undefined;

  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
    credentials: "include",
    cache: cacheMode,
    redirect: "manual",
    next: !cacheMode ? { revalidate: typeof revalidate === "number" ? revalidate : 120 } : undefined,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (response.status === 308) {
    const body = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
    const details = body?.error?.details;
    const toSlug = details && !Array.isArray(details) ? details.toSlug : undefined;
    throw new ApiError(308, "MOVED_PERMANENTLY", body?.error?.message ?? "Moved", undefined, toSlug);
  }

  const body = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok) {
    const details = body?.error?.details;
    throw new ApiError(
      response.status,
      body?.error?.code ?? "REQUEST_FAILED",
      body?.error?.message ?? `Request failed with status ${response.status}`,
      Array.isArray(details) ? details : undefined,
    );
  }

  return { data: (body as ApiEnvelope<T>).data, meta: body?.meta };
}

async function incomingCookieHeader(): Promise<string | undefined> {
  if (typeof window !== "undefined") {
    return undefined;
  }

  try {
    const { cookies } = await import("next/headers");
    const token = (await cookies()).get("ah_session")?.value;
    return token ? `ah_session=${encodeURIComponent(token)}` : undefined;
  } catch {
    return undefined;
  }
}

export async function getApiHealth(): Promise<HealthResponse> {
  const response = await fetch(`${apiBase()}/api/health`, { cache: "no-store" });
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
  sort?: "trending" | "drops";
  page?: number;
  limit?: number;
};

function withQuery(path: string, params: URLSearchParams): string {
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}

export async function listCategories(): Promise<ProductCategory[]> {
  const result = await request<ProductCategory[]>("/api/categories");
  return result.data;
}

export async function getCategory(slug: string): Promise<ProductCategory> {
  const result = await request<ProductCategory>(`/api/categories/${encodeURIComponent(slug)}`);
  return result.data;
}

export async function createCategory(payload: CategoryPayload): Promise<ProductCategory> {
  const result = await request<ProductCategory>("/api/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return result.data;
}

export async function updateCategory(id: string, payload: CategoryPayload): Promise<ProductCategory> {
  const result = await request<ProductCategory>(`/api/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return result.data;
}

export async function deleteCategory(id: string): Promise<{ id: string }> {
  const result = await request<{ id: string }>(`/api/categories/${id}`, { method: "DELETE" });
  return result.data;
}

export async function listProducts(
  query: ListProductsQuery = {},
): Promise<{ items: Product[]; meta: PaginationMeta }> {
  const params = new URLSearchParams();
  if (query.q?.trim()) params.set("q", query.q.trim());
  if (query.category) params.set("category", query.category);
  if (query.featured) params.set("featured", "true");
  if (query.includeInactive) params.set("includeInactive", "true");
  if (query.sort) params.set("sort", query.sort);
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));

  const result = await request<Product[]>(withQuery("/api/products", params), {
    revalidate: query.includeInactive ? false : 120,
  });
  return {
    items: result.data,
    meta: result.meta ?? { total: result.data.length, page: 1, limit: result.data.length, pages: 1, nextPage: null, previousPage: null },
  };
}

export async function getProduct(idOrSlug: string): Promise<Product> {
  const result = await request<Product>(`/api/products/${encodeURIComponent(idOrSlug)}`);
  return result.data;
}

export type PriceHistoryPoint = {
  offerId: string;
  price: number;
  currency: string;
  recordedAt: string;
};

export type PriceHistory = {
  enabled: boolean;
  points: PriceHistoryPoint[];
  stats: { low: number; high: number; average: number; count: number; label: string } | null;
};

export async function getPriceHistory(
  idOrSlug: string,
  range: "7d" | "30d" | "90d" = "90d",
): Promise<PriceHistory> {
  const result = await request<PriceHistory>(
    `/api/products/${encodeURIComponent(idOrSlug)}/price-history?range=${range}`,
    { revalidate: 120 },
  );
  return result.data;
}

export async function createProduct(payload: ProductPayload): Promise<Product> {
  const result = await request<Product>("/api/products", { method: "POST", body: JSON.stringify(payload) });
  return result.data;
}

export async function updateProduct(id: string, payload: ProductPayload): Promise<Product> {
  const result = await request<Product>(`/api/products/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
  return result.data;
}

export async function setProductStatus(id: string, isActive: boolean): Promise<Product> {
  const result = await request<Product>(`/api/products/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
  return result.data;
}

export async function deleteProduct(id: string): Promise<{ id: string }> {
  const result = await request<{ id: string }>(`/api/products/${id}`, { method: "DELETE" });
  return result.data;
}

export async function listMerchants(): Promise<Merchant[]> {
  const result = await request<Merchant[]>("/api/merchants", { revalidate: false });
  return result.data;
}

export async function getMerchant(id: string): Promise<Merchant> {
  const result = await request<Merchant>(`/api/merchants/${id}`, { revalidate: false });
  return result.data;
}

export async function createMerchant(payload: MerchantPayload): Promise<Merchant> {
  const result = await request<Merchant>("/api/merchants", { method: "POST", body: JSON.stringify(payload) });
  return result.data;
}

export async function updateMerchant(id: string, payload: MerchantPayload): Promise<Merchant> {
  const result = await request<Merchant>(`/api/merchants/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
  return result.data;
}

export async function deleteMerchant(id: string): Promise<{ id: string }> {
  const result = await request<{ id: string }>(`/api/merchants/${id}`, { method: "DELETE" });
  return result.data;
}

export async function createOffer(productId: string, payload: OfferPayload): Promise<Offer> {
  const result = await request<Offer>(`/api/products/${productId}/offers`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return result.data;
}

export async function updateOffer(productId: string, offerId: string, payload: Partial<OfferPayload>): Promise<Offer> {
  const result = await request<Offer>(`/api/products/${productId}/offers/${offerId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return result.data;
}

export async function deleteOffer(productId: string, offerId: string): Promise<{ id: string }> {
  const result = await request<{ id: string }>(`/api/products/${productId}/offers/${offerId}`, { method: "DELETE" });
  return result.data;
}

export async function loginAdmin(password: string): Promise<{ ok: true }> {
  const result = await request<{ ok: true }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
  return result.data;
}

export async function logoutAdmin(): Promise<{ ok: true }> {
  const result = await request<{ ok: true }>("/api/auth/logout", { method: "POST" });
  return result.data;
}

export async function getAdminSession(): Promise<boolean> {
  try {
    await request<{ ok: true }>("/api/auth/me", { revalidate: false });
    return true;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
      return false;
    }
    throw error;
  }
}

export type ClickPeriodCounts = { all: number; last7Days: number; last30Days: number };

export type ClickStats = {
  totals: ClickPeriodCounts & { pageViews: number; pageViewsLast7Days: number };
  products: {
    id: string;
    slug: string;
    title: string;
    source: Product["source"];
    isActive: boolean;
    clicks: ClickPeriodCounts;
    pageViews: number;
    ctr: number | null;
  }[];
  merchants: { id: string; slug: string; name: string; clicks: number }[];
  topPages: { path: string; views: number }[];
  campaigns: { source: string; clicks: number }[];
  recent: {
    id: string;
    source: Product["source"];
    referrer: string | null;
    landingPath: string | null;
    utmSource: string | null;
    utmCampaign: string | null;
    device: string | null;
    createdAt: string;
    product: { id: string; slug: string; title: string };
    merchant: { id: string; slug: string; name: string } | null;
    offerId: string | null;
  }[];
};

export async function getClickStats(): Promise<ClickStats> {
  const result = await request<ClickStats>("/api/admin/stats/clicks", { revalidate: false });
  return result.data;
}

export type AdminConfig = {
  amazonAssociateTag: string | null;
  creatorsConfigured: boolean;
  priceHistoryPublic: boolean;
};

export async function getAdminConfig(): Promise<AdminConfig> {
  const result = await request<AdminConfig>("/api/admin/config", { revalidate: false });
  return result.data;
}

export type DiscoveryCandidate = {
  externalId: string;
  title: string;
  brand: string | null;
  imageUrl: string | null;
  price: number | null;
  currency: string;
};

export type CatalogSearchResult = {
  enabled: boolean;
  items: DiscoveryCandidate[];
};

export async function searchCatalog(query: string): Promise<CatalogSearchResult> {
  const params = new URLSearchParams({ q: query });
  const result = await request<CatalogSearchResult>(`/api/admin/ops/products/search?${params.toString()}`, {
    revalidate: false,
  });
  return result.data;
}

export type ImportAsinsResult = {
  created: { id: string; slug: string; asin: string; status: string }[];
  attached: { productId: string; asin: string; action: "attach-offer" | "refresh-offer" }[];
};

export async function importAsins(asins: string[], categoryId?: string): Promise<ImportAsinsResult> {
  const result = await request<ImportAsinsResult>("/api/admin/ops/products/import", {
    method: "POST",
    body: JSON.stringify({ asins, categoryId }),
  });
  return result.data;
}

export async function publishProduct(id: string): Promise<{ id: string; status: string }> {
  const result = await request<{ id: string; status: string }>(`/api/admin/ops/products/${id}/publish`, {
    method: "POST",
  });
  return result.data;
}

export type AlertType = "TARGET_PRICE" | "PERCENT_DROP" | "NEW_LOW";

export type PriceAlertPayload = {
  productId: string;
  email: string;
  type: AlertType;
  targetPrice?: number;
  percentThreshold?: number;
};

export async function createPriceAlert(payload: PriceAlertPayload): Promise<{ id: string; email: string; productId: string }> {
  const result = await request<{ id: string; email: string; productId: string }>("/api/alerts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return result.data;
}

export async function confirmPriceAlert(token: string): Promise<{ ok: true }> {
  const params = new URLSearchParams({ token });
  const result = await request<{ ok: true }>(`/api/alerts/verify?${params.toString()}`, { revalidate: false });
  return result.data;
}

export async function unsubscribePriceAlert(token: string): Promise<{ ok: true }> {
  const params = new URLSearchParams({ token });
  const result = await request<{ ok: true }>(`/api/alerts/unsubscribe?${params.toString()}`, { revalidate: false });
  return result.data;
}

export type AdminPriceAlert = {
  id: string;
  email: string;
  type: AlertType;
  targetPrice: string | null;
  percentThreshold: string | null;
  isActive: boolean;
  emailVerifiedAt: string | null;
  lastTriggeredAt: string | null;
  createdAt: string;
  offerId: string | null;
  product: { id: string; title: string; slug: string };
};

export async function getAdminAlerts(): Promise<AdminPriceAlert[]> {
  const result = await request<AdminPriceAlert[]>("/api/admin/ops/alerts", { revalidate: false });
  return result.data;
}

export type OpsOverview = {
  pendingJobs: number;
  deadJobs: number;
  staleOffers: number;
  failedOffers: number;
  queuedOffers: number;
  activeAlerts: number;
  snapshotCount: number;
  priceEventsLast24h: number;
  retainDays: number;
  worker: { status: "up" | "down"; lastSeenAt: string | null };
};

export type OpsOffer = {
  id: string;
  price: string | null;
  currency: string;
  fetchStatus: string;
  fetchError: string | null;
  consecutiveFailures: number;
  lastSuccessfulFetchAt: string | null;
  nextFetchAt: string | null;
  product: { id: string; slug: string; title: string };
  merchant: { name: string; slug: string };
};

export type OpsJob = {
  id: string;
  type: string;
  status: string;
  attempts: number;
  maxAttempts: number;
  lastError: string | null;
  runAfter: string | null;
  createdAt: string | null;
  completedAt: string | null;
};

export async function getOpsOverview(): Promise<OpsOverview> {
  const result = await request<OpsOverview>("/api/admin/ops/overview", { revalidate: false });
  return result.data;
}

export async function getOpsOffers(freshness: "stale" | "failed" | "queued" = "stale"): Promise<OpsOffer[]> {
  const params = new URLSearchParams({ freshness });
  const result = await request<OpsOffer[]>(`/api/admin/ops/offers?${params.toString()}`, { revalidate: false });
  return result.data;
}

export async function refreshOpsOffer(id: string): Promise<{ id: string }> {
  const result = await request<{ id: string }>(`/api/admin/ops/offers/${id}/refresh`, { method: "POST" });
  return result.data;
}

export async function getOpsJobs(): Promise<OpsJob[]> {
  const result = await request<OpsJob[]>("/api/admin/ops/jobs", { revalidate: false });
  return result.data;
}

export async function retryOpsJob(id: string): Promise<{ id: string; retried: true }> {
  const result = await request<{ id: string; retried: true }>(`/api/admin/ops/jobs/${id}/retry`, { method: "POST" });
  return result.data;
}

export async function compactSnapshots(): Promise<{ deleted: number; retainDays: number }> {
  const result = await request<{ deleted: number; retainDays: number }>("/api/admin/ops/snapshots/compact", {
    method: "POST",
  });
  return result.data;
}

export type ListGuidesQuery = {
  includeUnpublished?: boolean;
  category?: string;
  kind?: Guide["kind"];
  page?: number;
  limit?: number;
};

export async function listGuides(query: ListGuidesQuery = {}): Promise<{ items: Guide[]; meta: PaginationMeta }> {
  const params = new URLSearchParams();
  if (query.includeUnpublished) params.set("includeUnpublished", "true");
  if (query.category) params.set("category", query.category);
  if (query.kind) params.set("kind", query.kind);
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  const result = await request<Guide[]>(withQuery("/api/guides", params), {
    revalidate: query.includeUnpublished ? false : 120,
  });
  return {
    items: result.data,
    meta: result.meta ?? { total: result.data.length, page: 1, limit: result.data.length, pages: 1, nextPage: null, previousPage: null },
  };
}

export async function getGuide(idOrSlug: string): Promise<Guide> {
  const result = await request<Guide>(`/api/guides/${encodeURIComponent(idOrSlug)}`);
  return result.data;
}

export async function createGuide(payload: GuidePayload): Promise<Guide> {
  const result = await request<Guide>("/api/guides", { method: "POST", body: JSON.stringify(payload) });
  return result.data;
}

export async function updateGuide(id: string, payload: GuidePayload): Promise<Guide> {
  const result = await request<Guide>(`/api/guides/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
  return result.data;
}

export async function deleteGuide(id: string): Promise<{ id: string }> {
  const result = await request<{ id: string }>(`/api/guides/${id}`, { method: "DELETE" });
  return result.data;
}

export type ListComparisonsQuery = { includeUnpublished?: boolean; page?: number; limit?: number };

export async function listComparisons(
  query: ListComparisonsQuery = {},
): Promise<{ items: Comparison[]; meta: PaginationMeta }> {
  const params = new URLSearchParams();
  if (query.includeUnpublished) params.set("includeUnpublished", "true");
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  const result = await request<Comparison[]>(withQuery("/api/comparisons", params), {
    revalidate: query.includeUnpublished ? false : 120,
  });
  return {
    items: result.data,
    meta: result.meta ?? { total: result.data.length, page: 1, limit: result.data.length, pages: 1, nextPage: null, previousPage: null },
  };
}

export async function getComparison(idOrSlug: string): Promise<Comparison> {
  const result = await request<Comparison>(`/api/comparisons/${encodeURIComponent(idOrSlug)}`);
  return result.data;
}

export async function createComparison(payload: ComparisonPayload): Promise<Comparison> {
  const result = await request<Comparison>("/api/comparisons", { method: "POST", body: JSON.stringify(payload) });
  return result.data;
}

export async function updateComparison(id: string, payload: ComparisonPayload): Promise<Comparison> {
  const result = await request<Comparison>(`/api/comparisons/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return result.data;
}

export async function deleteComparison(id: string): Promise<{ id: string }> {
  const result = await request<{ id: string }>(`/api/comparisons/${id}`, { method: "DELETE" });
  return result.data;
}

export async function recordPageView(input: {
  path: string;
  entityType?: "product" | "guide" | "comparison" | "category" | "best";
  entityId?: string;
}): Promise<void> {
  try {
    await request("/api/pageviews", { method: "POST", body: JSON.stringify(input) });
  } catch {
    // Analytics must never break the page.
  }
}

export type SitemapPayload = {
  products: { slug: string; updatedAt: string }[];
  categories: { slug: string; updatedAt: string }[];
  guides: { slug: string; kind: Guide["kind"]; updatedAt: string }[];
  comparisons: { slug: string; updatedAt: string }[];
};

export async function getSitemapEntities(): Promise<SitemapPayload> {
  const result = await request<SitemapPayload>("/api/sitemap", { revalidate: 300 });
  return result.data;
}

export { apiBase as API_URL };
