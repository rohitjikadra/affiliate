import { Router } from "express";
import { getBySlug, list } from "./category.controller.js";

export const categoryRouter = Router();

categoryRouter.get("/", list);
categoryRouter.get("/:slug", getBySlug);
