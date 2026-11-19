"use client";
import { useRef, type CSSProperties, type ReactNode } from "react";
import { Globe, Mail, MapPin, Phone, Store } from "lucide-react";
import { SiFacebook, SiInstagram, SiSnapchat, SiTiktok, SiWhatsapp, SiX, SiYoutube } from "react-icons/si";
import type { PageConfig, SmartLink } from "@/lib/model";
import { detectPlatform, readableText, safeHref } from "@/lib/links";
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
}

export function Storefront({ title, config: c, framed, interactive = true, footer }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const btnText = c.buttonShape === "outline" ? c.buttonColor : readableText(c.buttonColor);
  const radius = { pill: 999, rounded: 16, sharp: 2, outline: 999 }[c.buttonShape];
  const anim = c.animation === "lift" ? "sf-lift" : c.animation === "scale" ? "sf-scale" : "";
  const activeLinks = c.links.filter((l) => l.active && l.url.trim());
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
              {(g.title || g.price) && <figcaption className="flex items-center justify-between gap-2 px-3 py-2.5 text-[13px]">
                <span className="truncate font-semibold">{g.title}</span>
                {g.price && <span className="shrink-0 font-bold" style={{ color: c.accent }}>{g.price}</span>}
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
              {(g.title || g.price) && <figcaption className="px-2.5 py-2 text-[12px]">
                <div className="truncate font-semibold">{g.title}</div>
                {g.price && <div className="font-bold" style={{ color: c.accent }}>{g.price}</div>}
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
              {g.title && <figcaption className="px-4 py-3 text-[14px] font-semibold">{g.title}</figcaption>}
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
    <div ref={scrollRef} className={cn("relative isolate w-full overflow-hidden", framed ? "min-h-full" : "min-h-[100dvh]")} style={{ ...bg, color: c.textColor, fontFamily: font }}>
      {c.backgroundMode === "image" && c.backgroundImage && (
        <div className="pointer-events-none absolute inset-0 -z-10">
          <img src={c.backgroundImage} alt="" className="h-full w-full scale-110 object-cover" style={{ filter: `blur(${c.blur}px)` }} />
          <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${c.overlay / 100})` }} />
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
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {c.category && <span className="rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.14em]" style={{ background: rgba(c.accent, 0.14), color: c.accent }}>{c.category}</span>}
            {c.showStatus && (
              <span data-testid="sf-status" className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.12em]"
                style={{ background: c.isOpen ? "rgba(31,157,91,.14)" : "rgba(224,54,44,.14)", color: c.isOpen ? "#1f9d5b" : "#e0362c" }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.isOpen ? "#1f9d5b" : "#e0362c" }} />
                {c.isOpen ? "Open now" : "Closed"}
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
        </header>
        <div className="mt-7 space-y-6">
          {c.showcaseFirst ? <>{gallery}{links}</> : <>{links}{gallery}</>}
          {!gallery && !links && (
            <div className="rounded-2xl border border-dashed px-4 py-8 text-center text-[13px] opacity-60" style={{ borderColor: rgba(c.textColor, 0.3) }}>
              Links and showcase items will appear here.
            </div>
          )}
        </div>
        <footer className="mt-10 text-center text-[11px] font-medium tracking-wide opacity-45">
          {footer ?? "Powered by Opsaky"}
        </footer>
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
