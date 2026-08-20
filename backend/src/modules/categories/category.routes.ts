import { Router } from "express";
import { validateBody } from "../../middleware/validate.js";
import { attachAdmin, requireAdmin } from "../../middleware/requireAdmin.js";
import { create, getByIdOrSlug, list, remove, update } from "./category.controller.js";
import { createCategorySchema, updateCategorySchema } from "./category.schemas.js";

export const categoryRouter = Router();

categoryRouter.use(attachAdmin);
categoryRouter.get("/", list);
categoryRouter.post("/", requireAdmin, validateBody(createCategorySchema), create);
categoryRouter.get("/:id", getByIdOrSlug);
categoryRouter.patch("/:id", requireAdmin, validateBody(updateCategorySchema), update);
categoryRouter.delete("/:id", requireAdmin, remove);
