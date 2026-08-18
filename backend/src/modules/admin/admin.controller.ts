import type { Request, Response } from "express";
import { env } from "../../config/env.js";

export async function getConfig(_req: Request, res: Response): Promise<void> {
  res.status(200).json({
    data: {
      amazonAssociateTag: env.amazonAssociateTag,
    },
  });
}
