export type AccountStatus = "PENDING" | "APPROVED" | "REJECTED";
export interface Account {
  id: string; email: string; businessName: string; category: string;
  phone: string; requestedSlug: string; status: AccountStatus; pageCount: number;
}
export interface SmartLink { id: string; label: string; url: string; active: boolean; message: string }
export interface GalleryItem { id: string; image: string; title: string; price: string; category?: string }
export const BUSINESS_DAYS = [
  { id: "sun", label: "Sunday" },
  { id: "mon", label: "Monday" },
  { id: "tue", label: "Tuesday" },
  { id: "wed", label: "Wednesday" },
  { id: "thu", label: "Thursday" },
  { id: "fri", label: "Friday" },
  { id: "sat", label: "Saturday" },
] as const;
export type BusinessDay = typeof BUSINESS_DAYS[number]["id"];
export interface BusinessDayHours { open: string; close: string; closed: boolean; is24Hours?: boolean }
export type BusinessHours = Record<BusinessDay, BusinessDayHours>;
export const MAX_GALLERY_ITEMS = 12;
export const defaultBusinessHours = (): BusinessHours => Object.fromEntries(
  BUSINESS_DAYS.map(({ id }) => [id, { open: "09:00", close: "17:00", closed: false, is24Hours: false }]),
) as BusinessHours;
export interface PageConfig {
  category: string; customCategories?: string[]; bio: string; logo: string; logoShape: "circle" | "rounded" | "cover";
  announcement: string; showAnnouncement: boolean; announcementMode: "pinned" | "scroll";
  showStatus: boolean; isOpen: boolean; phone: string; email: string; showPhone: boolean; showEmail: boolean;
  businessHoursEnabled: boolean; is24_7?: boolean; businessHoursTimezone: string; businessHours: BusinessHours;
  theme: string; backgroundMode: "solid" | "gradient" | "image"; background: string; gradientColor: string;
  gradientAngle: number; backgroundImage: string; blur: number; overlay: number;
  surface: string; accent: string; buttonColor: string; textColor: string;
  font: "sans" | "serif" | "geometric"; titleSize: number;
  material: "glass" | "shadow" | "border"; buttonShape: "pill" | "rounded" | "sharp" | "outline";
  animation: "lift" | "scale" | "none"; showcaseFirst: boolean;
  galleryMode: "carousel" | "grid" | "featured"; gallery: GalleryItem[]; links: SmartLink[];
}
export interface StorePage {
  id: string; title: string; slug: string; published: boolean; config: PageConfig;
  createdAt: string; updatedAt: string;
}
export interface ActivationInput { businessName: string; category: string; phone: string; requestedSlug: string }
export const CATEGORIES = ["Restaurant/Cafe", "Fashion/Apparel", "Perfumes/Beauty", "Electronics", "Home Business", "Other"];
export const THEMES = [
  { id: "cream", name: "Minimalist Cream", background: "#f4f0e8", surface: "#ffffff", accent: "#837053", buttonColor: "#343c31", textColor: "#30392f" },
  { id: "noir", name: "Luxury Noir", background: "#171715", surface: "#292925", accent: "#d5b879", buttonColor: "#d5b879", textColor: "#f5eddb" },
  { id: "appetite", name: "Vibrant Appetite", background: "#fff2e7", surface: "#ffffff", accent: "#d8502e", buttonColor: "#d8502e", textColor: "#492b25" },
  { id: "tech", name: "Modern Tech", background: "#eaf0ff", surface: "#ffffff", accent: "#4169e1", buttonColor: "#2545ab", textColor: "#172b53" },
  { id: "studio", name: "Clean Studio White", background: "#fafafa", surface: "#ffffff", accent: "#242424", buttonColor: "#242424", textColor: "#242424" },
];
export const defaultConfig = (): PageConfig => ({
  category: "Other", customCategories: [], bio: "A little more about what makes us, us.", logo: "", logoShape: "circle",
  announcement: "Something good is here. Discover our latest collection.", showAnnouncement: false, announcementMode: "pinned",
  showStatus: false, isOpen: true, phone: "", email: "", showPhone: false, showEmail: false,
  businessHoursEnabled: false, is24_7: false, businessHoursTimezone: "Asia/Amman", businessHours: defaultBusinessHours(),
  theme: "cream", backgroundMode: "solid", background: "#f4f0e8", gradientColor: "#e1e9db", gradientAngle: 135,
  backgroundImage: "", blur: 0, overlay: 20, surface: "#ffffff", accent: "#837053", buttonColor: "#343c31",
  textColor: "#30392f", font: "sans", titleSize: 28, material: "glass", buttonShape: "rounded", animation: "lift",
  showcaseFirst: true, galleryMode: "grid", gallery: [], links: [],
});
export function normalizePageConfig(value: unknown): PageConfig {
  const defaults = defaultConfig();
  const saved = value && typeof value === "object" ? value as Partial<PageConfig> : {};
  const savedHours = saved.businessHours as Partial<BusinessHours> | undefined;
  const businessHours = Object.fromEntries(
    BUSINESS_DAYS.map(({ id }) => [id, { ...defaults.businessHours[id], ...(savedHours?.[id] ?? {}) }]),
  ) as BusinessHours;
  return {
    ...defaults,
    ...saved,
    gallery: Array.isArray(saved.gallery) ? saved.gallery : defaults.gallery,
    links: Array.isArray(saved.links) ? saved.links : defaults.links,
    businessHours,
  } as PageConfig;
}
export const newPage = (title: string, slug: string): StorePage => ({
  id: crypto.randomUUID(), title, slug, published: false, config: defaultConfig(),
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
});
export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
export const RESERVED_SLUGS = ["api", "admin", "dashboard", "demo", "sign-in", "sign-up", "sso-callback", "settings", "templates", "help", "favicon", "robots", "sitemap", "_next"];
export const validSlug = (s: string) => /^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$/.test(s) && !RESERVED_SLUGS.includes(s);
