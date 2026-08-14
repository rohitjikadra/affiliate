import { Router } from "express";
import { list } from "./category.controller.js";

export const categoryRouter = Router();

categoryRouter.get("/", list);
