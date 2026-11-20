import "server-only";
import { cache } from "react";
import { database } from "./db";
import { appConfigured } from "./auth";
import { normalizePageConfig, validSlug, type StorePage } from "../model";
import { isSavedPagePublic } from "../publication";

// React cache deduplicates metadata + page reads within one request only.
// Do not persist this result: revoking approval must hide the next public request.
export const publishedPage = cache(async (slug: string): Promise<StorePage | null> => {
  if (!appConfigured() || !validSlug(slug)) return null;
  const page = await database().page.findUnique({ where: { slug }, include: { owner: { select: { status: true } } } });
  if (!page || !isSavedPagePublic(page)) return null;
  return { id: page.id, title: page.title, slug: page.slug, published: true,
    config: normalizePageConfig(page.config), createdAt: page.createdAt.toISOString(), updatedAt: page.updatedAt.toISOString() };
});
