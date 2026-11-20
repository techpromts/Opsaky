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
export function getWhatsAppDigits(links: Array<{ url: string }>): string | null {
  for (const { url: value } of links) {
    const valueTrimmed = value.trim();
    if (!valueTrimmed || detectPlatform(valueTrimmed) !== "whatsapp") continue;
    let phone = "";
    if (/^\+?[\d\s()-]{7,20}$/.test(valueTrimmed)) {
      phone = valueTrimmed;
    } else {
      try {
        const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(valueTrimmed) ? valueTrimmed : `https://${valueTrimmed}`);
        phone = url.hostname.replace(/^www\./, "") === "wa.me"
          ? url.pathname.split("/").filter(Boolean)[0] ?? ""
          : url.searchParams.get("phone") ?? "";
      } catch {
        continue;
      }
    }
    const digits = phone.replace(/\D/g, "");
    if (digits.length >= 7 && digits.length <= 20) return digits;
  }
  return null;
}
export function whatsAppOrderUrl(digits: string, itemName: string, price: string): string {
  const name = itemName.trim() || "this item";
  const amount = price.trim();
  const message = `Hi! I'd like to order: ${name}${amount ? ` (${amount})` : ""}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
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
