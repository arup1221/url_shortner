import { shortenPostRequestBodySchema } from "../validation/request.validation.js";
import { nanoid } from "nanoid";
import { createShortUrl } from "../services/url.service.js";
import { db } from "../db/index.js";
import { urlsTable } from "../models/url.model.js";
import { eq, and } from "drizzle-orm";

export const urlShortenController = async (req, res) => {
  const validationResult = await shortenPostRequestBodySchema.safeParseAsync(
    req.body
  );

  if (validationResult.error) {
    return res.status(400).json({ error: validationResult.error });
  }

  const { url, code } = validationResult.data;
  const shortCode = code ?? nanoid(6);

  try {
    const result = await createShortUrl({
      shortCode,
      targetURL: url,
      userId: req.user.id,
    });

    return res.status(201).json(result);
  } catch (error) {
    if (error.code === "DUPLICATE_URL") {
      return res.status(409).json({ error: error.message });
    }

    if (error.code === "CODE_GENERATION_FAILED") {
      return res.status(500).json({ error: error.message });
    }

    console.error("Error creating short URL:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllCodesController = async function (req, res) {
  const codes = await db
    .select()
    .from(urlsTable)
    .where(eq(urlsTable.userId, req.user.id));

  return res.json({ codes });
};

export const deleteDataController = async (req, res) => {
  try {
    const id = req.params.id;
    const [url] = await db
      .select()
      .from(urlsTable)
      .where(and(eq(urlsTable.id, id), eq(urlsTable.userId, req.user.id)))
      .limit(1);

    if (!url) {
      return res.status(403).json({
        error: "Sorry, this URL does not belong to you.",
      });
    }

    await db
      .delete(urlsTable)
      .where(and(eq(urlsTable.id, id), eq(urlsTable.userId, req.user.id)));

    return res.status(200).json({ deleted: true });
  } catch (error) {
    console.error("Error deleting URL:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const redirectUrlController = async function (req, res) {
  const code = req.params.shortCode;
  const [result] = await db
    .select({ targetURL: urlsTable.targetURL })
    .from(urlsTable)
    .where(eq(urlsTable.shortCode, code));

  if (!result) {
    return res.status(404).json({ error: "Invalid URL" });
  }
  return res.redirect(result.targetURL);
};
