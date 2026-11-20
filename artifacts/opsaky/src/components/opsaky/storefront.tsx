"use client";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Globe, Mail, MapPin, Phone, Store } from "lucide-react";
import { SiFacebook, SiInstagram, SiSnapchat, SiTiktok, SiWhatsapp, SiX, SiYoutube } from "react-icons/si";
import type { PageConfig, SmartLink } from "@/lib/model";
import { getBusinessStatus } from "@/lib/business-hours";
import { detectPlatform, getWhatsAppDigits, readableText, safeHref, whatsAppOrderUrl } from "@/lib/links";
import { cn } from "@/lib/utils";

export const FONT_STACKS: Record<PageConfig["font"], string> = {
  sans: '"Plus Jakarta Sans", ui-sans-serif, system-ui',
  serif: '"Fraunces", Georgia, serif',
  geometric: '"Syne", "Bricolage Grotesque", ui-sans-serif',
};

export function rgba(hex: string, a: number) {
  const h = (hex || "#000000").replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.padEnd(6, "0").slice(0, 6);
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return `rgba(0,0,0,${a})`;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function ProductCategory({ category, config }: { category?: string; config: PageConfig }) {
  const label = category?.trim();
  if (!label) return null;
  return (
    <span className="inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-[10px] font-bold leading-tight"
      style={{ background: config.accent, color: readableText(config.accent) }}>
      {label}
    </span>
  );
}

function OrderOnWhatsApp({ digits, title, price, interactive, itemId }: {
  digits: string;
  title: string;
  price: string;
  interactive: boolean;
  itemId: string;
}) {
  const href = whatsAppOrderUrl(digits, title, price);
  return (
    <a href={interactive ? href : "#"} target={interactive ? "_blank" : undefined} rel={interactive ? "noopener noreferrer" : undefined}
      onClick={interactive ? undefined : (event) => event.preventDefault()}
      className="mt-2 inline-flex min-h-9 w-full items-center justify-center gap-1 whitespace-nowrap rounded-full bg-[#25D366] px-2 py-2 text-[10px] font-bold text-[#064e3b] transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064e3b] focus-visible:ring-offset-2"
      data-testid={`sf-order-${itemId}`}>
      <SiWhatsapp className="h-3.5 w-3.5 shrink-0" />Order on WhatsApp
    </a>
  );
}

export function PlatformIcon({ url, className }: { url: string; className?: string }) {
  const p = (detectPlatform(url) || "").toLowerCase();
  const c = cn("h-[18px] w-[18px]", className);
  if (p.includes("whatsapp")) return <SiWhatsapp className={c} />;
  if (p.includes("instagram")) return <SiInstagram className={c} />;
  if (p.includes("tiktok")) return <SiTiktok className={c} />;
  if (p.includes("facebook")) return <SiFacebook className={c} />;
  if (p.includes("snap")) return <SiSnapchat className={c} />;
  if (p === "x" || p.includes("twitter")) return <SiX className={c} />;
  if (p.includes("youtube")) return <SiYoutube className={c} />;
  if (p.includes("map") || p.includes("location")) return <MapPin className={c} />;
  if (p.includes("mail")) return <Mail className={c} />;
  if (p.includes("phone") || p.includes("call") || p.includes("tel")) return <Phone className={c} />;
  if (p.includes("store") || p.includes("shop") || p.includes("catalog")) return <Store className={c} />;
  return <Globe className={c} />;
}

export function platformName(url: string) {
  const p = (detectPlatform(url) || "website").toLowerCase();
  const names: Record<string, string> = { whatsapp: "WhatsApp", instagram: "Instagram", tiktok: "TikTok", facebook: "Facebook", snapchat: "Snapchat", x: "X", twitter: "X", youtube: "YouTube", maps: "Google Maps", map: "Google Maps", location: "Location", email: "Email", mail: "Email", phone: "Call", tel: "Call" };
  return names[p] ?? "Website";
}

interface Props {
  title: string;
  config: PageConfig;
  /** inside editor/thumbnail: fills parent, no min-h viewport */
  framed?: boolean;
  interactive?: boolean;
  footer?: ReactNode;
  hideFooter?: boolean;
}

export function Storefront({ title, config: c, framed, interactive = true, footer, hideFooter = false }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [clock, setClock] = useState<number | null>(null);
  useEffect(() => {
    if (!c.businessHoursEnabled) { setClock(null); return; }
    const updateClock = () => setClock(Date.now());
    updateClock();
    const timer = window.setInterval(updateClock, 60_000);
    return () => window.clearInterval(timer);
  }, [c.businessHoursEnabled]);
  const hoursStatus = c.businessHoursEnabled && clock !== null
    ? getBusinessStatus(c.businessHours, c.businessHoursTimezone, new Date(clock))
    : undefined;
  const btnText = c.buttonShape === "outline" ? c.buttonColor : readableText(c.buttonColor);
  const radius = { pill: 999, rounded: 16, sharp: 2, outline: 999 }[c.buttonShape];
  const anim = c.animation === "lift" ? "sf-lift" : c.animation === "scale" ? "sf-scale" : "";
  const activeLinks = c.links.filter((l) => l.active && l.url.trim());
  const whatsappDigits = getWhatsAppDigits(c.links);
  const font = FONT_STACKS[c.font];

  const surface: CSSProperties =
    c.material === "glass"
      ? { background: rgba(c.surface, 0.55), backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: `1px solid ${rgba("#ffffff", 0.35)}`, borderRadius: 20 }
      : c.material === "border"
        ? { background: c.surface, border: `2px solid ${c.textColor}`, boxShadow: `4px 4px 0 ${c.textColor}`, borderRadius: 6 }
        : { background: c.surface, boxShadow: `0 14px 34px -18px ${rgba(c.textColor, 0.45)}`, borderRadius: 20 };

  const bg: CSSProperties =
    c.backgroundMode === "gradient"
      ? { background: `linear-gradient(${c.gradientAngle}deg, ${c.background}, ${c.gradientColor})` }
      : { background: c.background };
  const imageBackground = c.backgroundMode === "image" && Boolean(c.backgroundImage);

  const linkStyle = (): CSSProperties =>
    c.buttonShape === "outline"
      ? { borderRadius: radius, border: `1.5px solid ${c.buttonColor}`, color: c.buttonColor, background: rgba(c.surface, 0.25), backdropFilter: "blur(8px)" }
      : { borderRadius: radius, background: c.buttonColor, color: btnText, ...(c.material === "border" ? { border: `2px solid ${c.textColor}`, boxShadow: `3px 3px 0 ${c.textColor}` } : {}) };

  const announcement = c.showAnnouncement && c.announcement.trim() && (
    <div className="relative z-10 overflow-hidden py-2 text-center text-[12px] font-semibold" style={{ background: c.accent, color: readableText(c.accent) }} data-testid="sf-announcement">
      {c.announcementMode === "scroll" ? (
        <div className="marquee gap-12">
          {[0, 1, 2, 3].map((i) => <span key={i} className="px-6">{c.announcement}</span>)}
        </div>
      ) : <span className="px-4">{c.announcement}</span>}
    </div>
  );

  const logo = c.logo && c.logoShape !== "cover" && (
    <img src={c.logo} alt={`${title} logo`} className={cn("mx-auto h-24 w-24 object-cover", c.logoShape === "circle" ? "rounded-full" : "rounded-[22px]")}
      style={{ boxShadow: `0 10px 30px -12px ${rgba(c.textColor, 0.6)}`, border: `3px solid ${c.surface}` }} />
  );
  const initialBadge = !c.logo && (
    <div className={cn("mx-auto flex h-20 w-20 items-center justify-center text-3xl font-bold", c.logoShape === "circle" ? "rounded-full" : "rounded-[22px]")}
      style={{ background: c.accent, color: readableText(c.accent), fontFamily: font }}>
      {(title || "O").trim().charAt(0).toUpperCase()}
    </div>
  );

  const gallery = c.gallery.length > 0 && (
    <section data-testid="sf-gallery">
      {c.galleryMode === "carousel" && (
        <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1">
          {c.gallery.map((g) => (
            <figure key={g.id} className="w-[72%] shrink-0 snap-center overflow-hidden" style={surface}>
              {g.image && <img src={g.image} alt={g.title} className="aspect-[4/5] w-full object-cover" />}
              {(g.category || g.title || g.price || whatsappDigits) && <figcaption className="px-3 py-2.5 text-[13px]">
                <div className="flex min-w-0 items-center justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-1">
                    <ProductCategory category={g.category} config={c} />
                    {g.title && <span className="block truncate font-semibold">{g.title}</span>}
                  </div>
                  {g.price && <span className="shrink-0 font-bold" style={{ color: c.accent }}>{g.price}</span>}
                </div>
                {whatsappDigits && <OrderOnWhatsApp digits={whatsappDigits} title={g.title} price={g.price} interactive={interactive} itemId={g.id} />}
              </figcaption>}
            </figure>
          ))}
        </div>
      )}
      {c.galleryMode === "grid" && (
        <div className="grid grid-cols-2 gap-2.5">
          {c.gallery.map((g) => (
            <figure key={g.id} className="relative overflow-hidden" style={surface}>
              {g.image && <img src={g.image} alt={g.title} className="aspect-square w-full object-cover" />}
              {(g.category || g.title || g.price || whatsappDigits) && <figcaption className="px-2.5 py-2 text-[12px]">
                <ProductCategory category={g.category} config={c} />
                <div className="truncate font-semibold">{g.title}</div>
                {g.price && <div className="font-bold" style={{ color: c.accent }}>{g.price}</div>}
                {whatsappDigits && <OrderOnWhatsApp digits={whatsappDigits} title={g.title} price={g.price} interactive={interactive} itemId={g.id} />}
              </figcaption>}
            </figure>
          ))}
        </div>
      )}
      {c.galleryMode === "featured" && (
        <div className="space-y-3">
          {c.gallery.map((g) => (
            <figure key={g.id} className="relative overflow-hidden" style={surface}>
              {g.image && <img src={g.image} alt={g.title} className="aspect-[16/10] w-full object-cover" />}
              {g.price && <span className="absolute right-3 top-3 rounded-full px-3 py-1 text-[12px] font-bold shadow-lg" style={{ background: c.accent, color: readableText(c.accent) }}>{g.price}</span>}
              {g.category && <span className="absolute left-3 top-3"><ProductCategory category={g.category} config={c} /></span>}
              {(g.title || whatsappDigits) && <figcaption className="px-4 py-3 text-[14px] font-semibold">
                {g.title && <div>{g.title}</div>}
                {whatsappDigits && <OrderOnWhatsApp digits={whatsappDigits} title={g.title} price={g.price} interactive={interactive} itemId={g.id} />}
              </figcaption>}
            </figure>
          ))}
        </div>
      )}
    </section>
  );

  const links = activeLinks.length > 0 && (
    <nav className="space-y-2.5" data-testid="sf-links">
      {activeLinks.map((l: SmartLink) => (
        <a key={l.id} href={interactive ? safeHref(l.url, l.message) : undefined} target="_blank" rel="noopener noreferrer"
          onClick={interactive ? undefined : (e) => e.preventDefault()} data-testid={`sf-link-${l.id}`}
          className={cn("relative flex h-[52px] items-center justify-center px-12 text-[14.5px] font-semibold", anim)} style={linkStyle()}>
          <span className="absolute left-4 opacity-90"><PlatformIcon url={l.url} /></span>
          <span className="truncate">{l.label || platformName(l.url)}</span>
        </a>
      ))}
    </nav>
  );

  return (
    <div ref={scrollRef} className={cn("relative isolate w-full overflow-hidden", framed ? "min-h-full" : "min-h-screen min-h-[100dvh]")} style={{ ...bg, color: c.textColor, fontFamily: font }}>
      {imageBackground && (
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <img src={c.backgroundImage} alt="" className="absolute -inset-[12%] h-[124%] w-[124%] object-cover"
            style={{ filter: `blur(${c.blur}px)` }} />
          <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${c.overlay / 100})` }} />
          <div className="absolute inset-x-0 top-0 h-40" style={{ background: `linear-gradient(to bottom, ${rgba(c.background, 0.85)}, transparent)` }} />
          <div className="absolute inset-x-0 bottom-0 h-48" style={{ background: `linear-gradient(to top, ${rgba(c.background, 0.92)}, transparent)` }} />
        </div>
      )}
      {announcement}
      {c.logo && c.logoShape === "cover" && (
        <div className="relative h-44 w-full overflow-hidden">
          <img src={c.logo} alt={`${title} cover`} className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 h-16" style={{ background: `linear-gradient(transparent, ${rgba(c.background, c.backgroundMode === "image" ? 0 : 0.9)})` }} />
        </div>
      )}
      <main className={cn("mx-auto w-full max-w-[480px] px-5 pb-10", c.logo && c.logoShape === "cover" ? "-mt-6 pt-0" : "pt-10")}>
        <header className="relative text-center">
          {logo}{c.logoShape !== "cover" && initialBadge}
          <div className={cn("mt-4", imageBackground && "rounded-[28px] px-4 py-5")}
            style={imageBackground ? {
              background: rgba(c.surface, 0.82),
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              border: `1px solid ${rgba(c.textColor, 0.12)}`,
              boxShadow: `0 18px 44px -24px ${rgba(c.textColor, 0.55)}`,
            } : undefined}>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {c.category && <span className="rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.14em]" style={{ background: rgba(c.accent, 0.14), color: c.accent }}>{c.category}</span>}
              {(c.businessHoursEnabled || c.showStatus) && (
                <span data-testid="sf-status" className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.12em]"
                  style={{
                    background: (c.businessHoursEnabled ? hoursStatus?.isOpen : c.isOpen) ? "rgba(31,157,91,.14)" : "rgba(117,128,121,.16)",
                    color: (c.businessHoursEnabled ? hoursStatus?.isOpen : c.isOpen) ? "#168852" : "#68736c",
                  }}>
                  <span className="h-1.5 w-1.5 rounded-full"
                    style={{ background: (c.businessHoursEnabled ? hoursStatus?.isOpen : c.isOpen) ? "#168852" : "#68736c" }} />
                  {c.businessHoursEnabled
                    ? hoursStatus ? (hoursStatus.valid ? (hoursStatus.isOpen ? "Open Now" : "Closed") : "Hours unavailable") : "Checking hours"
                    : c.isOpen ? "Open Now" : "Closed"}
                </span>
              )}
              {c.businessHoursEnabled && hoursStatus?.valid && (
                <span className="rounded-full bg-white/70 px-2.5 py-1 text-[10.5px] font-semibold" data-testid="sf-hours-text">
                  {hoursStatus.hoursText}
                </span>
              )}
            </div>
            <h1 className="mt-3 font-bold leading-[1.05]" style={{ fontSize: c.titleSize, letterSpacing: c.font === "serif" ? "-0.01em" : "-0.025em" }}>{title || "Untitled page"}</h1>
            {c.bio && <p className="mx-auto mt-2 max-w-[34ch] text-[14px] leading-relaxed opacity-80">{c.bio}</p>}
            {((c.showPhone && c.phone) || (c.showEmail && c.email)) && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {c.showPhone && c.phone && (
                  <a href={interactive ? `tel:${c.phone.replace(/[^+\d]/g, "")}` : undefined} className={cn("inline-flex items-center gap-1.5 px-3.5 py-2 text-[12.5px] font-semibold", anim)} style={{ ...surface, borderRadius: 999 }}>
                    <Phone className="h-3.5 w-3.5" style={{ color: c.accent }} />{c.phone}
                  </a>
                )}
                {c.showEmail && c.email && (
                  <a href={interactive ? `mailto:${c.email}` : undefined} className={cn("inline-flex items-center gap-1.5 px-3.5 py-2 text-[12.5px] font-semibold", anim)} style={{ ...surface, borderRadius: 999 }}>
                    <Mail className="h-3.5 w-3.5" style={{ color: c.accent }} />{c.email}
                  </a>
                )}
              </div>
            )}
          </div>
        </header>
        <div className="mt-7 space-y-6">
          {c.showcaseFirst ? <>{gallery}{links}</> : <>{links}{gallery}</>}
          {!gallery && !links && (
            <div className="rounded-2xl border border-dashed px-4 py-8 text-center text-[13px] opacity-60" style={{ borderColor: rgba(c.textColor, 0.3) }}>
              Links and showcase items will appear here.
            </div>
          )}
        </div>
        {!hideFooter && <footer className="mt-10 text-center text-[11px] font-medium tracking-wide opacity-45">
          {footer ?? "Powered by Opsaky"}
        </footer>}
      </main>
    </div>
  );
}

/** Scaled-down, non-interactive thumbnail of a storefront. */
export function StoreThumb({ title, config, height = 360, scale = 0.62 }: { title: string; config: PageConfig; height?: number; scale?: number }) {
  const w = 390;
  return (
    <div className="relative overflow-hidden" style={{ height }}>
      <div className="pointer-events-none absolute left-1/2 top-0 origin-top" style={{ width: w, height: height / scale, transform: `translateX(-50%) scale(${scale})` }}>
        <Storefront title={title} config={config} framed interactive={false} />
      </div>
    </div>
  );
}

export function PhoneFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative mx-auto w-[340px] rounded-[48px] bg-ink p-[11px] shadow-[0_40px_80px_-30px_rgba(23,32,30,.6)]", className)}>
      <div className="absolute left-1/2 top-[18px] z-20 h-[24px] w-[92px] -translate-x-1/2 rounded-full bg-ink" />
      <div className="thin-scroll relative h-[680px] overflow-y-auto overflow-x-hidden rounded-[38px] bg-paper">
        {children}
      </div>
    </div>
  );
}
