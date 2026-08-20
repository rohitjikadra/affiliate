import { Router } from "express";
import { validateBody } from "../../middleware/validate.js";
import { pageViewRateLimit } from "../../middleware/rateLimit.js";
import { create } from "./pageview.controller.js";
import { createPageViewSchema } from "./pageview.schemas.js";

export const pageViewRouter = Router();

pageViewRouter.post("/", pageViewRateLimit, validateBody(createPageViewSchema), create);
