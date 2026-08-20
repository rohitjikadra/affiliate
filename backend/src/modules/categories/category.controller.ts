import type { Request, Response } from "express";
import { AppError } from "../../lib/errors.js";
import type { CreateCategoryInput, UpdateCategoryInput } from "./category.schemas.js";
import {
  createCategory,
  deleteCategory,
  getCategoryByIdOrSlug,
  listCategories,
  updateCategory,
} from "./category.service.js";

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

export async function getByIdOrSlug(req: Request, res: Response): Promise<void> {
  const data = await getCategoryByIdOrSlug(readParam(req, "id"));
  res.status(200).json({ data });
}

export async function create(req: Request, res: Response): Promise<void> {
  const data = await createCategory(req.body as CreateCategoryInput);
  res.status(201).json({ data });
}

export async function update(req: Request, res: Response): Promise<void> {
  const data = await updateCategory(readParam(req, "id"), req.body as UpdateCategoryInput);
  res.status(200).json({ data });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const data = await deleteCategory(readParam(req, "id"));
  res.status(200).json({ data });
}
