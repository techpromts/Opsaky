"use client";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle, ArrowDown, ArrowLeft, ArrowUp, Check, ChevronDown, Circle, Copy, Download, Eye, EyeOff, Image as ImageIcon, LayoutPanelTop,
  Link2, Loader2, MoreHorizontal, Palette, Plus, QrCode, RectangleHorizontal, Save, Smartphone, Square, SlidersHorizontal, Trash2, Type, Upload, X,
} from "lucide-react";
import { useWorkspace } from "@/lib/workspace";
import { CATEGORIES, THEMES, slugify, validSlug, type GalleryItem, type PageConfig, type SmartLink, type StorePage } from "@/lib/model";
import { compressImage, isSupportedImageType, MAX_IMAGE_DATA_URL_LENGTH, type ImageCompressionOptions } from "@/lib/images";
import { contrastRatio, detectPlatform } from "@/lib/links";
import { cn } from "@/lib/utils";
import { AppShell, CenterCard, useMode, useTitle } from "./shell";
import { Btn, ColorField, IconBtn, Label, Modal, Range, Segmented, Skeleton, Switch, TextArea, TextInput, ToggleRow } from "./ui";
import { PhoneFrame, PlatformIcon, Storefront, platformName } from "./storefront";
import { copyText, HandleHint, useHandleCheck } from "./dashboard";
import { pageUrl } from "@/lib/urls";
import { LogoMark } from "./logo";
import { CategorySelector } from "./category-selector";

const MAX_LINKS = 7;
const MAX_GALLERY = 4;
const LOGO_IMAGE_SIZE: ImageCompressionOptions = { maxWidth: 400, maxHeight: 400 };
const PAGE_IMAGE_SIZE: ImageCompressionOptions = { maxWidth: 1000 };

async function compressExistingImage(dataUrl: string, options: ImageCompressionOptions): Promise<string> {
  if (!dataUrl.startsWith("data:image/") || dataUrl.length <= MAX_IMAGE_DATA_URL_LENGTH) return dataUrl;
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], "existing-page-image", { type: blob.type });
  return compressImage(file, options);
}

async function preparePageImages(page: StorePage): Promise<StorePage> {
  const [logo, backgroundImage, gallery] = await Promise.all([
    compressExistingImage(page.config.logo, LOGO_IMAGE_SIZE),
    compressExistingImage(page.config.backgroundImage, PAGE_IMAGE_SIZE),
    Promise.all(page.config.gallery.map(async (item) => ({
      ...item,
      image: await compressExistingImage(item.image, PAGE_IMAGE_SIZE),
    }))),
  ]);
  return { ...page, config: { ...page.config, logo, backgroundImage, gallery } };
}
type Tab = "content" | "design" | "layout" | "links";
const TABS: { id: Tab; label: string; icon: typeof Type }[] = [
  { id: "content", label: "Content", icon: Type },
  { id: "design", label: "Design & Colors", icon: Palette },
  { id: "layout", label: "Layout & Operations", icon: LayoutPanelTop },
  { id: "links", label: "Links", icon: Link2 },
];
const MOBILE_SECTIONS: { id: Tab; title: string; summary: string }[] = [
  { id: "content", title: "1. Brand & Identity", summary: "Logo, page title, contact and status" },
  { id: "design", title: "2. Theme & Colors", summary: "Background, palette and typography" },
  { id: "links", title: "3. Links & Actions", summary: "Ways customers can reach you" },
  { id: "layout", title: "4. Products / Showcase", summary: "Photos, product details and layout" },
];
const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));

function Section({ title, desc, children, aside }: { title: string; desc?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="rounded-[24px] border border-white/75 bg-white/55 p-5 shadow-[0_10px_30px_-24px_rgba(23,32,30,.35)] backdrop-blur">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-[17px] font-bold text-ink">{title}</h3>
          {desc && <p className="mt-0.5 text-[12.5px] text-muted">{desc}</p>}
        </div>
        {aside}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Counter({ n, max }: { n: number; max: number }) {
  return <span className={cn("rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold", n >= max ? "bg-coral/15 text-coral-deep" : "bg-ink/5 text-ink-2")}>{n} / {max}</span>;
}

function UploadButton({ onFile, label, testId, busy }: { onFile: (f: File) => void; label: string; testId: string; busy?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input ref={ref} type="file" accept=".jpg,.jpeg,.png,.webp,.avif" className="hidden" data-testid={testId}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
      <Btn type="button" variant="soft" size="sm" loading={busy} onClick={() => ref.current?.click()}><Upload className="h-3.5 w-3.5" />{label}</Btn>
    </>
  );
}

function useUploader() {
  const [busyKey, setBusy] = useState<string | null>(null);
  async function run(key: string, file: File, options: ImageCompressionOptions, done: (data: string) => void) {
    if (!isSupportedImageType(file.type)) {
      toast.error("Unsupported file type. Choose a JPEG, PNG, WebP, or AVIF image.");
      return;
    }
    setBusy(key);
    try {
      const data = await compressImage(file, options);
      done(data);
      toast.success("Image ready. Save the page to publish it.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image upload failed. Try another file.");
    }
    finally { setBusy(null); }
  }
  return { busyKey, run };
}

/* ---------------- Tabs ---------------- */
type Set = <K extends keyof PageConfig>(k: K, v: PageConfig[K]) => void;

function ContentTab({ draft, setTitle, c, set, section = "all" }: { draft: StorePage; setTitle: (t: string) => void; c: PageConfig; set: Set; section?: "all" | "brand" | "showcase" }) {
  const up = useUploader();
  const categories = [...new Set([...CATEGORIES, ...(c.customCategories ?? [])])];
  const addCustomCategory = (category: string) => {
    if (!categories.some((existing) => existing.toLocaleLowerCase() === category.toLocaleLowerCase())) {
      set("customCategories", [...(c.customCategories ?? []), category]);
    }
  };
  const updateItem = (id: string, patch: Partial<GalleryItem>) => set("gallery", c.gallery.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  return (
    <div className="space-y-5">
      {section !== "showcase" && <>
      <Section title="Brand" desc="Logo, name and the line people read first.">
        <div className="flex items-center gap-4">
          <div className={cn("flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-line bg-paper-2", c.logoShape === "circle" ? "rounded-full" : c.logoShape === "rounded" ? "rounded-2xl" : "rounded-lg w-28")}>
            {c.logo ? <img src={c.logo} alt="Logo" className="h-full w-full object-cover" /> : <ImageIcon className="h-6 w-6 text-muted" />}
          </div>
          <div className="flex flex-wrap gap-2">
            <UploadButton label={c.logo ? "Replace logo" : "Upload logo"} testId="input-logo" busy={up.busyKey === "logo"} onFile={(f) => up.run("logo", f, LOGO_IMAGE_SIZE, (d) => set("logo", d))} />
            {c.logo && <Btn type="button" size="sm" variant="ghost" onClick={() => set("logo", "")} data-testid="button-remove-logo"><X className="h-3.5 w-3.5" />Remove</Btn>}
          </div>
        </div>
        <div>
          <Label>Logo style</Label>
          <Segmented value={c.logoShape} onChange={(v) => set("logoShape", v)} testId="seg-logo-shape" options={[
            { value: "circle", label: "Circle", icon: <Circle className="h-3.5 w-3.5" /> },
            { value: "rounded", label: "Rounded", icon: <Square className="h-3.5 w-3.5" /> },
            { value: "cover", label: "Cover", icon: <RectangleHorizontal className="h-3.5 w-3.5" /> },
          ]} />
        </div>
        <div>
          <Label hint={`${draft.title.length}/60`}>Display title</Label>
          <TextInput value={draft.title} maxLength={60} onChange={(e) => setTitle(e.target.value)} data-testid="input-title" />
        </div>
        <div>
          <Label>Category tag</Label>
          <CategorySelector value={c.category} categories={categories} onChange={(value) => set("category", value)}
            onCreate={addCustomCategory} testId="select-category" />
        </div>
        <div>
          <Label hint={`${c.bio.length}/160`}>Bio / tagline</Label>
          <TextArea value={c.bio} maxLength={160} onChange={(e) => set("bio", e.target.value)} data-testid="input-bio" />
        </div>
      </Section>

      <Section title="Announcement bar" desc="A thin banner across the top of your page." aside={<Switch checked={c.showAnnouncement} onChange={(v) => set("showAnnouncement", v)} label="Show announcement" testId="switch-announcement" />}>
        <div className={cn("space-y-4 transition", !c.showAnnouncement && "pointer-events-none opacity-40")}>
          <TextInput value={c.announcement} maxLength={120} onChange={(e) => set("announcement", e.target.value)} placeholder="Free delivery on orders over 20 JOD" data-testid="input-announcement" />
          <Segmented value={c.announcementMode} onChange={(v) => set("announcementMode", v)} testId="seg-announcement-mode" options={[{ value: "pinned", label: "Pinned" }, { value: "scroll", label: "Scrolling" }]} />
        </div>
      </Section>

      <Section title="Status and contact">
        <ToggleRow title="Show live status" desc="An Open now or Closed pill under your name." checked={c.showStatus} onChange={(v) => set("showStatus", v)} testId="switch-status" />
        {c.showStatus && (
          <Segmented value={c.isOpen ? "open" : "closed"} onChange={(v) => set("isOpen", v === "open")} testId="seg-open" options={[{ value: "open", label: "Open now" }, { value: "closed", label: "Closed" }]} />
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <div className="mb-1.5 flex items-center justify-between"><span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-2">Phone pill</span><Switch checked={c.showPhone} onChange={(v) => set("showPhone", v)} label="Show phone" testId="switch-phone" /></div>
            <TextInput value={c.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+962 79 000 0000" inputMode="tel" data-testid="input-contact-phone" />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between"><span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-2">Email pill</span><Switch checked={c.showEmail} onChange={(v) => set("showEmail", v)} label="Show email" testId="switch-email" /></div>
            <TextInput value={c.email} onChange={(e) => set("email", e.target.value)} placeholder="hello@yourshop.com" type="email" data-testid="input-contact-email" />
          </div>
        </div>
      </Section>
      </>}

      {section !== "brand" && <Section title="Showcase gallery" desc="Your best four photos, with optional title and price." aside={<Counter n={c.gallery.length} max={MAX_GALLERY} />}>
        <div className="grid gap-3 sm:grid-cols-2">
          {c.gallery.map((g, i) => (
            <div key={g.id} className="rounded-2xl border border-line bg-white/70 p-2.5" data-testid={`gallery-item-${i}`}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-paper-2">
                {g.image ? <img src={g.image} alt={g.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-muted"><ImageIcon className="h-6 w-6" /></div>}
                <div className="absolute right-1.5 top-1.5 flex gap-1">
                  <IconBtn label="Move left" disabled={i === 0} className="bg-white/90" onClick={() => { const a = [...c.gallery];[a[i - 1], a[i]] = [a[i], a[i - 1]]; set("gallery", a); }}><ArrowUp className="h-3.5 w-3.5 -rotate-90" /></IconBtn>
                  <IconBtn label="Move right" disabled={i === c.gallery.length - 1} className="bg-white/90" onClick={() => { const a = [...c.gallery];[a[i + 1], a[i]] = [a[i], a[i + 1]]; set("gallery", a); }}><ArrowDown className="h-3.5 w-3.5 -rotate-90" /></IconBtn>
                  <IconBtn label="Remove item" className="bg-white/90 hover:text-stop" onClick={() => set("gallery", c.gallery.filter((x) => x.id !== g.id))} data-testid={`button-remove-gallery-${i}`}><Trash2 className="h-3.5 w-3.5" /></IconBtn>
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                <TextInput value={g.title} onChange={(e) => updateItem(g.id, { title: e.target.value })} placeholder="Item title" className="h-9 text-[13px]" />
                <TextInput value={g.price} onChange={(e) => updateItem(g.id, { price: e.target.value })} placeholder="Price" className="h-9 w-24 text-[13px]" />
              </div>
              <div className="mt-2">
                <Label>Product category</Label>
                <CategorySelector value={g.category ?? ""} categories={categories} onChange={(category) => updateItem(g.id, { category })}
                  onCreate={addCustomCategory} allowEmpty testId={`select-gallery-category-${i}`} />
              </div>
              <div className="mt-2"><UploadButton label="Replace photo" testId={`input-gallery-${i}`} busy={up.busyKey === g.id} onFile={(f) => up.run(g.id, f, PAGE_IMAGE_SIZE, (d) => updateItem(g.id, { image: d }))} /></div>
            </div>
          ))}
          {c.gallery.length < MAX_GALLERY && (
            <label className={cn("flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink/15 text-ink-2 transition hover:border-coral hover:text-coral", up.busyKey === "new" && "pointer-events-none opacity-60")}>
              <input type="file" accept=".jpg,.jpeg,.png,.webp,.avif" className="hidden" data-testid="input-gallery-new"
                onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) up.run("new", f, PAGE_IMAGE_SIZE, (d) => set("gallery", [...c.gallery, { id: uid(), image: d, title: "", price: "", category: "" }])); }} />
              {up.busyKey === "new" ? <Loader2 className="h-6 w-6 animate-spin" /> : <Plus className="h-6 w-6" />}
              <span className="mt-2 text-[13px] font-semibold">Add photo</span>
              <span className="font-mono text-[11px] text-muted">{MAX_GALLERY - c.gallery.length} slots left</span>
            </label>
          )}
        </div>
      </Section>}
    </div>
  );
}

function ContrastPill({ a, b, label }: { a: string; b: string; label: string }) {
  let r = 1;
  try { r = contrastRatio(a, b); } catch { r = 1; }
  const ok = r >= 4.5, meh = r >= 3;
  return (
    <div className="flex items-center justify-between rounded-xl border border-line bg-white/60 px-3 py-2 text-[12px]">
      <span className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold" style={{ background: b, color: a }}>Aa</span>{label}</span>
      <span className={cn("rounded-full px-2 py-0.5 font-mono font-semibold", ok ? "bg-go/10 text-go" : meh ? "bg-coral/10 text-coral-deep" : "bg-stop/10 text-stop")}>
        {r.toFixed(2)}:1 {ok ? "Readable" : meh ? "Large text only" : "Hard to read"}
      </span>
    </div>
  );
}

function DesignTab({ c, set, apply }: { c: PageConfig; set: Set; apply: (p: Partial<PageConfig>) => void }) {
  const up = useUploader();
  return (
    <div className="space-y-4">
      <Section title="Theme presets" desc="One click sets every color. Tune afterwards.">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {THEMES.map((t) => (
            <button key={t.id} type="button" data-testid={`button-theme-${t.id}`}
              onClick={() => apply({ theme: t.id, background: t.background, surface: t.surface, accent: t.accent, buttonColor: t.buttonColor, textColor: t.textColor, backgroundMode: c.backgroundMode === "image" ? "image" : "solid" })}
              className={cn("rounded-2xl border p-2 text-left transition hover:-translate-y-0.5", c.theme === t.id ? "border-ink ring-2 ring-ink/10" : "border-line")}>
              <div className="flex h-14 items-end gap-1 rounded-xl p-2" style={{ background: t.background }}>
                {[t.surface, t.accent, t.buttonColor, t.textColor].map((x, i) => <span key={i} className="h-5 flex-1 rounded-md border border-black/5" style={{ background: x }} />)}
              </div>
              <div className="mt-1.5 flex items-center justify-between px-0.5 text-[12px] font-semibold">{t.name}{c.theme === t.id && <Check className="h-3.5 w-3.5 text-teal" />}</div>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Background">
        <Segmented value={c.backgroundMode} onChange={(v) => set("backgroundMode", v)} testId="seg-bg-mode" options={[{ value: "solid", label: "Solid" }, { value: "gradient", label: "Gradient" }, { value: "image", label: "Image" }]} />
        {c.backgroundMode !== "image" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <ColorField label={c.backgroundMode === "gradient" ? "From" : "Color"} value={c.background} onChange={(v) => set("background", v)} testId="color-background" />
            {c.backgroundMode === "gradient" && <ColorField label="To" value={c.gradientColor} onChange={(v) => set("gradientColor", v)} testId="color-gradient" />}
          </div>
        )}
        {c.backgroundMode === "gradient" && (
          <div className="flex items-end gap-4">
            <div className="flex-1"><Range label="Angle" value={c.gradientAngle} min={0} max={360} suffix="deg" onChange={(v) => set("gradientAngle", v)} testId="range-angle" /></div>
            <div className="h-11 w-11 shrink-0 rounded-full border border-line" style={{ background: `linear-gradient(${c.gradientAngle}deg, ${c.background}, ${c.gradientColor})` }} />
          </div>
        )}
        {c.backgroundMode === "image" && (
          <>
            <div className="flex items-center gap-3">
              <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-line bg-paper-2">{c.backgroundImage && <img src={c.backgroundImage} alt="Background" className="h-full w-full object-cover" />}</div>
              <UploadButton label={c.backgroundImage ? "Replace image" : "Upload image"} testId="input-bg-image" busy={up.busyKey === "bg"} onFile={(f) => up.run("bg", f, PAGE_IMAGE_SIZE, (d) => set("backgroundImage", d))} />
              {c.backgroundImage && <Btn type="button" size="sm" variant="ghost" onClick={() => set("backgroundImage", "")}>Remove</Btn>}
            </div>
            <Range label="Blur" value={c.blur} min={0} max={20} suffix="px" onChange={(v) => set("blur", v)} testId="range-blur" />
            <Range label="Dark overlay" value={c.overlay} min={0} max={85} suffix="%" onChange={(v) => set("overlay", v)} testId="range-overlay" />
          </>
        )}
      </Section>

      <Section title="Colors" desc="Fine-tune every surface. Readability is checked live.">
        <div className="grid gap-3 sm:grid-cols-2">
          <ColorField label="Card / surface" value={c.surface} onChange={(v) => set("surface", v)} testId="color-surface" />
          <ColorField label="Accent" value={c.accent} onChange={(v) => set("accent", v)} testId="color-accent" />
          <ColorField label="Button" value={c.buttonColor} onChange={(v) => set("buttonColor", v)} testId="color-button" />
          <ColorField label="Text" value={c.textColor} onChange={(v) => set("textColor", v)} testId="color-text" />
        </div>
        <div className="space-y-2">
          {c.backgroundMode !== "image" && <ContrastPill a={c.textColor} b={c.background} label="Text on background" />}
          <ContrastPill a={c.textColor} b={c.surface} label="Text on cards" />
        </div>
      </Section>

      <Section title="Typography and material">
        <div>
          <Label>Font</Label>
          <div className="grid grid-cols-3 gap-2">
            {([["sans", "Modern Sans", '"Plus Jakarta Sans"'], ["serif", "Editorial Serif", '"Fraunces"'], ["geometric", "Bold Geometric", '"Syne"']] as const).map(([v, n, f]) => (
              <button key={v} type="button" onClick={() => set("font", v)} data-testid={`button-font-${v}`}
                className={cn("rounded-2xl border px-2 py-3 text-center transition", c.font === v ? "border-ink bg-ink text-paper" : "border-line bg-white/60 hover:border-ink/30")}>
                <div className="text-2xl font-bold" style={{ fontFamily: f }}>Aa</div>
                <div className="mt-1 text-[11px] font-semibold">{n}</div>
              </button>
            ))}
          </div>
        </div>
        <Range label="Title size" value={c.titleSize} min={20} max={44} suffix="px" onChange={(v) => set("titleSize", v)} testId="range-title-size" />
        <div><Label>Card material</Label>
          <Segmented value={c.material} onChange={(v) => set("material", v)} testId="seg-material" options={[{ value: "glass", label: "Glass" }, { value: "shadow", label: "Soft shadow" }, { value: "border", label: "Brutal border" }]} /></div>
        <div><Label>Button shape</Label>
          <Segmented value={c.buttonShape} onChange={(v) => set("buttonShape", v)} testId="seg-button-shape" options={[{ value: "pill", label: "Pill" }, { value: "rounded", label: "Rounded" }, { value: "sharp", label: "Sharp" }, { value: "outline", label: "Glass outline" }]} /></div>
        <div><Label>Hover and tap</Label>
          <Segmented value={c.animation} onChange={(v) => set("animation", v)} testId="seg-animation" options={[{ value: "lift", label: "Lift" }, { value: "scale", label: "Scale" }, { value: "none", label: "None" }]} /></div>
      </Section>
    </div>
  );
}

function LayoutTab({ c, set }: { c: PageConfig; set: Set }) {
  const blocks = [
    { id: "showcase", label: "Product showcase", sub: `${c.gallery.length} photo${c.gallery.length === 1 ? "" : "s"}`, icon: ImageIcon },
    { id: "links", label: "Action links", sub: `${c.links.filter((l) => l.active).length} active`, icon: Link2 },
  ];
  const ordered = c.showcaseFirst ? blocks : [...blocks].reverse();
  return (
    <div className="space-y-4">
      <Section title="Section order" desc="What should visitors see first?">
        <div className="space-y-2">
          {ordered.map((b, i) => (
            <div key={b.id} className="flex items-center gap-3 rounded-2xl border border-line bg-white/70 px-4 py-3 transition-all duration-300" data-testid={`order-${b.id}`}>
              <span className="font-mono text-[11px] text-muted">0{i + 1}</span>
              <b.icon className="h-4 w-4 text-teal" />
              <div className="flex-1"><div className="text-sm font-semibold">{b.label}</div><div className="text-[11.5px] text-muted">{b.sub}</div></div>
              <IconBtn label={i === 0 ? "Move down" : "Move up"} onClick={() => set("showcaseFirst", !c.showcaseFirst)} data-testid={`button-move-${b.id}`}>
                {i === 0 ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
              </IconBtn>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Gallery display">
        <div className="grid grid-cols-3 gap-2">
          {([["carousel", "Carousel"], ["grid", "2x2 Grid"], ["featured", "Featured cards"]] as const).map(([v, n]) => (
            <button key={v} type="button" onClick={() => set("galleryMode", v)} data-testid={`button-gallery-${v}`}
              className={cn("rounded-2xl border p-3 transition", c.galleryMode === v ? "border-ink bg-ink text-paper" : "border-line bg-white/60 hover:border-ink/30")}>
              <div className="flex h-12 items-center justify-center gap-1">
                {v === "carousel" && <><span className="h-10 w-7 rounded bg-current opacity-60" /><span className="h-10 w-7 rounded bg-current opacity-80" /><span className="h-10 w-3 rounded bg-current opacity-40" /></>}
                {v === "grid" && <div className="grid grid-cols-2 gap-1">{[0, 1, 2, 3].map((k) => <span key={k} className="h-[18px] w-[18px] rounded bg-current opacity-70" />)}</div>}
                {v === "featured" && <div className="space-y-1"><span className="block h-6 w-12 rounded bg-current opacity-70" /><span className="block h-4 w-12 rounded bg-current opacity-40" /></div>}
              </div>
              <div className="mt-2 text-[11.5px] font-semibold">{n}</div>
            </button>
          ))}
        </div>
      </Section>
      <Section title="Operations">
        <ToggleRow title="Open now" desc={c.showStatus ? "Shown on your page." : "Enable the status pill in Content to show this."} checked={c.isOpen} onChange={(v) => set("isOpen", v)} testId="switch-open-ops" />
        <p className="mt-3 text-[12px] text-ink-2">Saved pages are automatically live when your workspace is approved. No separate publishing step is needed.</p>
      </Section>
    </div>
  );
}

function LinksTab({ c, set }: { c: PageConfig; set: Set }) {
  const update = (id: string, patch: Partial<SmartLink>) => set("links", c.links.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const move = (i: number, d: number) => { const a = [...c.links]; [a[i], a[i + d]] = [a[i + d], a[i]]; set("links", a); };
  const active = c.links.filter((l) => l.active).length;
  return (
    <div className="space-y-4">
      <Section title="Smart links" desc="Paste any URL. The icon is detected automatically." aside={<div className="flex items-center gap-2"><span className="text-[11px] text-muted">{active} visible</span><Counter n={c.links.length} max={MAX_LINKS} /></div>}>
        {c.links.length === 0 && (
          <div className="rounded-2xl border border-dashed border-ink/15 p-6 text-center">
            <div className="mx-auto flex w-fit gap-2 text-ink-2">
              {["https://wa.me/1", "https://instagram.com", "https://tiktok.com", "https://maps.google.com"].map((u) => <span key={u} className="flex h-9 w-9 items-center justify-center rounded-full bg-white"><PlatformIcon url={u} /></span>)}
            </div>
            <p className="mt-3 text-sm font-semibold">No links yet</p>
            <p className="text-[12px] text-muted">WhatsApp, Instagram, TikTok, Maps, email, phone, any website.</p>
          </div>
        )}
        {c.links.map((l, i) => {
          const isWa = (detectPlatform(l.url) || "").toLowerCase().includes("whatsapp");
          return (
            <div key={l.id} className={cn("rounded-2xl border bg-white/75 p-3 transition", l.active ? "border-line" : "border-dashed border-ink/20 opacity-70")} data-testid={`link-row-${i}`}>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink text-paper"><PlatformIcon url={l.url} /></span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-2">{l.url ? platformName(l.url) : "New link"}</span>
                <div className="ml-auto flex items-center">
                  <IconBtn label="Move up" disabled={i === 0} onClick={() => move(i, -1)} data-testid={`button-link-up-${i}`}><ArrowUp className="h-4 w-4" /></IconBtn>
                  <IconBtn label="Move down" disabled={i === c.links.length - 1} onClick={() => move(i, 1)} data-testid={`button-link-down-${i}`}><ArrowDown className="h-4 w-4" /></IconBtn>
                  <IconBtn label={l.active ? "Hide link" : "Show link"} onClick={() => update(l.id, { active: !l.active })} data-testid={`button-link-toggle-${i}`}>{l.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</IconBtn>
                  <IconBtn label="Delete link" className="hover:text-stop" onClick={() => set("links", c.links.filter((x) => x.id !== l.id))} data-testid={`button-link-delete-${i}`}><Trash2 className="h-4 w-4" /></IconBtn>
                </div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1.4fr]">
                <TextInput value={l.label} onChange={(e) => update(l.id, { label: e.target.value })} placeholder="Button label" className="h-10 text-[13px]" data-testid={`input-link-label-${i}`} />
                <TextInput value={l.url} onChange={(e) => update(l.id, { url: e.target.value })} placeholder="https://wa.me/9627... or instagram.com/you" className="h-10 font-mono text-[12px]" data-testid={`input-link-url-${i}`} />
              </div>
              {isWa && (
                <div className="mt-2">
                  <TextInput value={l.message} onChange={(e) => update(l.id, { message: e.target.value })} placeholder="Pre-filled message: Hi! I saw your page on Opsaky and want to order..." className="h-10 text-[13px]" data-testid={`input-link-message-${i}`} />
                </div>
              )}
            </div>
          );
        })}
        <Btn type="button" variant="outline" className="w-full" disabled={c.links.length >= MAX_LINKS} data-testid="button-add-link"
          onClick={() => set("links", [...c.links, { id: uid(), label: "", url: "", active: true, message: "" }])}>
          <Plus className="h-4 w-4" />{c.links.length >= MAX_LINKS ? "7 / 7 links used" : "Add link"}
        </Btn>
      </Section>
    </div>
  );
}

function ShowcaseTab({ draft, setTitle, c, set }: { draft: StorePage; setTitle: (t: string) => void; c: PageConfig; set: Set }) {
  return (
    <div className="space-y-5">
      <ContentTab draft={draft} setTitle={setTitle} c={c} set={set} section="showcase" />
      <LayoutTab c={c} set={set} />
    </div>
  );
}

/* ---------------- Share kit ---------------- */
function ShareKit({ open, onClose, page, dirty }: { open: boolean; onClose: () => void; page: StorePage; dirty: boolean }) {
  const { isDemo } = useMode();
  const [qr, setQr] = useState<string>("");
  const url = pageUrl(page.slug, isDemo);
  useEffect(() => {
    if (!open) return;
    setQr("");
    let live = true;
    (async () => {
      try {
        const mod = await import("qrcode");
        const QR = (mod as unknown as { default?: { toDataURL: (t: string, o: object) => Promise<string> } }).default ?? (mod as unknown as { toDataURL: (t: string, o: object) => Promise<string> });
        const data = await QR.toDataURL(url, { width: 1200, margin: 2, errorCorrectionLevel: "H", color: { dark: "#17201e", light: "#ffffff" } });
        if (live) setQr(data);
      } catch { if (live) setQr("error"); }
    })();
    return () => { live = false; };
  }, [open, url]);
  return (
    <Modal open={open} onClose={onClose} title="Share and print kit">
      {isDemo && <p className="mb-4 rounded-xl border border-dashed border-ink/30 px-3 py-2 text-[12px] text-ink-2">Demo pages are not published. This link and QR open a local preview that only works in this browser.</p>}
      {dirty && <p className="mb-4 rounded-xl bg-coral/10 px-3 py-2 text-[12px] text-coral-deep">You have unsaved changes. Save first so the link shows your latest version.</p>}
      <div className="flex items-center gap-2 rounded-2xl border border-line bg-white/80 p-1.5 pl-4">
        <a href={url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 break-all font-mono text-[12.5px] text-teal underline underline-offset-2" data-testid="text-share-url">{url}</a>
        <Btn size="sm" className="shrink-0" onClick={() => copyText(url)} data-testid="button-copy-link"><Copy className="h-3.5 w-3.5" />Copy</Btn>
      </div>
      <div className="mt-5 flex flex-col items-center rounded-[24px] bg-white p-5">
        {!qr ? <Skeleton className="h-52 w-52" /> : qr === "error" ? <p className="py-16 text-sm text-stop">QR code could not be generated.</p> : <img src={qr} alt="QR code" className="h-52 w-52" data-testid="img-qr" />}
        <p className="mt-2 font-mono text-[11px] text-muted">1200 x 1200 PNG · high error correction</p>
      </div>
      <Btn variant="coral" className="mt-4 w-full" disabled={!qr || qr === "error"} data-testid="button-download-qr"
        onClick={() => { const a = document.createElement("a"); a.href = qr; a.download = `opsaky-${page.slug}-qr.png`; a.click(); }}>
        <Download className="h-4 w-4" />Download QR code
      </Btn>
    </Modal>
  );
}

/* ---------------- Editor ---------------- */
export function Editor({ id }: { id: string }) {
  const ws = useWorkspace();
  const router = useRouter();
  const { isDemo, base } = useMode();
  const source = useMemo(() => ws.pages.find((p) => p.id === id) ?? null, [ws.pages, id]);
  const [draft, setDraft] = useState<StorePage | null>(null);
  const [saved, setSaved] = useState<string>("");
  const [tab, setTab] = useState<Tab>("content");
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const [share, setShare] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [openSection, setOpenSection] = useState<Tab | null>("content");
  const [slugEdit, setSlugEdit] = useState(false);
  const [slugDraft, setSlugDraft] = useState("");
  const initFor = useRef<string | null>(null);
  useTitle(draft ? `Editing ${draft.title}` : "Studio");

  useEffect(() => {
    if (source && initFor.current !== id) {
      initFor.current = id;
      const d = { ...source, config: { ...source.config } };
      setDraft(d);
      setSaved(JSON.stringify(d));
    }
  }, [source, id]);

  const dirty = !!draft && JSON.stringify(draft) !== saved;
  const otherSlugs = useMemo(() => new Set(ws.pages.filter((p) => p.id !== id).map((p) => p.slug)), [ws.pages, id]);
  const slugState = useHandleCheck(slugEdit ? slugDraft : "", (s) => s === source?.slug);

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); } };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const saveRef = useRef<() => void>(() => {});
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); saveRef.current(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const gateBlocked = !isDemo && ws.ready && (!ws.session.signedIn || ws.session.account?.status !== "APPROVED");
  if (!ws.ready || (ws.loading && !source && !draft)) {
    return <AppShell wide hideMobileHeader mobileFooter><div className="grid gap-6 pt-8 lg:grid-cols-[1fr_420px]"><Skeleton className="h-[70vh] rounded-[28px]" /><Skeleton className="hidden h-[70vh] rounded-[48px] lg:block" /></div></AppShell>;
  }
  if (gateBlocked) {
    return <AppShell hideMobileHeader mobileFooter><CenterCard><Smartphone className="h-8 w-8 text-coral" /><h1 className="font-display mt-4 text-2xl font-bold">The studio is locked</h1><p className="mt-2 text-sm text-ink-2">Your account needs to be signed in and approved to edit pages.</p><Link href="/dashboard" className="mt-6 inline-flex h-10 items-center rounded-full bg-ink px-4 text-sm font-semibold text-paper">Go to workspace</Link></CenterCard></AppShell>;
  }
  if (!source && !draft) {
    return (
      <AppShell hideMobileHeader mobileFooter>
        <CenterCard className="text-center">
          <div className="font-display text-6xl font-extrabold text-coral">404</div>
          <h1 className="font-display mt-2 text-2xl font-bold">This page is not in your workspace</h1>
          <p className="mt-2 text-sm text-ink-2">It may have been deleted{isDemo ? " or the demo data was reset in this browser" : ""}.</p>
          <Link href={base} className="mt-6 inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-paper" data-testid="link-back-workspace"><ArrowLeft className="h-4 w-4" />Back to workspace</Link>
        </CenterCard>
      </AppShell>
    );
  }
  if (!draft) return null;

  const c = draft.config;
  // Sharing must refer to the persisted slug, not an unsaved handle edit.
  const savedPage = source ?? draft;
  const liveUrl = pageUrl(savedPage.slug, isDemo);
  const set: Set = (k, v) => setDraft((d) => (d ? { ...d, config: { ...d.config, [k]: v } } : d));
  const apply = (p: Partial<PageConfig>) => setDraft((d) => (d ? { ...d, config: { ...d.config, ...p } } : d));

  async function save() {
    if (!draft || saving) return;
    if (!validSlug(draft.slug) || otherSlugs.has(draft.slug)) { setSaveErr("The page handle is invalid or already used."); return; }
    setSaving(true); setSaveErr(null);
    try {
      const optimizedDraft = await preparePageImages(draft);
      const res = await ws.savePage(optimizedDraft);
      setDraft(res); setSaved(JSON.stringify(res));
      toast.success(isDemo ? "Saved in this browser" : "Changes saved");
    } catch (e) {
      const m = e instanceof Error ? e.message : "Save failed. Your changes are still here; try again.";
      setSaveErr(m); toast.error(m);
    } finally { setSaving(false); }
  }
  saveRef.current = () => void save();

  return (
    <AppShell wide hideMobileHeader mobileFooter>
      {/* Top bar */}
      <div className="relative z-30 -mx-4 border-b border-white/70 bg-paper/85 px-4 py-3 shadow-[0_8px_24px_-22px_rgba(23,32,30,.5)] backdrop-blur-2xl md:-mx-6 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="hidden min-w-0 items-center gap-3 md:flex">
            <button onClick={() => { if (!dirty || confirm("Leave without saving your changes?")) router.push(base); }}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-white/70 transition hover:border-ink/40" aria-label="Back" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
            <div className="font-display truncate text-lg font-bold leading-tight" data-testid="text-editor-title">{draft.title || "Untitled"}</div>
            {slugEdit ? (
              <div className="flex items-center gap-1">
                <span className="font-mono text-[11.5px] text-muted">/</span>
                <input autoFocus value={slugDraft} onChange={(e) => setSlugDraft(slugify(e.target.value))} className="w-40 rounded-md border border-line bg-white px-1.5 font-mono text-[11.5px] outline-none focus:border-ink" data-testid="input-edit-slug" />
                <button className="text-go disabled:opacity-30" disabled={slugState !== "available" || otherSlugs.has(slugDraft)} onClick={() => { setDraft({ ...draft, slug: slugDraft }); setSlugEdit(false); }} aria-label="Apply handle" data-testid="button-apply-slug"><Check className="h-4 w-4" /></button>
                <button className="text-muted" onClick={() => setSlugEdit(false)} aria-label="Cancel"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <button onClick={() => { setSlugDraft(draft.slug); setSlugEdit(true); }} className="font-mono text-[11.5px] text-muted hover:text-ink" data-testid="button-edit-slug">/{draft.slug} · change</button>
            )}
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-2 md:hidden">
            <LogoMark className="h-8 w-8 shrink-0" />
            <div className="min-w-0">
              <div className="font-display max-w-[36vw] truncate text-[15px] font-bold leading-tight" data-testid="text-editor-title-mobile">{draft.title || "Untitled"}</div>
              <div className="truncate font-mono text-[10.5px] text-muted">/{slugEdit ? slugDraft : draft.slug}</div>
            </div>
          </div>
          <div className="ml-auto hidden items-center gap-2 md:flex">
            <span className={cn("hidden items-center gap-1.5 text-[12px] font-medium sm:flex", dirty ? "text-coral-deep" : "text-go")} data-testid="text-save-state">
              <span className={cn("h-1.5 w-1.5 rounded-full", dirty ? "bg-coral" : "bg-go")} />{saving ? "Saving..." : dirty ? "Unsaved changes" : isDemo ? "Saved locally" : "All changes saved"}
            </span>
            <Btn variant="soft" size="md" onClick={() => setShare(true)} data-testid="button-share"><QrCode className="h-4 w-4" /><span className="hidden sm:inline">Share</span></Btn>
            <Btn variant="coral" onClick={save} loading={saving} disabled={!dirty} data-testid="button-save"><Save className="h-4 w-4" />Save</Btn>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2 md:hidden">
            <Btn variant={dirty ? "coral" : "soft"} size="sm" onClick={() => dirty ? void save() : setShare(true)} loading={saving} data-testid="button-mobile-primary">
              {dirty ? <><Save className="h-4 w-4" />Save</> : <><QrCode className="h-4 w-4" />Share</>}
            </Btn>
            <button type="button" aria-label="More page actions" aria-expanded={moreOpen} onClick={() => setMoreOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white/80 text-ink" data-testid="button-editor-more">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="mt-3 hidden items-center gap-2 rounded-xl border border-line bg-white/80 px-3 py-2 md:flex">
          <span className="shrink-0 text-[11px] font-semibold text-ink-2">{isDemo ? "Local preview" : "Live page"}</span>
          <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 break-all font-mono text-[12px] text-teal underline underline-offset-2" data-testid="link-editor-live-url">{liveUrl}</a>
          <Btn size="sm" className="shrink-0" onClick={() => copyText(liveUrl)} data-testid="button-copy-live-url"><Copy className="h-3.5 w-3.5" />Copy</Btn>
        </div>
        {slugEdit && <div className="mt-2 flex items-center gap-2 md:hidden">
          <input autoFocus value={slugDraft} onChange={(e) => setSlugDraft(slugify(e.target.value))} className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-white px-3 font-mono text-sm outline-none focus:border-ink" data-testid="input-edit-slug-mobile" />
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-go/10 text-go disabled:opacity-30" disabled={slugState !== "available" || otherSlugs.has(slugDraft)} onClick={() => { setDraft({ ...draft, slug: slugDraft }); setSlugEdit(false); }} aria-label="Apply handle" data-testid="button-apply-slug-mobile"><Check className="h-4 w-4" /></button>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-ink/5 text-muted" onClick={() => setSlugEdit(false)} aria-label="Cancel handle change"><X className="h-4 w-4" /></button>
        </div>}
        {slugEdit && <div className="mt-1 hidden pl-12 md:block"><HandleHint state={otherSlugs.has(slugDraft) ? "taken" : slugState} /></div>}
        {saveErr && <div className="mt-2 flex items-center gap-2 rounded-xl bg-stop/10 px-3 py-2 text-[13px] text-stop" data-testid="text-save-error"><AlertTriangle className="h-4 w-4 shrink-0" />{saveErr}<button className="ml-auto font-semibold underline" onClick={save}>Retry</button></div>}
      </div>

      <div className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className={cn("min-w-0", mobileView === "preview" && "hidden lg:block")}>
          <div className="no-scrollbar -mx-1 mb-5 hidden gap-1 overflow-x-auto px-1 md:flex">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} data-testid={`tab-${t.id}`}
                className={cn("flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-[13px] font-semibold transition-all",
                  tab === t.id ? "bg-ink text-paper shadow-lg" : "bg-white/50 text-ink-2 hover:bg-white")}>
                <t.icon className={cn("h-4 w-4", tab === t.id && "text-lime")} />{t.label}
                {t.id === "links" && <span className="font-mono text-[10.5px] opacity-70">{c.links.length}/7</span>}
                {t.id === "content" && <span className="font-mono text-[10.5px] opacity-70">{c.gallery.length}/4</span>}
              </button>
            ))}
          </div>
          <div key={tab} className="rise hidden md:block" style={{ animationDuration: ".35s" }}>
            {tab === "content" && <ContentTab draft={draft} c={c} set={set} setTitle={(t) => setDraft({ ...draft, title: t })} />}
            {tab === "design" && <DesignTab c={c} set={set} apply={apply} />}
            {tab === "layout" && <LayoutTab c={c} set={set} />}
            {tab === "links" && <LinksTab c={c} set={set} />}
          </div>
          <div className="space-y-3 md:hidden" data-testid="studio-accordion">
            {MOBILE_SECTIONS.map((section) => {
              const expanded = openSection === section.id;
              const headingId = `mobile-section-${section.id}`;
              return (
                <section key={section.id} className={cn("overflow-hidden rounded-[24px] border transition-colors", expanded ? "border-ink/15 bg-white/65 shadow-[0_14px_36px_-28px_rgba(23,32,30,.45)]" : "border-white/80 bg-white/45")}>
                  <button type="button" id={headingId} aria-expanded={expanded} aria-controls={`${headingId}-panel`}
                    onClick={() => setOpenSection(expanded ? null : section.id)}
                    className="flex min-h-[76px] w-full items-center gap-3 px-5 py-4 text-left" data-testid={`accordion-toggle-${section.id}`}>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-[15px] font-bold">{section.title}</span>
                      <span className="mt-1 block text-[11.5px] text-muted">{section.summary}</span>
                    </span>
                    <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", expanded && "rotate-180")} />
                  </button>
                  {expanded && (
                    <div id={`${headingId}-panel`} role="region" aria-labelledby={headingId} className="space-y-5 border-t border-ink/5 px-4 py-5">
                      {section.id === "content" && <ContentTab draft={draft} c={c} set={set} setTitle={(t) => setDraft({ ...draft, title: t })} section="brand" />}
                      {section.id === "design" && <DesignTab c={c} set={set} apply={apply} />}
                      {section.id === "links" && <LinksTab c={c} set={set} />}
                      {section.id === "layout" && <ShowcaseTab draft={draft} c={c} set={set} setTitle={(t) => setDraft({ ...draft, title: t })} />}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>
        <aside className={cn(mobileView === "edit" && "hidden lg:block")}>
          <div className="lg:sticky lg:top-[150px]">
            <div className="mb-3 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-2">
              <span className="h-1.5 w-1.5 rounded-full bg-coral pulse-dot" />Live preview
            </div>
            <PhoneFrame><Storefront title={draft.title} config={c} framed /></PhoneFrame>
          </div>
        </aside>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/70 bg-paper/80 px-4 pt-3 shadow-[0_-12px_32px_-24px_rgba(23,32,30,.55)] backdrop-blur-2xl md:hidden"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}>
        <div className="mx-auto flex max-w-[520px] rounded-full border border-white/80 bg-white/60 p-1.5">
          {(["edit", "preview"] as const).map((view) => (
            <button key={view} type="button" onClick={() => setMobileView(view)} aria-pressed={mobileView === view} data-testid={`button-mobile-${view}`}
              className={cn("flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full text-[13px] font-semibold transition", mobileView === view ? "bg-ink text-paper shadow-sm" : "text-ink-2 hover:bg-white/70")}>
              {view === "edit" ? <SlidersHorizontal className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}{view === "edit" ? "Edit" : "Preview"}
            </button>
          ))}
        </div>
      </div>
      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="More page actions" data-testid="drawer-editor-more">
          <button type="button" className="absolute inset-0 bg-ink/30 backdrop-blur-sm" aria-label="Close actions" onClick={() => setMoreOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] border border-white/80 bg-paper/95 p-5 shadow-2xl backdrop-blur-2xl"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)" }}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold">Page actions</h2>
                <p className="mt-0.5 truncate font-mono text-[11px] text-muted">{liveUrl}</p>
              </div>
              <button type="button" aria-label="Close actions" onClick={() => setMoreOpen(false)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink/5" data-testid="button-close-editor-more"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-2">
              <button type="button" onClick={() => { setMoreOpen(false); void copyText(liveUrl); }} className="flex min-h-12 w-full items-center gap-3 rounded-2xl bg-white/75 px-4 text-sm font-semibold" data-testid="menu-copy-url"><Copy className="h-4 w-4" />Copy page URL</button>
              <button type="button" onClick={() => { setMoreOpen(false); setShare(true); }} className="flex min-h-12 w-full items-center gap-3 rounded-2xl bg-white/75 px-4 text-sm font-semibold" data-testid="menu-qr-code"><QrCode className="h-4 w-4" />QR code and share</button>
              <button type="button" onClick={() => { setMoreOpen(false); setMobileView("preview"); }} className="flex min-h-12 w-full items-center gap-3 rounded-2xl bg-white/75 px-4 text-sm font-semibold" data-testid="menu-preview"><Eye className="h-4 w-4" />Preview page</button>
              <button type="button" onClick={() => { setMoreOpen(false); setSlugDraft(draft.slug); setSlugEdit(true); }} className="flex min-h-12 w-full items-center gap-3 rounded-2xl bg-white/75 px-4 text-sm font-semibold" data-testid="menu-edit-url"><Link2 className="h-4 w-4" />Edit page URL</button>
              <button type="button" onClick={() => { if (!dirty || confirm("Leave without saving your changes?")) { setMoreOpen(false); router.push(base); } }} className="flex min-h-12 w-full items-center gap-3 rounded-2xl bg-white/75 px-4 text-sm font-semibold" data-testid="menu-back"><ArrowLeft className="h-4 w-4" />Back to workspace</button>
            </div>
          </div>
        </div>
      )}
      <ShareKit open={share} onClose={() => setShare(false)} page={savedPage} dirty={dirty} />
    </AppShell>
  );
}
