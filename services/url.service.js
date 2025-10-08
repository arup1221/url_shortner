// services/url.service.js
import { db } from "../db/index.js";
import { urlsTable } from "../models/url.model.js";
import { eq, and } from "drizzle-orm";

/**
 * Check if a URL already exists for a user
 */
export async function findExistingUrl({ targetURL, userId }) {
  const result = await db
    .select()
    .from(urlsTable)
    .where(
      and(eq(urlsTable.targetURL, targetURL), eq(urlsTable.userId, userId))
    )
    .limit(1);

  return result[0] || null;
}

/**
 * Check if a shortCode already exists
 */
export async function findExistingShortCode({ shortCode }) {
  const result = await db
    .select()
    .from(urlsTable)
    .where(eq(urlsTable.shortCode, shortCode))
    .limit(1);

  return result[0] || null;
}

export async function createShortUrl({ shortCode, targetURL, userId }) {
  // Check duplicate entry for the same user
  const existing = await findExistingUrl({ targetURL, userId });
  if (existing) {
    const error = new Error("This URL is already shortened.");
    error.code = "DUPLICATE_URL";
    throw error;
  }

  // Check if shortCode already exists and generate a new one if needed
  let finalShortCode = shortCode;
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const existingCode = await findExistingShortCode({
      shortCode: finalShortCode,
    });
    if (!existingCode) {
      break; // Code is available
    }

    // Generate a new code by appending a random suffix
    const { nanoid } = await import("nanoid");
    finalShortCode = shortCode + nanoid(2);
    attempts++;
  }

  if (attempts >= maxAttempts) {
    const error = new Error(
      "Unable to generate unique short code. Please try again."
    );
    error.code = "CODE_GENERATION_FAILED";
    throw error;
  }

  // Insert new short URL
  const [result] = await db
    .insert(urlsTable)
    .values({
      shortCode: finalShortCode,
      targetURL,
      userId,
    })
    .returning({
      id: urlsTable.id,
      shortCode: urlsTable.shortCode,
      targetURL: urlsTable.targetURL,
    });

  return result;
}
