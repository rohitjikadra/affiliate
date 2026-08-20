import { Router } from "express";
import { validateBody, validateQuery } from "../../middleware/validate.js";
import { attachAdmin, requireAdmin } from "../../middleware/requireAdmin.js";
import { create, getByIdOrSlug, list, remove, update } from "./comparison.controller.js";
import {
  createComparisonSchema,
  listComparisonsQuerySchema,
  updateComparisonSchema,
} from "./comparison.schemas.js";

export const comparisonRouter = Router();

comparisonRouter.use(attachAdmin);
comparisonRouter.get("/", validateQuery(listComparisonsQuerySchema), list);
comparisonRouter.post("/", requireAdmin, validateBody(createComparisonSchema), create);
comparisonRouter.get("/:id", getByIdOrSlug);
comparisonRouter.patch("/:id", requireAdmin, validateBody(updateComparisonSchema), update);
comparisonRouter.delete("/:id", requireAdmin, remove);
