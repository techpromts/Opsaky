import { z } from "zod";
import { CATEGORIES, validSlug } from "../model";

const text = (max: number) => z.string().max(max);
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
// Tiny database-backed images only. External sample images are restricted to bundled demo assets.
const image = z.string().max(249999, "Images must be under 250 KB.").refine(s => s === "" || /^data:image\/(?:jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(s), "Upload a compressed JPEG or WebP image.");
const linkUrl = text(2000).refine(value => {
  try {
    const u = new URL(/^\+?[\d\s()-]{7,20}$/.test(value) ? `https://wa.me/${value.replace(/\D/g, "")}` : /^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`);
    return ["https:", "http:", "mailto:", "tel:"].includes(u.protocol);
  } catch { return false; }
}, "Enter a valid website, email, or phone link.");
export const configSchema = z.object({
  category: text(80), customCategories: z.array(z.string().trim().min(1).max(80)).default([]),
  bio: text(400), logo: image, logoShape: z.enum(["circle", "rounded", "cover"]),
  announcement: text(300), showAnnouncement: z.boolean(), announcementMode: z.enum(["pinned", "scroll"]),
  showStatus: z.boolean(), isOpen: z.boolean(), phone: text(40), email: text(160).refine(s => !s || z.string().email().safeParse(s).success, "Enter a valid email."),
  showPhone: z.boolean(), showEmail: z.boolean(),
  theme: text(40), backgroundMode: z.enum(["solid", "gradient", "image"]), background: color, gradientColor: color,
  gradientAngle: z.number().int().min(0).max(360), backgroundImage: image, blur: z.number().min(0).max(30),
  overlay: z.number().min(0).max(100), surface: color, accent: color, buttonColor: color, textColor: color,
  font: z.enum(["sans", "serif", "geometric"]), titleSize: z.number().min(16).max(64),
  material: z.enum(["glass", "shadow", "border"]), buttonShape: z.enum(["pill", "rounded", "sharp", "outline"]),
  animation: z.enum(["lift", "scale", "none"]), showcaseFirst: z.boolean(), galleryMode: z.enum(["carousel", "grid", "featured"]),
  gallery: z.array(z.object({ id: text(80), image, title: text(100), price: text(40), category: text(80).default("") })).max(4),
  links: z.array(z.object({ id: text(80), label: z.string().min(1).max(100), url: linkUrl, active: z.boolean(), message: text(500) })).max(7),
});
export const slugSchema = z.string().refine(validSlug, "Use 3–48 lowercase letters, numbers, or hyphens. This handle may be reserved.");
export const activationSchema = z.object({
  businessName: z.string().trim().min(1).max(100),
  category: z.string().refine(s => CATEGORIES.includes(s), "Choose a business category."),
  phone: z.string().trim().min(5).max(40),
  requestedSlug: slugSchema,
});
export const pageSchema = z.object({ title: z.string().trim().min(1).max(100), slug: slugSchema, published: z.boolean(), config: configSchema });
export const statusSchema = z.object({ status: z.enum(["PENDING", "APPROVED", "REJECTED"]) });
