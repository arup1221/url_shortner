import express from "express";
import {
  deleteDataController,
  urlShortenController,
  getAllCodesController,
  redirectUrlController,
} from "../controllers/urlshorten.controller.js";
import { ensureAuthencated } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/shorten", ensureAuthencated, urlShortenController);

router.get("/codes", ensureAuthencated, getAllCodesController);

router.delete("/:id", ensureAuthencated, deleteDataController);

router.get("/:shortCode", redirectUrlController);

export default router;
