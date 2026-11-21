"use client";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, Globe, Mail, MapPin, Phone, Store } from "lucide-react";
import { SiFacebook, SiInstagram, SiSnapchat, SiTiktok, SiWhatsapp, SiX, SiYoutube } from "react-icons/si";
import type { GalleryItem, PageConfig, SmartLink } from "@/lib/model";
import { getBusinessStatus } from "@/lib/business-hours";
import { detectPlatform, getWhatsAppDigits, readableText, safeHref, whatsAppOrderUrl } from "@/lib/links";
import { cn } from "@/lib/utils";

type GalleryItemWithOrder = GalleryItem & {
  whatsappOrder?: boolean;
};

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

function toHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;
}

function isDarkColor(color: string) {
  const m = color.match(/\d+/g);
  if (color.startsWith("rgb") && m && m.length >= 3) {
    const [r, g, b] = m.map(Number);
    return 0.299 * r + 0.587 * g + 0.114 * b < 140;
  }
  const h = color.replace("#", "");
  if (h.length >= 6) {
    const n = parseInt(h.slice(0, 6), 16);
    const r = (n >> 16) & 255,
      g = (n >> 8) & 255,
      b = n & 255;
    return 0.299 * r + 0.587 * g + 0.114 * b < 140;
  }
  return false;
}

function resolveWhatsAppDigits(links: SmartLink[], phone?: string) {
  const fromLinks = getWhatsAppDigits(links);
  if (fromLinks) return fromLinks;
  const digits = (phone || "").replace(/\D/g, "");
  return digits.length >= 8 ? digits : "";
}

function extractEdgeColor(src: string, overlayPct: number, fallback: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    if (!src.startsWith("data:")) img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(fallback);
          return;
        }
        ctx.drawImage(img, 0, 0, 16, 16);
        const { data } = ctx.getImageData(0, 0, 16, 16);
        let r = 0,
          g = 0,
          b = 0,
          count = 0;
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            if (y < 3 || y > 12 || x < 2 || x > 13) {
              const i = (y * 16 + x) * 4;
              r += data[i];
              g += data[i + 1];
              b += data[i + 2];
              count++;
            }
          }
        }
        const dim = 1 - Math.min(Math.max(overlayPct, 0), 100) / 100;
        resolve(toHex((r / count) * dim, (g / count) * dim, (b / count) * dim));
      } catch {
        resolve(fallback);
      }
    };
    img.onerror = () => resolve(fallback);
    img.src = src;
  });
}

function ProductCategory({ category, config }: { category?: string; config: PageConfig }) {
  const label = category?.trim();
  if (!label) return null;
  return (
    <span
      className="inline-flex max-w-full items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider shadow-sm backdrop-blur-md"
      style={{
        background: rgba(config.accent, 0.92),
        color: readableText(config.accent),
        border: `1px solid ${rgba("#ffffff", 0.35)}`,
      }}
    >
      {label}
    </span>
  );
}

function OrderOnWhatsApp({
  digits,
  title,
  price,
  interactive,
  itemId,
}: {
  digits: string;
  title: string;
  price: string;
  interactive: boolean;
  itemId: string;
}) {
  const href = whatsAppOrderUrl(digits, title, price);
  return (
    <a
      href={interactive ? href : "#"}
      target={interactive ? "_blank" : undefined}
      rel={interactive ? "noopener noreferrer" : undefined}
      onClick={interactive ? undefined : (event) => event.preventDefault()}
      className="group/wa relative mt-3 flex h-10 w-full items-center justify-center gap-1.5 overflow-hidden rounded-2xl bg-gradient-to-b from-[#2be06e] to-[#1fb858] px-3 text-[12px] font-extrabold text-[#042f22] shadow-[0_10px_22px_-8px_rgba(37,211,102,0.7),inset_0_1px_0_0_rgba(255,255,255,0.5)] transition-all duration-200 hover:brightness-105 active:scale-[0.97]"
      data-testid={`sf-order-${itemId}`}
    >
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover/wa:translate-x-full" />
      <SiWhatsapp className="h-4 w-4 shrink-0" />
      <span>Order on WhatsApp</span>
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
  const names: Record<string, string> = {
    whatsapp: "WhatsApp",
    instagram: "Instagram",
    tiktok: "TikTok",
    facebook: "Facebook",
    snapchat: "Snapchat",
    x: "X",
    twitter: "X",
    youtube: "YouTube",
    maps: "Google Maps",
    map: "Google Maps",
    location: "Location",
    email: "Email",
    mail: "Email",
    phone: "Call",
    tel: "Call",
  };
  return names[p] ?? "Website";
}

interface Props {
  title: string;
  config: PageConfig;
  framed?: boolean;
  interactive?: boolean;
  footer?: ReactNode;
  hideFooter?: boolean;
}

export function Storefront({ title, config: c, framed, interactive = true, footer, hideFooter = true }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [clock, setClock] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [bgLoaded, setBgLoaded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setBgLoaded(false);
  }, [c.backgroundImage]);

  useEffect(() => {
    if (!c.businessHoursEnabled) {
      setClock(null);
      return;
    }
    const updateClock = () => setClock(Date.now());
    updateClock();
    const timer = window.setInterval(updateClock, 60_000);
    return () => window.clearInterval(timer);
  }, [c.businessHoursEnabled]);

  const hoursStatus =
    c.businessHoursEnabled && clock !== null
      ? getBusinessStatus(c.businessHours, c.businessHoursTimezone, new Date(clock), Boolean(c.is24_7))
      : undefined;

  const btnText = c.buttonShape === "outline" ? c.buttonColor : readableText(c.buttonColor);
  const radius = { pill: 999, rounded: 20, sharp: 8, outline: 999 }[c.buttonShape];
  const anim = c.animation === "lift" ? "sf-lift" : c.animation === "scale" ? "sf-scale" : "";
  const activeLinks = c.links.filter((l) => l.active && l.url.trim());
  const whatsappDigits = resolveWhatsAppDigits(c.links, c.phone);
  const font = FONT_STACKS[c.font];
  const imageBackground = c.backgroundMode === "image" && Boolean(c.backgroundImage);
  const darkSurface = isDarkColor(c.surface);
  const items = c.gallery as GalleryItemWithOrder[];

  useEffect(() => {
    if (typeof document === "undefined" || !imageBackground || !c.backgroundImage) return;
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = c.backgroundImage;
    document.head.appendChild(link);
    return () => {
      link.remove();
    };
  }, [imageBackground, c.backgroundImage]);

  useEffect(() => {
    if (framed || typeof document === "undefined") return;
    let active = true;
    const prevBodyBg = document.body.style.backgroundColor;
    const prevHtmlBg = document.documentElement.style.backgroundColor;
    const prevColorScheme = document.documentElement.style.colorScheme;

    const upsertMeta = (name: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      const created = !el;
      if (!el) {
        el = document.createElement("meta");
        el.name = name;
        document.head.appendChild(el);
      }
      return { el, created, prev: el.content };
    };

    const themeMeta = upsertMeta("theme-color");
    const navMeta = upsertMeta("msapplication-navbutton-color");
    const statusMeta = upsertMeta("apple-mobile-web-app-status-bar-style");

    const applyChromeColor = (hexColor: string) => {
      if (!active) return;
      document.body.style.backgroundColor = hexColor;
      document.documentElement.style.backgroundColor = hexColor;
      document.documentElement.style.colorScheme = isDarkColor(hexColor) ? "dark" : "light";
      themeMeta.el.content = hexColor;
      navMeta.el.content = hexColor;
      statusMeta.el.content = isDarkColor(hexColor) ? "black-translucent" : "default";
    };

    if (imageBackground && c.backgroundImage) {
      applyChromeColor(c.background);
      void extractEdgeColor(c.backgroundImage, c.overlay, c.background).then(applyChromeColor);
    } else {
      applyChromeColor(c.background);
    }

    return () => {
      active = false;
      document.body.style.backgroundColor = prevBodyBg;
      document.documentElement.style.backgroundColor = prevHtmlBg;
      document.documentElement.style.colorScheme = prevColorScheme;
      for (const m of [themeMeta, navMeta, statusMeta]) {
        if (m.created) m.el.remove();
        else m.el.content = m.prev;
      }
    };
  }, [framed, imageBackground, c.backgroundImage, c.overlay, c.background]);

  const liquidGlassStyle: CSSProperties = {
    background: darkSurface
      ? `linear-gradient(155deg, ${rgba(c.surface, imageBackground ? 0.52 : 0.68)} 0%, ${rgba(c.surface, imageBackground ? 0.34 : 0.5)} 100%)`
      : `linear-gradient(155deg, ${rgba("#ffffff", imageBackground ? 0.54 : 0.78)} 0%, ${rgba(c.surface, imageBackground ? 0.36 : 0.62)} 100%)`,
    backdropFilter: "blur(32px) saturate(195%) brightness(1.05)",
    WebkitBackdropFilter: "blur(32px) saturate(195%) brightness(1.05)",
    border: `1px solid ${rgba("#ffffff", darkSurface ? 0.24 : 0.68)}`,
    boxShadow: [
      `0 24px 48px -20px ${rgba("#000000", 0.36)}`,
      `0 4px 14px -4px ${rgba("#000000", 0.14)}`,
      `inset 0 1.5px 0 0 ${rgba("#ffffff", darkSurface ? 0.38 : 0.88)}`,
      `inset 0 -1px 0 0 ${rgba("#ffffff", darkSurface ? 0.08 : 0.25)}`,
    ].join(", "),
    borderRadius: 30,
  };

  const surface: CSSProperties =
    c.material === "border"
      ? { background: c.surface, border: `2px solid ${c.textColor}`, boxShadow: `4px 4px 0 ${c.textColor}`, borderRadius: 18 }
      : liquidGlassStyle;

  const bg: CSSProperties = imageBackground
    ? { background: framed ? c.background : "transparent" }
    : c.backgroundMode === "gradient"
      ? { background: `linear-gradient(${c.gradientAngle}deg, ${c.background}, ${c.gradientColor})` }
      : { background: c.background };

  const linkStyle = (): CSSProperties =>
    c.buttonShape === "outline"
      ? {
          borderRadius: radius,
          border: `1.5px solid ${rgba("#ffffff", darkSurface ? 0.32 : 0.72)}`,
          color: c.textColor,
          background: darkSurface
            ? `linear-gradient(160deg, ${rgba(c.surface, 0.48)}, ${rgba(c.surface, 0.28)})`
            : `linear-gradient(160deg, ${rgba("#ffffff", 0.58)}, ${rgba(c.surface, 0.38)})`,
          backdropFilter: "blur(26px) saturate(180%)",
          WebkitBackdropFilter: "blur(26px) saturate(180%)",
          boxShadow: `0 12px 28px -12px ${rgba("#000000", 0.28)}, inset 0 1.5px 0 0 ${rgba("#ffffff", darkSurface ? 0.3 : 0.82)}`,
        }
      : {
          borderRadius: radius,
          background: `linear-gradient(180deg, ${rgba(c.buttonColor, 0.96)} 0%, ${c.buttonColor} 100%)`,
          color: btnText,
          border: c.material === "border" ? `2px solid ${c.textColor}` : `1px solid ${rgba("#ffffff", 0.24)}`,
          boxShadow:
            c.material === "border"
              ? `3px 3px 0 ${c.textColor}`
              : `0 14px 28px -12px ${rgba(c.buttonColor, 0.65)}, inset 0 1.5px 0 0 ${rgba("#ffffff", 0.36)}`,
        };

  const announcement = c.showAnnouncement && c.announcement.trim() && (
    <div
      className="relative z-20 overflow-hidden py-2 text-center text-[12px] font-bold tracking-wide backdrop-blur-xl"
      style={{
        background: rgba(c.accent, 0.9),
        color: readableText(c.accent),
        borderBottom: `1px solid ${rgba("#ffffff", 0.25)}`,
      }}
      data-testid="sf-announcement"
    >
      {c.announcementMode === "scroll" ? (
        <div className="marquee gap-12">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="px-6">
              {c.announcement}
            </span>
          ))}
        </div>
      ) : (
        <span className="px-4">{c.announcement}</span>
      )}
    </div>
  );

  const logo = c.logo && c.logoShape !== "cover" && (
    <div className="relative mx-auto w-fit">
      <img
        src={c.logo}
        alt={`${title} logo`}
        className={cn("mx-auto h-24 w-24 object-cover", c.logoShape === "circle" ? "rounded-full" : "rounded-[26px]")}
        style={{
          boxShadow: `0 16px 36px -10px ${rgba("#000000", 0.5)}, 0 0 0 1px ${rgba("#ffffff", 0.35)}`,
          border: `3px solid ${rgba("#ffffff", 0.85)}`,
        }}
      />
    </div>
  );

  const initialBadge = !c.logo && (
    <div
      className={cn(
        "mx-auto flex h-20 w-20 items-center justify-center text-3xl font-extrabold shadow-xl",
        c.logoShape === "circle" ? "rounded-full" : "rounded-[26px]"
      )}
      style={{
        background: `linear-gradient(145deg, ${c.accent}, ${rgba(c.accent, 0.82)})`,
        color: readableText(c.accent),
        fontFamily: font,
        border: `2.5px solid ${rgba("#ffffff", 0.72)}`,
        boxShadow: `0 16px 34px -12px ${rgba(c.accent, 0.65)}, inset 0 1.5px 0 0 ${rgba("#ffffff", 0.5)}`,
      }}
    >
      {(title || "O").trim().charAt(0).toUpperCase()}
    </div>
  );

  const gallery = items.length > 0 && (
    <section data-testid="sf-gallery">
      {c.galleryMode === "carousel" && (
        <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-5 pb-2">
          {items.map((g) => {
            const showOrder = Boolean(g.whatsappOrder && whatsappDigits);
            return (
              <figure
                key={g.id}
                className="group w-[74%] shrink-0 snap-center overflow-hidden transition-transform duration-300"
                style={surface}
              >
                {g.image && (
                  <div className="relative overflow-hidden">
                    <img
                      src={g.image}
                      alt={g.title}
                      className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent" />
                  </div>
                )}
                {(g.category || g.title || g.price || showOrder) && (
                  <figcaption className="p-3.5 text-[13px]">
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 space-y-1">
                        <ProductCategory category={g.category} config={c} />
                        {g.title && <span className="block truncate text-[14.5px] font-extrabold">{g.title}</span>}
                      </div>
                      {g.price && (
                        <span
                          className="shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-extrabold backdrop-blur-md"
                          style={{
                            background: rgba(c.accent, 0.2),
                            color: c.accent,
                            border: `1px solid ${rgba(c.accent, 0.35)}`,
                          }}
                        >
                          {g.price}
                        </span>
                      )}
                    </div>
                    {showOrder && (
                      <OrderOnWhatsApp
                        digits={whatsappDigits}
                        title={g.title}
                        price={g.price}
                        interactive={interactive}
                        itemId={g.id}
                      />
                    )}
                  </figcaption>
                )}
              </figure>
            );
          })}
        </div>
      )}
      {c.galleryMode === "grid" && (
        <div className="grid grid-cols-2 gap-3">
          {items.map((g) => {
            const showOrder = Boolean(g.whatsappOrder && whatsappDigits);
            return (
              <figure
                key={g.id}
                className="group relative flex flex-col justify-between overflow-hidden"
                style={surface}
              >
                {g.image && (
                  <div className="overflow-hidden">
                    <img
                      src={g.image}
                      alt={g.title}
                      className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  </div>
                )}
                {(g.category || g.title || g.price || showOrder) && (
                  <figcaption className="flex flex-1 flex-col justify-between p-3 text-[12px]">
                    <div className="space-y-1">
                      <ProductCategory category={g.category} config={c} />
                      {g.title && <div className="line-clamp-2 text-[13px] font-extrabold leading-snug">{g.title}</div>}
                      {g.price && (
                        <div className="font-extrabold" style={{ color: c.accent }}>
                          {g.price}
                        </div>
                      )}
                    </div>
                    {showOrder && (
                      <OrderOnWhatsApp
                        digits={whatsappDigits}
                        title={g.title}
                        price={g.price}
                        interactive={interactive}
                        itemId={g.id}
                      />
                    )}
                  </figcaption>
                )}
              </figure>
            );
          })}
        </div>
      )}
      {c.galleryMode === "featured" && (
        <div className="space-y-3.5">
          {items.map((g) => {
            const showOrder = Boolean(g.whatsappOrder && whatsappDigits);
            return (
              <figure key={g.id} className="group relative overflow-hidden" style={surface}>
                {g.image && (
                  <div className="overflow-hidden">
                    <img
                      src={g.image}
                      alt={g.title}
                      className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                )}
                {g.price && (
                  <span
                    className="absolute right-3 top-3 rounded-full px-3 py-1 text-[12px] font-extrabold shadow-lg backdrop-blur-md"
                    style={{
                      background: c.accent,
                      color: readableText(c.accent),
                      border: `1px solid ${rgba("#ffffff", 0.35)}`,
                    }}
                  >
                    {g.price}
                  </span>
                )}
                {g.category && (
                  <span className="absolute left-3 top-3">
                    <ProductCategory category={g.category} config={c} />
                  </span>
                )}
                {(g.title || showOrder) && (
                  <figcaption className="p-4 text-[14px] font-bold">
                    {g.title && <div className="text-[15.5px] font-extrabold">{g.title}</div>}
                    {showOrder && (
                      <OrderOnWhatsApp
                        digits={whatsappDigits}
                        title={g.title}
                        price={g.price}
                        interactive={interactive}
                        itemId={g.id}
                      />
                    )}
                  </figcaption>
                )}
              </figure>
            );
          })}
        </div>
      )}
    </section>
  );

  const links = activeLinks.length > 0 && (
    <nav className="space-y-2.5" data-testid="sf-links">
      {activeLinks.map((l: SmartLink) => {
        const isWa = (detectPlatform(l.url) || "").toLowerCase().includes("whatsapp");
        return (
          <a
            key={l.id}
            href={interactive ? safeHref(l.url, l.message) : undefined}
            target="_blank"
            rel="noopener noreferrer"
            onClick={interactive ? undefined : (e) => e.preventDefault()}
            data-testid={`sf-link-${l.id}`}
            className={cn(
              "group/link relative flex h-[56px] items-center justify-center overflow-hidden px-12 text-[14.5px] font-extrabold tracking-tight transition-all duration-200 active:scale-[0.97]",
              anim
            )}
            style={linkStyle()}
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover/link:translate-x-full" />
            <span className={cn("absolute left-4 opacity-95", isWa && "text-[#25D366]")}>
              <PlatformIcon url={l.url} />
            </span>
            <span className="truncate">{l.label || platformName(l.url)}</span>
            <ArrowUpRight className="absolute right-4 h-4 w-4 opacity-45 transition-transform duration-200 group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5 group-hover/link:opacity-85" />
          </a>
        );
      })}
    </nav>
  );

  const isOpenNow = c.businessHoursEnabled ? hoursStatus?.isOpen : c.isOpen;
  const showStatusBadge = c.businessHoursEnabled || c.showStatus;

  const fullScreenBackground =
    imageBackground &&
    !framed &&
    mounted &&
    createPortal(
      <div
        aria-hidden="true"
        className="pointer-events-none fixed z-0 overflow-hidden"
        style={{
          top: "-45lvh",
          bottom: "-45lvh",
          left: "-25vw",
          right: "-25vw",
          backgroundColor: c.background,
        }}
      >
        <img
          src={c.backgroundImage}
          alt=""
          loading="eager"
          decoding="sync"
          fetchPriority="high"
          onLoad={() => setBgLoaded(true)}
          className={cn(
            "h-full w-full scale-110 object-cover object-center transition-opacity duration-300",
            bgLoaded ? "opacity-100" : "opacity-0"
          )}
          style={{ filter: `blur(${c.blur}px)` }}
        />
        <div className="absolute inset-0" style={{ background: `rgba(0, 0, 0, ${c.overlay / 100})` }} />
      </div>,
      document.body
    );

  return (
    <>
      {fullScreenBackground}
      <div
        ref={scrollRef}
        className={cn("relative z-10 w-full overflow-x-hidden", framed ? "min-h-full" : "min-h-[100dvh]")}
        style={{ ...bg, color: c.textColor, fontFamily: font }}
      >
        {imageBackground && framed && (
          <div
            className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
            style={{ backgroundColor: c.background }}
          >
            <img
              src={c.backgroundImage}
              alt=""
              loading="eager"
              decoding="sync"
              fetchPriority="high"
              onLoad={() => setBgLoaded(true)}
              className={cn(
                "h-full w-full scale-110 object-cover object-center transition-opacity duration-200",
                bgLoaded ? "opacity-100" : "opacity-0"
              )}
              style={{ filter: `blur(${c.blur}px)` }}
            />
            <div className="absolute inset-0" style={{ background: `rgba(0, 0, 0, ${c.overlay / 100})` }} />
          </div>
        )}

        {announcement}

        {c.logo && c.logoShape === "cover" && (
          <div className="relative z-10 h-44 w-full overflow-hidden">
            <img src={c.logo} alt={`${title} cover`} className="h-full w-full object-cover" />
            <div
              className="absolute inset-x-0 bottom-0 h-20"
              style={{ background: `linear-gradient(transparent, ${rgba(c.background, imageBackground ? 0 : 0.85)})` }}
            />
          </div>
        )}

        <main
          className={cn(
            "relative z-10 mx-auto w-full max-w-[480px] px-5",
            c.logo && c.logoShape === "cover" ? "-mt-6 pt-0" : "pt-10"
          )}
          style={{ paddingBottom: framed ? "2.75rem" : "calc(env(safe-area-inset-bottom) + 4.5rem)" }}
        >
          <header className="relative text-center">
            <div className="relative z-10">
              {logo}
              {c.logoShape !== "cover" && initialBadge}
            </div>

            <div
              className={cn("relative px-6 pb-6", c.logoShape !== "cover" ? "-mt-10 pt-14" : "mt-4 pt-6")}
              style={liquidGlassStyle}
            >
              {c.category && (
                <div
                  className="text-[10.5px] font-extrabold uppercase tracking-[0.22em]"
                  style={{ color: c.accent }}
                >
                  {c.category}
                </div>
              )}

              <h1
                className="mt-1.5 font-extrabold leading-[1.08] tracking-tight"
                style={{ fontSize: c.titleSize, letterSpacing: c.font === "serif" ? "-0.01em" : "-0.025em" }}
              >
                {title || "Untitled page"}
              </h1>

              {c.bio && (
                <p className="mx-auto mt-2 max-w-[32ch] text-[13.5px] leading-relaxed opacity-80">{c.bio}</p>
              )}

              {(showStatusBadge || (c.showEmail && c.email) || (c.showPhone && c.phone)) && (
                <div
                  className="mt-5 flex flex-col items-center gap-2.5 border-t pt-4"
                  style={{ borderColor: rgba(c.textColor, 0.1) }}
                >
                  {showStatusBadge && (
                    <div
                      data-testid="sf-status"
                      className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11.5px] font-bold backdrop-blur-md"
                      style={{
                        background: isOpenNow ? "rgba(22, 163, 74, 0.16)" : "rgba(220, 38, 38, 0.16)",
                        color: isOpenNow ? "#15803d" : "#b91c1c",
                        border: `1px solid ${isOpenNow ? "rgba(22, 163, 74, 0.25)" : "rgba(220, 38, 38, 0.25)"}`,
                      }}
                    >
                      <span
                        className={cn("h-2 w-2 rounded-full", isOpenNow && "animate-pulse")}
                        style={{ background: isOpenNow ? "#16a34a" : "#dc2626" }}
                      />
                      <span>
                        {c.businessHoursEnabled
                          ? hoursStatus
                            ? hoursStatus.valid
                              ? hoursStatus.isOpen
                                ? "Open Now"
                                : "Closed"
                              : "Hours unavailable"
                            : "Checking"
                          : c.isOpen
                            ? "Open Now"
                            : "Closed"}
                      </span>
                      {c.businessHoursEnabled && hoursStatus?.valid && (
                        <>
                          <span className="opacity-35">•</span>
                          <span className="font-semibold opacity-90" data-testid="sf-hours-text">
                            {hoursStatus.hoursText}
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  {c.showEmail && c.email && (
                    <a
                      href={interactive ? `mailto:${c.email}` : undefined}
                      className={cn(
                        "inline-flex max-w-full items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-bold tracking-tight shadow-sm backdrop-blur-md transition hover:brightness-95 active:scale-95",
                        anim
                      )}
                      style={{
                        background: rgba("#ffffff", darkSurface ? 0.14 : 0.62),
                        border: `1px solid ${rgba("#ffffff", darkSurface ? 0.24 : 0.78)}`,
                        color: c.textColor,
                      }}
                    >
                      <Mail className="h-3.5 w-3.5 shrink-0" style={{ color: c.accent }} />
                      <span className="truncate">{c.email}</span>
                    </a>
                  )}

                  {c.showPhone && c.phone && (
                    <a
                      href={interactive ? `tel:${c.phone.replace(/[^+\d]/g, "")}` : undefined}
                      className={cn(
                        "inline-flex max-w-full items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-bold tracking-tight shadow-sm backdrop-blur-md transition hover:brightness-95 active:scale-95",
                        anim
                      )}
                      style={{
                        background: rgba("#ffffff", darkSurface ? 0.14 : 0.62),
                        border: `1px solid ${rgba("#ffffff", darkSurface ? 0.24 : 0.78)}`,
                        color: c.textColor,
                      }}
                    >
                      <Phone className="h-3.5 w-3.5 shrink-0" style={{ color: c.accent }} />
                      <span className="truncate">{c.phone}</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </header>

          <div className="mt-6 space-y-6">
            {c.showcaseFirst ? (
              <>
                {gallery}
                {links}
              </>
            ) : (
              <>
                {links}
                {gallery}
              </>
            )}
            {!gallery && !links && (
              <div
                className="rounded-3xl border border-dashed px-4 py-8 text-center text-[13px] opacity-60"
                style={{ borderColor: rgba(c.textColor, 0.3) }}
              >
                Links and showcase items will appear here.
              </div>
            )}
          </div>

          {!hideFooter && footer && (
            <footer className="mt-10 text-center text-[11px] font-medium tracking-wide opacity-45">{footer}</footer>
          )}
        </main>
      </div>
    </>
  );
}

export function StoreThumb({
  title,
  config,
  height = 360,
  scale = 0.62,
}: {
  title: string;
  config: PageConfig;
  height?: number;
  scale?: number;
}) {
  const w = 390;
  return (
    <div className="relative overflow-hidden" style={{ height }}>
      <div
        className="pointer-events-none absolute left-1/2 top-0 origin-top"
        style={{ width: w, height: height / scale, transform: `translateX(-50%) scale(${scale})` }}
      >
        <Storefront title={title} config={config} framed interactive={false} hideFooter />
      </div>
    </div>
  );
}

export function PhoneFrame({
  children,
  className,
  backgroundColor = "#141716",
}: {
  children: ReactNode;
  className?: string;
  backgroundColor?: string;
}) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[393px] select-none rounded-[54px] bg-gradient-to-b from-[#252827] via-[#141716] to-[#0e100f] p-[11px] shadow-[0_38px_95px_-20px_rgba(0,0,0,0.52),0_0_0_1px_rgba(255,255,255,0.16),inset_0_1px_1px_rgba(255,255,255,0.22)]",
        className
      )}
    >
      <div className="pointer-events-none absolute left-1/2 top-[21px] z-30 flex h-[25px] w-[102px] -translate-x-1/2 items-center justify-end rounded-full bg-black px-3 shadow-[inset_0_1px_2px_rgba(255,255,255,0.12)]">
        <span className="h-2.5 w-2.5 rounded-full bg-[#131a29] ring-1 ring-white/10" />
      </div>
      <div
        className="thin-scroll relative aspect-[393/812] max-h-[82dvh] w-full overflow-y-auto overflow-x-hidden rounded-[42px] ring-1 ring-white/10"
        style={{ backgroundColor }}
      >
        {children}
      </div>
    </div>
  );
}
