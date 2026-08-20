import type { Request, Response } from "express";
import { AppError } from "../../lib/errors.js";
import type { CreateMerchantInput, UpdateMerchantInput } from "./merchant.schemas.js";
import {
  createMerchant,
  deleteMerchant,
  getMerchant,
  listMerchants,
  updateMerchant,
} from "./merchant.service.js";

function readParam(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new AppError(400, "VALIDATION_ERROR", "Merchant is required");
  }
  return value;
}

export async function list(_req: Request, res: Response): Promise<void> {
  const isAdmin = Boolean(res.locals.isAdmin);
  const data = await listMerchants({ includeInactive: isAdmin, includeTag: isAdmin });
  res.status(200).json({ data });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const isAdmin = Boolean(res.locals.isAdmin);
  const data = await getMerchant(readParam(req, "id"), { includeTag: isAdmin });
  res.status(200).json({ data });
}

export async function create(req: Request, res: Response): Promise<void> {
  const data = await createMerchant(req.body as CreateMerchantInput);
  res.status(201).json({ data });
}

export async function update(req: Request, res: Response): Promise<void> {
  const data = await updateMerchant(readParam(req, "id"), req.body as UpdateMerchantInput);
  res.status(200).json({ data });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const data = await deleteMerchant(readParam(req, "id"));
  res.status(200).json({ data });
}
