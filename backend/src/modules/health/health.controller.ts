import type { Request, Response } from "express";
import { getHealth } from "./health.service.js";

export async function healthCheck(_req: Request, res: Response): Promise<void> {
  const payload = await getHealth();
  res.status(200).json(payload);
}
