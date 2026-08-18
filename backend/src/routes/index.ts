import { Router } from "express";
import { categoryRouter } from "../modules/categories/category.routes.js";
import { healthRouter } from "../modules/health/health.routes.js";
import { productRouter } from "../modules/products/product.routes.js";
import { authRouter } from "../modules/auth/auth.routes.js";
import { statsRouter } from "../modules/stats/stats.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/admin/stats", statsRouter);
apiRouter.use("/categories", categoryRouter);
apiRouter.use("/products", productRouter);
