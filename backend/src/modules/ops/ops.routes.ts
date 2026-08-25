import { Router } from "express";
import { z } from "zod";
import { attachAdmin, requireAdmin } from "../../middleware/requireAdmin.js";
import { validateBody, validateQuery } from "../../middleware/validate.js";
import {
  compactSnapshotsNow,
  getOpsOverview,
  listOpsJobs,
  listStaleOrFailedOffers,
  refreshOfferNow,
  retryJobById,
} from "./ops.service.js";
import { importProducts, publishProduct, searchCatalog } from "../imports/import.service.js";
import { listAlerts } from "../alerts/alert.service.js";

export const opsRouter = Router();
opsRouter.use(attachAdmin, requireAdmin);

opsRouter.get("/overview", async (_req, res) => {
  res.status(200).json({ data: await getOpsOverview() });
});

opsRouter.get(
  "/offers",
  validateQuery(z.object({ freshness: z.enum(["stale", "failed", "queued"]).optional() })),
  async (_req, res) => {
    const freshness = (res.locals.query as { freshness?: "stale" | "failed" | "queued" }).freshness ?? "stale";
    res.status(200).json({ data: await listStaleOrFailedOffers(freshness) });
  },
);

opsRouter.post("/offers/:id/refresh", async (req, res) => {
  res.status(202).json({ data: await refreshOfferNow(String(req.params.id)) });
});

opsRouter.get("/jobs", async (_req, res) => {
  res.status(200).json({ data: await listOpsJobs() });
});

opsRouter.post("/jobs/:id/retry", async (req, res) => {
  res.status(200).json({ data: await retryJobById(String(req.params.id)) });
});

opsRouter.post("/snapshots/compact", async (_req, res) => {
  res.status(200).json({ data: await compactSnapshotsNow() });
});

opsRouter.get("/alerts", async (_req, res) => {
  res.status(200).json({ data: await listAlerts() });
});

opsRouter.get(
  "/products/search",
  validateQuery(z.object({ q: z.string().trim().min(2).max(80) })),
  async (_req, res) => {
    const query = (res.locals.query as { q: string }).q;
    res.status(200).json({ data: await searchCatalog(query) });
  },
);

opsRouter.post(
  "/products/import",
  validateBody(
    z
      .object({
        asins: z.array(z.string()).max(20).optional(),
        externalIds: z.array(z.string()).max(20).optional(),
        merchantId: z.string().min(1).optional(),
        categoryId: z.string().min(1).optional(),
      })
      .superRefine((body, ctx) => {
        if ((body.asins?.length ?? 0) + (body.externalIds?.length ?? 0) < 1) {
          ctx.addIssue({ code: "custom", message: "Provide at least one ASIN or external id" });
        }
      }),
  ),
  async (req, res) => {
    const body = req.body as {
      asins?: string[];
      externalIds?: string[];
      merchantId?: string;
      categoryId?: string;
    };
    res.status(201).json({
      data: await importProducts({
        asins: body.asins,
        externalIds: body.externalIds,
        merchantId: body.merchantId,
        categoryId: body.categoryId,
      }),
    });
  },
);

opsRouter.post("/products/:id/publish", async (req, res) => {
  const product = await publishProduct(String(req.params.id));
  res.status(200).json({ data: { id: product.id, status: product.status } });
});
