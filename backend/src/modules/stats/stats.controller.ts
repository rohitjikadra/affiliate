import type { Request, Response } from "express";
import { getClickStats } from "./stats.service.js";

export async function clicks(_req: Request, res: Response): Promise<void> {
  const data = await getClickStats();
  res.status(200).json({ data });
}
