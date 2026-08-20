import { Router } from "express";
import { validateBody } from "../../middleware/validate.js";
import { attachAdmin, requireAdmin } from "../../middleware/requireAdmin.js";
import { loginRateLimit } from "../../middleware/rateLimit.js";
import { login, logout, me } from "./auth.controller.js";
import { loginSchema } from "./auth.schemas.js";

export const authRouter = Router();

authRouter.post("/login", loginRateLimit, validateBody(loginSchema), login);
authRouter.post("/logout", logout);
authRouter.get("/me", attachAdmin, requireAdmin, me);
