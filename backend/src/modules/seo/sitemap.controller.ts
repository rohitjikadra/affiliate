import type { Request, Response } from "express";
import { listSitemapEntities } from "./sitemap.service.js";

export async function sitemap(_req: Request, res: Response): Promise<void> {
  const data = await listSitemapEntities();
  res.status(200).json({ data });
}
