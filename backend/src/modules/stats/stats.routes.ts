import { Router } from "express";
import { attachAdmin, requireAdmin } from "../../middleware/requireAdmin.js";
import { clicks } from "./stats.controller.js";

export const statsRouter = Router();

statsRouter.use(attachAdmin, requireAdmin);
statsRouter.get("/clicks", clicks);
