import { Router } from "express";
import { goRateLimit } from "../../middleware/rateLimit.js";
import { goOffer } from "./go.controller.js";

export const goRouter = Router();

goRouter.get("/:offerId", goRateLimit, goOffer);
