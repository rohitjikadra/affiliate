import type { Request, Response } from "express";
import { AppError } from "../../lib/errors.js";
import type { CreateComparisonInput, ListComparisonsQuery, UpdateComparisonInput } from "./comparison.schemas.js";
import {
  createComparison,
  deleteComparison,
  getComparisonByIdOrSlug,
  listComparisons,
  updateComparison,
} from "./comparison.service.js";

function readParam(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new AppError(400, "VALIDATION_ERROR", "Comparison is required");
  }
  return value;
}

export async function list(_req: Request, res: Response): Promise<void> {
  const isAdmin = Boolean(res.locals.isAdmin);
  const query = { ...((res.locals.query ?? {}) as ListComparisonsQuery) };
  const data = await listComparisons(query, {
    includeUnpublished: isAdmin && Boolean(query.includeUnpublished),
  });
  res.status(200).json({ data: data.items, meta: data.meta });
}

export async function getByIdOrSlug(req: Request, res: Response): Promise<void> {
  const isAdmin = Boolean(res.locals.isAdmin);
  const data = await getComparisonByIdOrSlug(readParam(req, "id"), { isAdmin });
  res.status(200).json({ data });
}

export async function create(req: Request, res: Response): Promise<void> {
  const data = await createComparison(req.body as CreateComparisonInput);
  res.status(201).json({ data });
}

export async function update(req: Request, res: Response): Promise<void> {
  const data = await updateComparison(readParam(req, "id"), req.body as UpdateComparisonInput);
  res.status(200).json({ data });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const data = await deleteComparison(readParam(req, "id"));
  res.status(200).json({ data });
}
