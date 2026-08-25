import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { AdapterDisabledError, type DiscoveryCandidate, type MerchantAdapter, type NormalizedOffer } from "./types.js";

type TokenCache = { token: string; expiresAt: number };

let tokenCache: TokenCache | null = null;

const GET_ITEMS_URL = "https://creatorsapi.amazon/catalog/v1/getItems";
const SEARCH_ITEMS_URL = "https://creatorsapi.amazon/catalog/v1/searchItems";
const TOKEN_URL = "https://api.amazon.co.uk/auth/o2/token";
const FETCH_TIMEOUT_MS = 8_000;

export function parseAsins(ids: string[]): string[] {
  return [...new Set(ids.map((id) => id.trim().toUpperCase()).filter((id) => /^[A-Z0-9]{10}$/.test(id)))];
}

export function taggedAmazonUrl(asin: string, partnerTag: string | null | undefined): string {
  const base = `https://www.amazon.in/dp/${asin}`;
  return partnerTag ? `${base}?tag=${partnerTag}` : base;
}

export function parseMoney(value: unknown): number | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as Record<string, unknown>;
  const amount = record.amount ?? record.displayAmount ?? record.value;
  const parsed = typeof amount === "number" ? amount : Number(String(amount ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function parseAvailability(value: unknown): NormalizedOffer["availability"] {
  const text = JSON.stringify(value ?? "").toLowerCase();
  if (text.includes("out of stock") || text.includes("unavailable")) {
    return "OUT_OF_STOCK";
  }
  if (text.includes("in stock") || text.includes("now")) {
    return "IN_STOCK";
  }
  return "UNKNOWN";
}

export function validateNormalizedOffer(item: NormalizedOffer): string | null {
  if (!/^[A-Z0-9]{10}$/.test(item.externalId)) {
    return "Invalid ASIN";
  }
  if (item.currency !== "INR") {
    return "Currency must be INR";
  }
  if (item.price == null || item.price <= 0) {
    return "Price must be greater than 0";
  }
  return null;
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
}

async function getAccessToken(): Promise<string> {
  if (!env.amazonCreatorsCredentialId || !env.amazonCreatorsCredentialSecret) {
    throw new AdapterDisabledError("AMAZON_IN");
  }
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.token;
  }
  const response = await fetchWithTimeout(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: env.amazonCreatorsCredentialId,
      client_secret: env.amazonCreatorsCredentialSecret,
    }),
  });
  if (!response.ok) {
    throw new Error(`Amazon token request failed (${response.status})`);
  }
  const json = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) {
    throw new Error("Amazon token response missing access_token");
  }
  tokenCache = { token: json.access_token, expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000 };
  return json.access_token;
}

function catalogIdStrings(node: unknown): string[] {
  if (typeof node === "string" && node.trim()) {
    return [node.trim()];
  }
  if (Array.isArray(node)) {
    return node.flatMap(catalogIdStrings);
  }
  if (node && typeof node === "object") {
    const record = node as Record<string, unknown>;
    return catalogIdStrings(record.displayValue ?? record.displayValues ?? record.value ?? record.values);
  }
  return [];
}

export function extractAmazonCatalogIds(raw: Record<string, unknown>): { type: "ASIN" | "GTIN" | "EAN" | "UPC"; value: string }[] {
  const itemInfo = (raw.itemInfo ?? {}) as Record<string, unknown>;
  const externalIds = (itemInfo.externalIds ?? raw.externalIds ?? {}) as Record<string, unknown>;
  const mapping: Array<[string, "GTIN" | "EAN" | "UPC"]> = [
    ["gtin", "GTIN"],
    ["gtins", "GTIN"],
    ["gtINs", "GTIN"],
    ["ean", "EAN"],
    ["eans", "EAN"],
    ["eaNs", "EAN"],
    ["upc", "UPC"],
    ["upcs", "UPC"],
    ["upCs", "UPC"],
  ];
  const seen = new Set<string>();
  const result: { type: "ASIN" | "GTIN" | "EAN" | "UPC"; value: string }[] = [];
  for (const [key, type] of mapping) {
    for (const rawValue of catalogIdStrings(externalIds[key])) {
      const value = rawValue.replace(/\D/g, "");
      if (value.length < 8) {
        continue;
      }
      const token = `${type}:${value}`;
      if (seen.has(token)) {
        continue;
      }
      seen.add(token);
      result.push({ type, value });
    }
  }
  return result;
}

export function normalizeAmazonItem(raw: Record<string, unknown>, partnerTag: string | null): NormalizedOffer | null {
  const asin = String(raw.asin ?? raw.ASIN ?? "").toUpperCase();
  if (!/^[A-Z0-9]{10}$/.test(asin)) {
    return null;
  }
  const itemInfo = (raw.itemInfo ?? {}) as Record<string, unknown>;
  const titleNode = (itemInfo.title ?? raw.title) as Record<string, unknown> | string | undefined;
  const title =
    typeof titleNode === "string"
      ? titleNode
      : typeof titleNode?.displayValue === "string"
        ? titleNode.displayValue
        : null;
  const offersV2 = (raw.offersV2 ?? raw.offers ?? {}) as Record<string, unknown>;
  const listings = Array.isArray(offersV2.listings) ? offersV2.listings : [];
  const listing = (listings[0] ?? {}) as Record<string, unknown>;
  const price = parseMoney(listing.price) ?? parseMoney(raw.price);
  const originalPrice = parseMoney(listing.savingBasis) ?? parseMoney(listing.wasPrice) ?? price;
  const detailUrl = typeof raw.detailPageURL === "string" ? raw.detailPageURL : `https://www.amazon.in/dp/${asin}`;
  const tagged =
    partnerTag && !detailUrl.includes("tag=")
      ? `${detailUrl}${detailUrl.includes("?") ? "&" : "?"}tag=${partnerTag}`
      : detailUrl;
  const images = raw.images as Record<string, unknown> | undefined;
  const primary = images?.primary as Record<string, unknown> | undefined;
  const large = (primary?.large ?? primary?.medium ?? primary?.small) as Record<string, unknown> | undefined;
  const imageUrl = typeof large?.url === "string" ? large.url : null;
  const byLine = (itemInfo.byLineInfo ?? {}) as Record<string, unknown>;
  const brandNode = byLine.brand as Record<string, unknown> | undefined;
  const brand = typeof brandNode?.displayValue === "string" ? brandNode.displayValue : null;

  return {
    externalId: asin,
    title,
    brand,
    price,
    originalPrice,
    currency: "INR",
    availability: parseAvailability(listing.availability),
    productUrl: `https://www.amazon.in/dp/${asin}`,
    affiliateUrl: tagged,
    imageUrls: imageUrl ? [imageUrl] : [],
    fetchedAt: new Date(),
    identifiers: [{ type: "ASIN", value: asin }, ...extractAmazonCatalogIds(raw)],
  };
}

export function createAmazonAdapter(partnerTag: string | null = env.amazonAssociateTag): MerchantAdapter {
  const enabled = Boolean(env.amazonCreatorsCredentialId && env.amazonCreatorsCredentialSecret);
  return {
    key: "AMAZON_IN",
    enabled,
    listingIdentifierType: "ASIN",
    productSource: "AMAZON",
    emptyIdsMessage: "Provide at least one ASIN",
    async lookup(ids) {
      if (!enabled) {
        throw new AdapterDisabledError("AMAZON_IN");
      }
      const itemIds = parseAsins(ids).slice(0, 10);
      if (itemIds.length === 0) {
        return [];
      }
      const token = await getAccessToken();
      const response = await fetchWithTimeout(GET_ITEMS_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-marketplace": env.amazonCreatorsMarketplace,
        },
        body: JSON.stringify({
          itemIds,
          itemIdType: "ASIN",
          marketplace: env.amazonCreatorsMarketplace,
          partnerTag: partnerTag ?? undefined,
          resources: [
            "itemInfo.title",
            "itemInfo.byLineInfo.brand",
            "images.primary.large",
            "offersV2.listings.price",
            "offersV2.listings.availability",
          ],
        }),
      });
      if (!response.ok) {
        const text = await response.text();
        logger.warn("amazon_get_items_failed", { status: response.status, body: text.slice(0, 300) });
        throw new Error(`Amazon GetItems failed (${response.status})`);
      }
      const json = (await response.json()) as { items?: Record<string, unknown>[] };
      return (json.items ?? [])
        .map((item) => normalizeAmazonItem(item, partnerTag))
        .filter((item): item is NormalizedOffer => item != null);
    },
    validate: validateNormalizedOffer,
    parseExternalIds: parseAsins,
    fallbackUrls(externalId, tag) {
      return {
        productUrl: `https://www.amazon.in/dp/${externalId}`,
        affiliateUrl: taggedAmazonUrl(externalId, tag),
      };
    },
    async search(query) {
      if (!enabled) {
        throw new AdapterDisabledError("AMAZON_IN");
      }
      const token = await getAccessToken();
      const response = await fetchWithTimeout(SEARCH_ITEMS_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-marketplace": env.amazonCreatorsMarketplace,
        },
        body: JSON.stringify({
          keywords: query,
          marketplace: env.amazonCreatorsMarketplace,
          partnerTag: partnerTag ?? undefined,
          itemCount: 10,
          resources: ["itemInfo.title", "itemInfo.byLineInfo.brand", "images.primary.large", "offersV2.listings.price"],
        }),
      });
      if (!response.ok) {
        throw new Error(`Amazon SearchItems failed (${response.status})`);
      }
      const json = (await response.json()) as { items?: Record<string, unknown>[] };
      return (json.items ?? [])
        .map((item) => normalizeAmazonItem(item, partnerTag))
        .filter((item): item is NormalizedOffer => item != null)
        .map(
          (item) =>
            ({
              externalId: item.externalId,
              title: item.title ?? item.externalId,
              brand: item.brand ?? null,
              imageUrl: item.imageUrls[0] ?? null,
              price: item.price,
              currency: item.currency,
            }) satisfies DiscoveryCandidate,
        );
    },
  };
}
