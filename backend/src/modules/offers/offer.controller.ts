import type { Request, Response } from "express";
import { AppError } from "../../lib/errors.js";
import type { CreateOfferInput, UpdateOfferInput } from "./offer.schemas.js";
import { createOffer, deleteOffer, listOffersForProduct, updateOffer } from "./offer.service.js";

function readParam(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new AppError(400, "VALIDATION_ERROR", "Value is required");
  }
  return value;
}

export async function list(req: Request, res: Response): Promise<void> {
  const isAdmin = Boolean(res.locals.isAdmin);
  const data = await listOffersForProduct(readParam(req, "productId"), { includeAffiliateUrl: isAdmin });
  res.status(200).json({ data });
}

export async function create(req: Request, res: Response): Promise<void> {
  const data = await createOffer(readParam(req, "productId"), req.body as CreateOfferInput);
  res.status(201).json({ data });
}

export async function update(req: Request, res: Response): Promise<void> {
  const data = await updateOffer(
    readParam(req, "productId"),
    readParam(req, "offerId"),
    req.body as UpdateOfferInput,
  );
  res.status(200).json({ data });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const data = await deleteOffer(readParam(req, "productId"), readParam(req, "offerId"));
  res.status(200).json({ data });
}
