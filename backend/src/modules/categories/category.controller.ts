import type { Request, Response } from "express";
import { AppError } from "../../lib/errors.js";
import { getCategoryBySlug, listCategories } from "./category.service.js";

function readParam(req: Request, name: string): string {
  const value = req.params[name];

  if (typeof value !== "string" || value.length === 0) {
    throw new AppError(400, "VALIDATION_ERROR", "Category is required");
  }

  return value;
}

export async function list(_req: Request, res: Response): Promise<void> {
  const data = await listCategories();
  res.status(200).json({ data });
}

export async function getBySlug(req: Request, res: Response): Promise<void> {
  const data = await getCategoryBySlug(readParam(req, "slug"));
  res.status(200).json({ data });
}
