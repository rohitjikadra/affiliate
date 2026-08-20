import { Router } from "express";
import { validateBody } from "../../middleware/validate.js";
import { attachAdmin, requireAdmin } from "../../middleware/requireAdmin.js";
import { create, getById, list, remove, update } from "./merchant.controller.js";
import { createMerchantSchema, updateMerchantSchema } from "./merchant.schemas.js";

export const merchantRouter = Router();

merchantRouter.use(attachAdmin);
merchantRouter.get("/", list);
merchantRouter.post("/", requireAdmin, validateBody(createMerchantSchema), create);
merchantRouter.get("/:id", getById);
merchantRouter.patch("/:id", requireAdmin, validateBody(updateMerchantSchema), update);
merchantRouter.delete("/:id", requireAdmin, remove);
