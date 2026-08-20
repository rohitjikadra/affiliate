import type { Request, Response } from "express";
import { recordPageView } from "./pageview.service.js";
import type { CreatePageViewInput } from "./pageview.schemas.js";

export async function create(req: Request, res: Response): Promise<void> {
  const data = await recordPageView(req.body as CreatePageViewInput);
  res.status(201).json({ data });
}
