import { Router } from "express";
import { validateBody } from "../../middleware/validate.js";
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
  productGoSchema,
  productStatusSchema,
  updateProductSchema,
} from "./product.schemas.js";

export const productRouter = Router();

productRouter.get("/", list);
productRouter.post("/", validateBody(createProductSchema), create);
productRouter.post("/:slug/go", validateBody(productGoSchema), go);
productRouter.get("/:id", getByIdOrSlug);
productRouter.patch("/:id", validateBody(updateProductSchema), update);
productRouter.patch("/:id/status", validateBody(productStatusSchema), updateStatus);
productRouter.delete("/:id", remove);
