export function detectPlatform(value: string): string {
  const lower = value.toLowerCase().trim();
  if (lower.startsWith("mailto:")) return "email";
  if (lower.startsWith("tel:")) return "phone";
  if (/^\+?[\d\s()-]{7,20}$/.test(lower)) return "whatsapp";
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(lower) ? lower : `https://${lower}`);
    const host = url.hostname.replace(/^www\./, "");
    const on = (domain: string) => host === domain || host.endsWith(`.${domain}`);
    if (on("wa.me") || on("whatsapp.com")) return "whatsapp";
    if (on("instagram.com")) return "instagram";
    if (on("tiktok.com")) return "tiktok";
    if (on("facebook.com") || on("fb.com")) return "facebook";
    if (on("snapchat.com")) return "snapchat";
    if (on("x.com") || on("twitter.com")) return "twitter";
    if (on("youtube.com") || on("youtu.be")) return "youtube";
    if (on("maps.google.com") || on("maps.app.goo.gl") || (on("google.com") && url.pathname.startsWith("/maps")) || (on("goo.gl") && url.pathname.startsWith("/maps"))) return "maps";
  } catch { /* An incomplete editor value uses the generic website icon. */ }
  return "website";
}
export function safeHref(value: string, message = ""): string {
  const v = value.trim();
  if (!v) return "#";
  try {
    const candidate = /^\+?[\d\s()-]{7,20}$/.test(v) ? `https://wa.me/${v.replace(/\D/g, "")}` : /^[a-z][a-z\d+.-]*:/i.test(v) ? v : `https://${v}`;
    const url = new URL(candidate);
    if (!["https:", "http:", "mailto:", "tel:"].includes(url.protocol)) return "#";
    if (detectPlatform(candidate) === "whatsapp" && message) url.searchParams.set("text", message);
    return url.toString();
  } catch { return "#"; }
}
function luminance(hex: string) {
  const [r, g, b] = (hex.match(/[0-9a-f]{2}/gi) ?? ["00", "00", "00"]).map(c => {
    const v = parseInt(c, 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
export function contrastRatio(a: string, b: string) {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
export const readableText = (background: string) => contrastRatio(background, "#ffffff") >= contrastRatio(background, "#18221c") ? "#ffffff" : "#18221c";
