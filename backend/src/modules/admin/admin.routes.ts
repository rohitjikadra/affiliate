import { Router } from "express";
import { attachAdmin, requireAdmin } from "../../middleware/requireAdmin.js";
import { getConfig } from "./admin.controller.js";

export const adminRouter = Router();

adminRouter.use(attachAdmin, requireAdmin);
adminRouter.get("/config", getConfig);
