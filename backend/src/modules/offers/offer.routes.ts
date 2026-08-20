import { Router } from "express";
import { validateBody } from "../../middleware/validate.js";
import { attachAdmin, requireAdmin } from "../../middleware/requireAdmin.js";
import { create, list, remove, update } from "./offer.controller.js";
import { createOfferSchema, updateOfferSchema } from "./offer.schemas.js";

export const offerRouter = Router({ mergeParams: true });

offerRouter.use(attachAdmin);
offerRouter.get("/", requireAdmin, list);
offerRouter.post("/", requireAdmin, validateBody(createOfferSchema), create);
offerRouter.patch("/:offerId", requireAdmin, validateBody(updateOfferSchema), update);
offerRouter.delete("/:offerId", requireAdmin, remove);
