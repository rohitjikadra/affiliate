import type { Request, Response } from "express";
import { AppError } from "../../lib/errors.js";
import { recordProductClick } from "../clicks/click.service.js";
import type {
  CreateProductInput,
  ProductGoInput,
  ProductStatusInput,
  UpdateProductInput,
} from "./product.schemas.js";
import {
  createProduct,
  deleteProduct,
  getProductByIdOrSlug,
  listProducts,
  setProductStatus,
  updateProduct,
} from "./product.service.js";

function readParam(req: Request, name: string): string {
  const value = req.params[name];

  if (typeof value !== "string" || value.length === 0) {
    throw new AppError(400, "VALIDATION_ERROR", "Product is required");
  }

  return value;
}

export async function list(_req: Request, res: Response): Promise<void> {
  const data = await listProducts();
  res.status(200).json({ data });
}

export async function getByIdOrSlug(req: Request, res: Response): Promise<void> {
  const data = await getProductByIdOrSlug(readParam(req, "id"));
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
  });
  res.status(200).json({ data });
}
