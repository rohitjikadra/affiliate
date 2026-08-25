import { Router } from "express";
import { validateBody, validateQuery } from "../../middleware/validate.js";
import { attachAdmin, requireAdmin } from "../../middleware/requireAdmin.js";
import { goRateLimit } from "../../middleware/rateLimit.js";
import { offerRouter } from "../offers/offer.routes.js";
import { z } from "zod";
import {
  create,
  getByIdOrSlug,
  go,
  list,
  priceHistory,
  related,
  remove,
  update,
  updateStatus,
} from "./product.controller.js";
import {
  createProductSchema,
  listProductsQuerySchema,
  productGoSchema,
  productStatusSchema,
  updateProductSchema,
} from "./product.schemas.js";

export const productRouter = Router();

productRouter.use(attachAdmin);

productRouter.get("/", validateQuery(listProductsQuerySchema), list);
productRouter.post("/", requireAdmin, validateBody(createProductSchema), create);
productRouter.post("/:slug/go", goRateLimit, validateBody(productGoSchema), go);
productRouter.get("/:id/related", related);
productRouter.get(
  "/:id/price-history",
  validateQuery(z.object({ range: z.enum(["7d", "30d", "90d"]).optional() })),
  priceHistory,
);
productRouter.use("/:productId/offers", offerRouter);
productRouter.get("/:id", getByIdOrSlug);
productRouter.patch("/:id", requireAdmin, validateBody(updateProductSchema), update);
productRouter.patch("/:id/status", requireAdmin, validateBody(productStatusSchema), updateStatus);
productRouter.delete("/:id", requireAdmin, remove);
