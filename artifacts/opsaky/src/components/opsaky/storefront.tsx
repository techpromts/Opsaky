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
    <span
      className="inline-flex max-w-full items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide shadow-sm"
      style={{ background: config.accent, color: readableText(config.accent) }}
    >
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
    <a
      href={interactive ? href : "#"}
      target={interactive ? "_blank" : undefined}
      rel={interactive ? "noopener noreferrer" : undefined}
      onClick={interactive ? undefined : (event) => event.preventDefault()}
      className="mt-2.5 flex h-10 w-full items-center justify-center gap-1.5 rounded-2xl bg-[#25D366] px-3 text-[12px] font-bold text-[#053b2c] shadow-[0_6px_16px_-6px_rgba(37,211,102,0.65)] transition-all duration-200 hover:brightness-105 active:scale-[0.97]"
      data-testid={`sf-order-${itemId}`}
    >
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

  useEffect(() => {
    if (!c.businessHoursEnabled) { setClock(null); return; }
    const updateClock = () => setClock(Date.now());
    updateClock();
    const timer = window.setInterval(updateClock, 60_000);
    return () => window.clearInterval(timer);
  }, [c.businessHoursEnabled]);

  const hoursStatus = c.businessHoursEnabled && clock !== null
    ? getBusinessStatus(c.businessHours, c.businessHoursTimezone, new Date(clock), Boolean(c.is24_7))
    : undefined;

  const btnText = c.buttonShape === "outline" ? c.buttonColor : readableText(c.buttonColor);
  const radius = { pill: 999, rounded: 18, sharp: 6, outline: 999 }[c.buttonShape];
  const anim = c.animation === "lift" ? "sf-lift" : c.animation === "scale" ? "sf-scale" : "";
  const activeLinks = c.links.filter((l) => l.active && l.url.trim());
  const whatsappDigits = getWhatsAppDigits(c.links);
  const font = FONT_STACKS[c.font];
  const imageBackground = c.backgroundMode === "image" && Boolean(c.backgroundImage);

  useEffect(() => {
    if (framed || typeof document === "undefined") return;
    const prevBodyBg = document.body.style.backgroundColor;
    const prevHtmlBg = document.documentElement.style.backgroundColor;
    const targetBg = imageBackground ? "#090a09" : c.background;
    document.body.style.backgroundColor = targetBg;
    document.documentElement.style.backgroundColor = targetBg;
    return () => {
      document.body.style.backgroundColor = prevBodyBg;
      document.documentElement.style.backgroundColor = prevHtmlBg;
    };
  }, [framed, imageBackground, c.background]);

  const glassStyle: CSSProperties = {
    background: rgba(c.surface, imageBackground ? 0.56 : 0.72),
    backdropFilter: "blur(24px) saturate(165%)",
    WebkitBackdropFilter: "blur(24px) saturate(165%)",
    border: `1px solid ${rgba("#ffffff", 0.45)}`,
    boxShadow: `0 20px 44px -22px ${rgba("#000000", 0.3)}, inset 0 1px 0 0 ${rgba("#ffffff", 0.55)}`,
    borderRadius: 28,
  };

  const surface: CSSProperties =
    c.material === "border"
      ? { background: c.surface, border: `2px solid ${c.textColor}`, boxShadow: `4px 4px 0 ${c.textColor}`, borderRadius: 16 }
      : glassStyle;

  const bg: CSSProperties = imageBackground
    ? { background: "transparent" }
    : c.backgroundMode === "gradient"
      ? { background: `linear-gradient(${c.gradientAngle}deg, ${c.background}, ${c.gradientColor})` }
      : { background: c.background };

  const linkStyle = (): CSSProperties =>
    c.buttonShape === "outline"
      ? {
          borderRadius: radius,
          border: `1.5px solid ${rgba("#ffffff", 0.55)}`,
          color: c.textColor,
          background: rgba(c.surface, 0.45),
          backdropFilter: "blur(18px) saturate(150%)",
          WebkitBackdropFilter: "blur(18px) saturate(150%)",
          boxShadow: `0 8px 24px -12px ${rgba("#000000", 0.25)}, inset 0 1px 0 0 ${rgba("#ffffff", 0.4)}`,
        }
      : {
          borderRadius: radius,
          background: c.buttonColor,
          color: btnText,
          boxShadow: `0 10px 24px -10px ${rgba(c.buttonColor, 0.55)}, inset 0 1px 0 0 ${rgba("#ffffff", 0.25)}`,
          ...(c.material === "border" ? { border: `2px solid ${c.textColor}`, boxShadow: `3px 3px 0 ${c.textColor}` } : {}),
        };

  const announcement = c.showAnnouncement && c.announcement.trim() && (
    <div
      className="relative z-20 overflow-hidden py-2 text-center text-[12px] font-semibold backdrop-blur-md"
      style={{ background: rgba(c.accent, 0.92), color: readableText(c.accent) }}
      data-testid="sf-announcement"
    >
      {c.announcementMode === "scroll" ? (
        <div className="marquee gap-12">
          {[0, 1, 2, 3].map((i) => <span key={i} className="px-6">{c.announcement}</span>)}
        </div>
      ) : (
        <span className="px-4">{c.announcement}</span>
      )}
    </div>
  );

  const logo = c.logo && c.logoShape !== "cover" && (
    <img
      src={c.logo}
      alt={`${title} logo`}
      className={cn("mx-auto h-24 w-24 object-cover", c.logoShape === "circle" ? "rounded-full" : "rounded-[24px]")}
      style={{
        boxShadow: `0 12px 32px -10px ${rgba("#000000", 0.45)}`,
        border: `3px solid ${rgba("#ffffff", 0.8)}`,
      }}
    />
  );

  const initialBadge = !c.logo && (
    <div
      className={cn("mx-auto flex h-20 w-20 items-center justify-center text-3xl font-bold shadow-lg", c.logoShape === "circle" ? "rounded-full" : "rounded-[24px]")}
      style={{ background: c.accent, color: readableText(c.accent), fontFamily: font, border: `2px solid ${rgba("#ffffff", 0.55)}` }}
    >
      {(title || "O").trim().charAt(0).toUpperCase()}
    </div>
  );

  const gallery = c.gallery.length > 0 && (
    <section data-testid="sf-gallery">
      {c.galleryMode === "carousel" && (
        <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-5 pb-2">
          {c.gallery.map((g) => (
            <figure key={g.id} className="w-[74%] shrink-0 snap-center overflow-hidden transition-transform duration-300" style={surface}>
              {g.image && <img src={g.image} alt={g.title} className="aspect-[4/5] w-full object-cover" />}
              {(g.category || g.title || g.price || whatsappDigits) && (
                <figcaption className="p-3.5 text-[13px]">
                  <div className="flex min-w-0 items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-1">
                      <ProductCategory category={g.category} config={c} />
                      {g.title && <span className="block truncate text-[14px] font-bold">{g.title}</span>}
                    </div>
                    {g.price && (
                      <span
                        className="shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-extrabold"
                        style={{ background: rgba(c.accent, 0.16), color: c.accent }}
                      >
                        {g.price}
                      </span>
                    )}
                  </div>
                  {whatsappDigits && <OrderOnWhatsApp digits={whatsappDigits} title={g.title} price={g.price} interactive={interactive} itemId={g.id} />}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}
      {c.galleryMode === "grid" && (
        <div className="grid grid-cols-2 gap-3">
          {c.gallery.map((g) => (
            <figure key={g.id} className="relative flex flex-col justify-between overflow-hidden" style={surface}>
              {g.image && <img src={g.image} alt={g.title} className="aspect-square w-full object-cover" />}
              {(g.category || g.title || g.price || whatsappDigits) && (
                <figcaption className="flex flex-1 flex-col justify-between p-3 text-[12px]">
                  <div className="space-y-1">
                    <ProductCategory category={g.category} config={c} />
                    {g.title && <div className="line-clamp-2 text-[13px] font-bold leading-snug">{g.title}</div>}
                    {g.price && <div className="font-extrabold" style={{ color: c.accent }}>{g.price}</div>}
                  </div>
                  {whatsappDigits && <OrderOnWhatsApp digits={whatsappDigits} title={g.title} price={g.price} interactive={interactive} itemId={g.id} />}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}
      {c.galleryMode === "featured" && (
        <div className="space-y-3.5">
          {c.gallery.map((g) => (
            <figure key={g.id} className="relative overflow-hidden" style={surface}>
              {g.image && <img src={g.image} alt={g.title} className="aspect-[16/10] w-full object-cover" />}
              {g.price && (
                <span
                  className="absolute right-3 top-3 rounded-full px-3 py-1 text-[12px] font-extrabold shadow-lg backdrop-blur-md"
                  style={{ background: c.accent, color: readableText(c.accent) }}
                >
                  {g.price}
                </span>
              )}
              {g.category && <span className="absolute left-3 top-3"><ProductCategory category={g.category} config={c} /></span>}
              {(g.title || whatsappDigits) && (
                <figcaption className="p-4 text-[14px] font-bold">
                  {g.title && <div className="text-[15px]">{g.title}</div>}
                  {whatsappDigits && <OrderOnWhatsApp digits={whatsappDigits} title={g.title} price={g.price} interactive={interactive} itemId={g.id} />}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}
    </section>
  );

  const links = activeLinks.length > 0 && (
    <nav className="space-y-2.5" data-testid="sf-links">
      {activeLinks.map((l: SmartLink) => (
        <a
          key={l.id}
          href={interactive ? safeHref(l.url, l.message) : undefined}
          target="_blank"
          rel="noopener noreferrer"
          onClick={interactive ? undefined : (e) => e.preventDefault()}
          data-testid={`sf-link-${l.id}`}
          className={cn(
            "relative flex h-[54px] items-center justify-center px-12 text-[14.5px] font-bold transition-transform duration-200 active:scale-[0.98]",
            anim
          )}
          style={linkStyle()}
        >
          <span className="absolute left-4 opacity-90"><PlatformIcon url={l.url} /></span>
          <span className="truncate">{l.label || platformName(l.url)}</span>
        </a>
      ))}
    </nav>
  );

  const isOpenNow = c.businessHoursEnabled ? hoursStatus?.isOpen : c.isOpen;
  const showStatusBadge = c.businessHoursEnabled || c.showStatus;

  return (
    <div
      ref={scrollRef}
      className={cn("relative isolate w-full overflow-x-hidden", framed ? "min-h-full" : "min-h-[100dvh]")}
      style={{ ...bg, color: c.textColor, fontFamily: font }}
    >
      {imageBackground && (
        <div
          className={cn(
            "pointer-events-none -z-10 overflow-hidden",
            framed ? "absolute inset-0 h-full w-full" : "fixed -inset-[20%] h-[140lvh] w-[140vw]"
          )}
        >
          <img
            src={c.backgroundImage}
            alt=""
            className="h-full w-full scale-110 object-cover object-center"
            style={{ filter: `blur(${c.blur}px)` }}
          />
          <div className="absolute inset-0" style={{ background: `rgba(0, 0, 0, ${c.overlay / 100})` }} />
        </div>
      )}

      {announcement}

      {c.logo && c.logoShape === "cover" && (
        <div className="relative h-44 w-full overflow-hidden">
          <img src={c.logo} alt={`${title} cover`} className="h-full w-full object-cover" />
          <div
            className="absolute inset-x-0 bottom-0 h-20"
            style={{ background: `linear-gradient(transparent, ${rgba(c.background, imageBackground ? 0 : 0.85)})` }}
          />
        </div>
      )}

      <main
        className={cn("relative z-10 mx-auto w-full max-w-[480px] px-5", c.logo && c.logoShape === "cover" ? "-mt-6 pt-0" : "pt-10")}
        style={{ paddingBottom: framed ? "2.5rem" : "calc(env(safe-area-inset-bottom) + 4.5rem)" }}
      >
        <header className="relative text-center">
          <div className="relative z-10">
            {logo}
            {c.logoShape !== "cover" && initialBadge}
          </div>

          <div
            className={cn("relative px-6 pb-6", c.logoShape !== "cover" ? "-mt-10 pt-14" : "mt-4 pt-6")}
            style={glassStyle}
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
              className="mt-1.5 font-extrabold tracking-tight leading-[1.08]"
              style={{ fontSize: c.titleSize, letterSpacing: c.font === "serif" ? "-0.01em" : "-0.025em" }}
            >
              {title || "Untitled page"}
            </h1>

            {c.bio && (
              <p className="mx-auto mt-2 max-w-[32ch] text-[13.5px] leading-relaxed opacity-75">
                {c.bio}
              </p>
            )}

            {(showStatusBadge || (c.showEmail && c.email) || (c.showPhone && c.phone)) && (
              <div
                className="mt-5 flex flex-col items-center gap-2.5 border-t pt-4"
                style={{ borderColor: rgba(c.textColor, 0.08) }}
              >
                {showStatusBadge && (
                  <div
                    data-testid="sf-status"
                    className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11.5px] font-bold"
                    style={{
                      background: isOpenNow ? "rgba(22, 163, 74, 0.12)" : "rgba(220, 38, 38, 0.12)",
                      color: isOpenNow ? "#15803d" : "#b91c1c",
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
                      "inline-flex max-w-full items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-bold tracking-tight shadow-sm transition hover:brightness-95 active:scale-95",
                      anim
                    )}
                    style={{
                      background: rgba("#ffffff", 0.55),
                      border: `1px solid ${rgba("#ffffff", 0.65)}`,
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
                      "inline-flex max-w-full items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-bold tracking-tight shadow-sm transition hover:brightness-95 active:scale-95",
                      anim
                    )}
                    style={{
                      background: rgba("#ffffff", 0.55),
                      border: `1px solid ${rgba("#ffffff", 0.65)}`,
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
          {c.showcaseFirst ? <>{gallery}{links}</> : <>{links}{gallery}</>}
          {!gallery && !links && (
            <div className="rounded-3xl border border-dashed px-4 py-8 text-center text-[13px] opacity-60" style={{ borderColor: rgba(c.textColor, 0.3) }}>
              Links and showcase items will appear here.
            </div>
          )}
        </div>

        {!hideFooter && footer && (
          <footer className="mt-10 text-center text-[11px] font-medium tracking-wide opacity-45">
            {footer}
          </footer>
        )}
      </main>
    </div>
  );
}

export function StoreThumb({ title, config, height = 360, scale = 0.62 }: { title: string; config: PageConfig; height?: number; scale?: number }) {
  const w = 390;
  return (
    <div className="relative overflow-hidden" style={{ height }}>
      <div className="pointer-events-none absolute left-1/2 top-0 origin-top" style={{ width: w, height: height / scale, transform: `translateX(-50%) scale(${scale})` }}>
        <Storefront title={title} config={config} framed interactive={false} hideFooter />
      </div>
    </div>
  );
}

export function PhoneFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[393px] rounded-[52px] bg-[#141716] p-[12px] shadow-[0_35px_90px_-20px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.12)]",
        className
      )}
    >
      <div className="pointer-events-none absolute left-1/2 top-[22px] z-30 h-[26px] w-[104px] -translate-x-1/2 rounded-full bg-black shadow-inner" />
      <div className="thin-scroll relative aspect-[393/812] max-h-[82dvh] w-full overflow-y-auto overflow-x-hidden rounded-[40px] bg-paper">
        {children}
      </div>
    </div>
  );
}
