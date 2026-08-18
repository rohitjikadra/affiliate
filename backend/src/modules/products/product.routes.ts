import { Router } from "express";
import { validateBody, validateQuery } from "../../middleware/validate.js";
import { attachAdmin, requireAdmin } from "../../middleware/requireAdmin.js";
import {
  create,
  getByIdOrSlug,
  go,
  list,
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
productRouter.post("/:slug/go", validateBody(productGoSchema), go);
productRouter.get("/:id", getByIdOrSlug);
productRouter.patch("/:id", requireAdmin, validateBody(updateProductSchema), update);
productRouter.patch("/:id/status", requireAdmin, validateBody(productStatusSchema), updateStatus);
productRouter.delete("/:id", requireAdmin, remove);
