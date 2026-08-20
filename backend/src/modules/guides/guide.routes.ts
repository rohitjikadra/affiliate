import { Router } from "express";
import { validateBody, validateQuery } from "../../middleware/validate.js";
import { attachAdmin, requireAdmin } from "../../middleware/requireAdmin.js";
import { create, getByIdOrSlug, list, remove, update } from "./guide.controller.js";
import { createGuideSchema, listGuidesQuerySchema, updateGuideSchema } from "./guide.schemas.js";

export const guideRouter = Router();

guideRouter.use(attachAdmin);
guideRouter.get("/", validateQuery(listGuidesQuerySchema), list);
guideRouter.post("/", requireAdmin, validateBody(createGuideSchema), create);
guideRouter.get("/:id", getByIdOrSlug);
guideRouter.patch("/:id", requireAdmin, validateBody(updateGuideSchema), update);
guideRouter.delete("/:id", requireAdmin, remove);
