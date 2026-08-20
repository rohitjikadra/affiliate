import { Router } from "express";
import { categoryRouter } from "../modules/categories/category.routes.js";
import { healthRouter } from "../modules/health/health.routes.js";
import { productRouter } from "../modules/products/product.routes.js";
import { authRouter } from "../modules/auth/auth.routes.js";
import { adminRouter } from "../modules/admin/admin.routes.js";
import { statsRouter } from "../modules/stats/stats.routes.js";
import { guideRouter } from "../modules/guides/guide.routes.js";
import { merchantRouter } from "../modules/merchants/merchant.routes.js";
import { comparisonRouter } from "../modules/comparisons/comparison.routes.js";
import { goRouter } from "../modules/clicks/go.routes.js";
import { pageViewRouter } from "../modules/analytics/pageview.routes.js";
import { sitemapRouter } from "../modules/seo/sitemap.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/admin/stats", statsRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/sitemap", sitemapRouter);
apiRouter.use("/pageviews", pageViewRouter);
apiRouter.use("/go", goRouter);
apiRouter.use("/merchants", merchantRouter);
apiRouter.use("/categories", categoryRouter);
apiRouter.use("/products", productRouter);
apiRouter.use("/guides", guideRouter);
apiRouter.use("/comparisons", comparisonRouter);
