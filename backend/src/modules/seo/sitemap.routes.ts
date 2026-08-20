import { Router } from "express";
import { sitemap } from "./sitemap.controller.js";

export const sitemapRouter = Router();

sitemapRouter.get("/", sitemap);
