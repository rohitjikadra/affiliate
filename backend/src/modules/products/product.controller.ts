import type { Request, Response } from "express";
import { AppError } from "../../lib/errors.js";
import { classifyDevice, clientIp, hashIp } from "../../lib/ip.js";
import { recordProductClick } from "../clicks/click.service.js";
import { listGuidesForProduct } from "../guides/guide.service.js";
import { listComparisonsForProduct } from "../comparisons/comparison.service.js";
import type {
  CreateProductInput,
  ListProductsQuery,
  ProductGoInput,
  ProductStatusInput,
  UpdateProductInput,
} from "./product.schemas.js";
import {
  createProduct,
  deleteProduct,
  getProductByIdOrSlug,
  listProducts,
  listRelatedProducts,
  setProductStatus,
  updateProduct,
} from "./product.service.js";
import { getPriceHistory } from "../history/history.service.js";

function readParam(req: Request, name: string): string {
  const value = req.params[name];

  if (typeof value !== "string" || value.length === 0) {
    throw new AppError(400, "VALIDATION_ERROR", "Product is required");
  }

  return value;
}

export async function list(_req: Request, res: Response): Promise<void> {
  const isAdmin = Boolean(res.locals.isAdmin);
  const query = { ...((res.locals.query ?? {}) as ListProductsQuery) };

  if (!isAdmin) {
    query.includeInactive = false;
  }

  const data = await listProducts(query, {
    includeAffiliateUrl: isAdmin,
    includeClickCount: isAdmin,
  });
  res.status(200).json({ data: data.items, meta: data.meta });
}

export async function getByIdOrSlug(req: Request, res: Response): Promise<void> {
  const isAdmin = Boolean(res.locals.isAdmin);
  const product = await getProductByIdOrSlug(readParam(req, "id"), {
    isAdmin,
    includeAffiliateUrl: isAdmin,
  });
  const [relatedProducts, relatedGuides, relatedComparisons] = await Promise.all([
    listRelatedProducts(product.id, product.categoryId),
    listGuidesForProduct(product.id),
    listComparisonsForProduct(product.id),
  ]);
  res.status(200).json({
    data: {
      ...product,
      relatedProducts,
      relatedGuides,
      relatedComparisons,
    },
  });
}

export async function priceHistory(req: Request, res: Response): Promise<void> {
  const range = String((res.locals.query as { range?: string } | undefined)?.range ?? "30d");
  const data = await getPriceHistory(readParam(req, "id"), range);
  res.status(200).json({ data });
}

export async function related(req: Request, res: Response): Promise<void> {
  const product = await getProductByIdOrSlug(readParam(req, "id"), { isAdmin: false });
  const data = await listRelatedProducts(product.id, product.categoryId);
  res.status(200).json({ data });
}

export async function create(req: Request, res: Response): Promise<void> {
  const data = await createProduct(req.body as CreateProductInput);
  res.status(201).json({ data });
}

export async function update(req: Request, res: Response): Promise<void> {
  const data = await updateProduct(readParam(req, "id"), req.body as UpdateProductInput);
  res.status(200).json({ data });
}

export async function updateStatus(req: Request, res: Response): Promise<void> {
  const data = await setProductStatus(readParam(req, "id"), req.body as ProductStatusInput);
  res.status(200).json({ data });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const data = await deleteProduct(readParam(req, "id"));
  res.status(200).json({ data });
}

export async function go(req: Request, res: Response): Promise<void> {
  const body = (req.body ?? {}) as ProductGoInput;
  const data = await recordProductClick(readParam(req, "slug"), {
    referrer: body.referrer ?? req.get("referer") ?? undefined,
    userAgent: req.get("user-agent") ?? undefined,
    landingPath: body.landingPath,
    utmSource: body.utmSource,
    utmMedium: body.utmMedium,
    utmCampaign: body.utmCampaign,
    ipHash: hashIp(clientIp(req)),
    device: classifyDevice(req.get("user-agent") ?? undefined),
  });
  res.status(200).json({ data: { url: data.url } });
}
