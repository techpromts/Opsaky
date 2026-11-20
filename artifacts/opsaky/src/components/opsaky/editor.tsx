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
import { BUSINESS_DAYS, CATEGORIES, MAX_GALLERY_ITEMS, THEMES, slugify, validSlug, type GalleryItem, type PageConfig, type SmartLink, type StorePage } from "@/lib/model";
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
const MAX_GALLERY = MAX_GALLERY_ITEMS;
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
type Tab = "brand" | "items" | "links" | "design";
const TABS: { id: Tab; label: string; icon: typeof Type }[] = [
  { id: "brand", label: "Brand", icon: Type },
  { id: "items", label: "Items", icon: LayoutPanelTop },
  { id: "links", label: "Links & Hours", icon: Link2 },
  { id: "design", label: "Design", icon: Palette },
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

function BrandTab({ draft, setTitle, c, set }: { draft: StorePage; setTitle: (t: string) => void; c: PageConfig; set: Set }) {
  const up = useUploader();
  const categories = [...new Set([...CATEGORIES, ...(c.customCategories ?? [])])];
  const addCustomCategory = (category: string) => {
    if (!categories.some((existing) => existing.toLocaleLowerCase() === category.toLocaleLowerCase())) {
      set("customCategories", [...(c.customCategories ?? []), category]);
    }
  };
  return (
    <div className="space-y-5">
      <Section title="Brand & Identity" desc="Logo, name, and bio.">
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
          <CategorySelector value={c.category} categories={categories} onChange={(value) => set("category", value)} onCreate={addCustomCategory} testId="select-category" />
        </div>
        <div>
          <Label hint={`${c.bio.length}/160`}>Bio / tagline</Label>
          <TextArea value={c.bio} maxLength={160} onChange={(e) => set("bio", e.target.value)} data-testid="input-bio" />
        </div>
      </Section>

      <Section title="Background Image">
        <div className="flex items-center gap-3">
          <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-line bg-paper-2">
             {c.backgroundImage ? <img src={c.backgroundImage} alt="Background" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><ImageIcon className="h-6 w-6 text-muted" /></div>}
          </div>
          <UploadButton label={c.backgroundImage ? "Replace image" : "Upload image"} testId="input-bg-image" busy={up.busyKey === "bg"} onFile={(f) => {
              set("backgroundMode", "image");
              up.run("bg", f, PAGE_IMAGE_SIZE, (d) => set("backgroundImage", d));
          }} />
          {c.backgroundImage && <Btn type="button" size="sm" variant="ghost" onClick={() => { set("backgroundImage", ""); set("backgroundMode", "solid"); }}>Remove</Btn>}
        </div>
      </Section>
      
       <Section title="Announcement" aside={<Switch checked={c.showAnnouncement} onChange={(v) => set("showAnnouncement", v)} label="Show banner" testId="switch-announcement" />}>
        <div className={cn("space-y-4 transition", !c.showAnnouncement && "pointer-events-none opacity-40")}>
          <TextInput value={c.announcement} maxLength={120} onChange={(e) => set("announcement", e.target.value)} placeholder="Free delivery on orders over 20 JOD" data-testid="input-announcement" />
        </div>
      </Section>
    </div>
  );
}

function ItemsTab({ c, set }: { c: PageConfig; set: Set }) {
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
      <Section title="Products / Showcase" desc="Add up to 12 items. Customers order these directly via WhatsApp." aside={<Counter n={c.gallery.length} max={MAX_GALLERY} />}>
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
                <CategorySelector value={g.category ?? ""} categories={categories} onChange={(category) => updateItem(g.id, { category })} onCreate={addCustomCategory} allowEmpty testId={`select-gallery-category-${i}`} />
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
      </Section>
    </div>
  );
}

function LinksAndHoursTab({ c, set }: { c: PageConfig; set: Set }) {
  const update = (id: string, patch: Partial<SmartLink>) => set("links", c.links.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const move = (i: number, d: number) => { const a = [...c.links]; [a[i], a[i + d]] = [a[i + d], a[i]]; set("links", a); };
  const active = c.links.filter((l) => l.active).length;
  
  const updateBusinessDay = (day: typeof BUSINESS_DAYS[number]["id"], patch: Partial<PageConfig["businessHours"]["sun"]>) => {
    set("businessHours", { ...c.businessHours, [day]: { ...c.businessHours[day], ...patch } });
  };

  return (
    <div className="space-y-5">
      <Section title="WhatsApp Orders" desc="Set the WhatsApp number used when a customer orders an item.">
        <TextInput value={c.phone} onChange={(e) => set("phone", e.target.value)} placeholder="e.g. 962790000000" inputMode="tel" data-testid="input-contact-phone" />
        <p className="mt-1.5 text-[11.5px] text-muted">Include country code without '+'. This enables the 'Order on WhatsApp' button on your showcase items.</p>
      </Section>
      
      <Section title="Social & Location Links" desc="Add links to your Instagram, Location, Menu, etc." aside={<div className="flex items-center gap-2"><span className="text-[11px] text-muted">{active} visible</span><Counter n={c.links.length} max={MAX_LINKS} /></div>}>
        {c.links.length === 0 && (
          <div className="rounded-2xl border border-dashed border-ink/15 p-6 text-center">
            <p className="mt-3 text-sm font-semibold">No links yet</p>
          </div>
        )}
        {c.links.map((l, i) => (
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
              <TextInput value={l.url} onChange={(e) => update(l.id, { url: e.target.value })} placeholder="https://instagram.com/you" className="h-10 font-mono text-[12px]" data-testid={`input-link-url-${i}`} />
            </div>
          </div>
        ))}
        <Btn type="button" variant="outline" className="w-full" disabled={c.links.length >= MAX_LINKS} data-testid="button-add-link"
          onClick={() => set("links", [...c.links, { id: uid(), label: "", url: "", active: true, message: "" }])}>
          <Plus className="h-4 w-4" />{c.links.length >= MAX_LINKS ? "7 / 7 links used" : "Add link"}
        </Btn>
      </Section>

      <Section title="Business hours" desc="Auto-updates the Open/Closed status."
        aside={<Switch checked={c.businessHoursEnabled} onChange={(value) => set("businessHoursEnabled", value)} label="Use business hours" testId="switch-business-hours" />}>
        {c.businessHoursEnabled && <>
          <div className="space-y-2.5">
            {BUSINESS_DAYS.map(({ id, label }) => {
              const hours = c.businessHours[id];
              return (
                <div key={id} className="grid gap-3 rounded-2xl border border-line bg-white/65 p-3 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold">{label}</span>
                    <Switch checked={!hours.closed} onChange={(open) => updateBusinessDay(id, { closed: !open })}
                      label={`${label} open`} testId={`switch-business-hours-${id}`} />
                  </div>
                  {!hours.closed && (
                    <div className="grid grid-cols-2 gap-2">
                      <div><TextInput type="time" value={hours.open} onChange={(event) => updateBusinessDay(id, { open: event.target.value })} data-testid={`input-business-open-${id}`} /></div>
                      <div><TextInput type="time" value={hours.close} onChange={(event) => updateBusinessDay(id, { close: event.target.value })} data-testid={`input-business-close-${id}`} /></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>}
      </Section>
    </div>
  );
}


function DesignTab({ c, set, apply }: { c: PageConfig; set: Set; apply: (p: Partial<PageConfig>) => void }) {
  return (
    <div className="space-y-5">
      <Section title="Theme presets" desc="One click sets every color.">
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

      <Section title="Colors">
        <div className="grid gap-3 sm:grid-cols-2">
          {c.backgroundMode !== "image" && <ColorField label="Background" value={c.background} onChange={(v) => set("background", v)} testId="color-background" />}
          <ColorField label="Card / surface" value={c.surface} onChange={(v) => set("surface", v)} testId="color-surface" />
          <ColorField label="Accent" value={c.accent} onChange={(v) => set("accent", v)} testId="color-accent" />
          <ColorField label="Button" value={c.buttonColor} onChange={(v) => set("buttonColor", v)} testId="color-button" />
          <ColorField label="Text" value={c.textColor} onChange={(v) => set("textColor", v)} testId="color-text" />
        </div>
      </Section>
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
  const [tab, setTab] = useState<Tab>("brand");
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const [share, setShare] = useState(false);
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
    <div className="relative min-h-[100dvh] bg-paper lg:bg-transparent lg:pb-0">
      
      {/* 4-Tab Navigation (Mobile Full-width & Desktop) */}
      <div className="sticky top-0 z-40 bg-paper/95 border-b border-line shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-2 py-3 sm:px-6">
          <button onClick={() => { if (!dirty || confirm("Leave without saving your changes?")) router.push(base); }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-ink/5" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div className="no-scrollbar flex flex-1 overflow-x-auto px-2">
            <div className="flex w-full min-w-max justify-around gap-1 sm:justify-start">
              {TABS.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)} data-testid={`tab-${t.id}`}
                  className={cn("flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 transition-colors sm:flex-row sm:gap-2",
                    tab === t.id ? "bg-ink text-paper" : "text-ink-2 hover:bg-ink/5 hover:text-ink")}>
                  <t.icon className="h-4 w-4" />
                  <span className="text-[11px] font-semibold sm:text-[13px]">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
          
           <div className="hidden shrink-0 items-center gap-2 lg:flex pl-2">
             <Btn variant="soft" size="md" onClick={() => setShare(true)} data-testid="button-share"><QrCode className="h-4 w-4" />Share</Btn>
             <Btn variant="coral" onClick={save} loading={saving} disabled={!dirty} data-testid="button-save"><Save className="h-4 w-4" />Save</Btn>
           </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px]">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_440px]">
          
          {/* Editor Area (Full width on mobile if editing) */}
          <div className={cn("px-4 py-6 sm:px-6", mobileView === "preview" && "hidden lg:block pb-32 lg:pb-6")}>
            <div className="rise" style={{ animationDuration: ".35s" }}>
              {tab === "brand" && <BrandTab draft={draft} c={c} set={set} setTitle={(t) => setDraft({ ...draft, title: t })} />}
              {tab === "items" && <ItemsTab c={c} set={set} />}
              {tab === "links" && <LinksAndHoursTab c={c} set={set} />}
              {tab === "design" && <DesignTab c={c} set={set} apply={apply} />}
            </div>
          </div>

          {/* Live Preview Area (Hidden on mobile if editing) */}
          <aside className={cn("lg:border-l lg:border-line lg:bg-paper-2 lg:px-8", mobileView === "edit" && "hidden lg:block")}>
            <div className="sticky top-[80px] pt-6 pb-24 lg:pb-6">
              <PhoneFrame><Storefront title={draft.title} config={c} framed hideFooter /></PhoneFrame>
            </div>
          </aside>
        </div>
      </div>

      {/* Floating Bottom Bar (Mobile Only) */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-paper/95 p-4 shadow-[0_-10px_40px_-10px_rgba(23,32,30,.2)] backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}>
        <div className="mx-auto flex max-w-[520px] items-center gap-3">
           <button type="button" onClick={() => setMobileView(mobileView === "edit" ? "preview" : "edit")}
            className="flex h-12 w-14 shrink-0 items-center justify-center rounded-2xl border border-line bg-white text-ink transition hover:bg-ink/5">
            {mobileView === "edit" ? <Smartphone className="h-5 w-5" /> : <SlidersHorizontal className="h-5 w-5" />}
          </button>
          
          <button onClick={save} disabled={!dirty || saving}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-coral text-[15px] font-bold text-paper transition hover:bg-[#ff5544] disabled:opacity-50 disabled:grayscale">
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            {saving ? "Saving..." : dirty ? "Save Changes" : "Saved"}
          </button>
        </div>
      </div>
      
      <ShareKit open={share} onClose={() => setShare(false)} page={savedPage} dirty={dirty} />
    </div>
  );
}
