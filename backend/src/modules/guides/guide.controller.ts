import type { Request, Response } from "express";
import { AppError } from "../../lib/errors.js";
import type { CreateGuideInput, ListGuidesQuery, UpdateGuideInput } from "./guide.schemas.js";
import {
  createGuide,
  deleteGuide,
  getGuideByIdOrSlug,
  listGuides,
  updateGuide,
} from "./guide.service.js";

function readParam(req: Request, name: string): string {
  const value = req.params[name];

  if (typeof value !== "string" || value.length === 0) {
    throw new AppError(400, "VALIDATION_ERROR", "Guide is required");
  }

  return value;
}

export async function list(_req: Request, res: Response): Promise<void> {
  const isAdmin = Boolean(res.locals.isAdmin);
  const query = { ...((res.locals.query ?? {}) as ListGuidesQuery) };
  const data = await listGuides(query, {
    includeUnpublished: isAdmin && Boolean(query.includeUnpublished),
  });
  res.status(200).json({ data: data.items, meta: data.meta });
}

export async function getByIdOrSlug(req: Request, res: Response): Promise<void> {
  const isAdmin = Boolean(res.locals.isAdmin);
  const data = await getGuideByIdOrSlug(readParam(req, "id"), { isAdmin });
  res.status(200).json({ data });
}

export async function create(req: Request, res: Response): Promise<void> {
  const data = await createGuide(req.body as CreateGuideInput);
  res.status(201).json({ data });
}

export async function update(req: Request, res: Response): Promise<void> {
  const data = await updateGuide(readParam(req, "id"), req.body as UpdateGuideInput);
  res.status(200).json({ data });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const data = await deleteGuide(readParam(req, "id"));
  res.status(200).json({ data });
}
