"use client";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle, ArrowRight, Check, Copy, ExternalLink, FlaskConical, Hourglass, Loader2, Lock, MoreHorizontal, Pencil, Plus, RefreshCw, Search, Settings2, Trash2, X, QrCode
} from "lucide-react";
import { useWorkspace } from "@/lib/workspace";
import { CATEGORIES, MAX_GALLERY_ITEMS, THEMES, slugify, validSlug, type StorePage } from "@/lib/model";
import { cn } from "@/lib/utils";
import { AppShell, CenterCard, useMode, useTitle } from "./shell";
import { Btn, Label, Modal, Skeleton, StatusBadge, TextInput } from "./ui";
import { StoreThumb } from "./storefront";
import { displayUrl, pageUrl } from "@/lib/urls";
export { displayUrl, pageUrl } from "@/lib/urls";

export const MAX_PAGES = 10;

export async function copyText(text: string, msg = "Link copied") {
  try { await navigator.clipboard.writeText(text); toast.success(msg); }
  catch { toast.error("Could not access the clipboard. Copy it manually: " + text); }
}

/* ---------- Debounced handle availability ---------- */
export function useHandleCheck(slug: string, skip?: (s: string) => boolean) {
  const ws = useWorkspace();
  const [state, setState] = useState<"idle" | "invalid" | "checking" | "available" | "taken" | "error">("idle");
  const checkRef = useRef(ws.checkHandle);
  checkRef.current = ws.checkHandle;
  const skipRef = useRef(skip);
  skipRef.current = skip;
  useEffect(() => {
    if (!slug) { setState("idle"); return; }
    if (!validSlug(slug)) { setState("invalid"); return; }
    if (skipRef.current?.(slug)) { setState("available"); return; }
    setState("checking");
    let live = true;
    const t = setTimeout(async () => {
      try { const ok = await checkRef.current(slug); if (live) setState(ok ? "available" : "taken"); }
      catch { if (live) setState("error"); }
    }, 420);
    return () => { live = false; clearTimeout(t); };
  }, [slug]);
  return state;
}

export function HandleHint({ state }: { state: ReturnType<typeof useHandleCheck> }) {
  const m = {
    idle: { t: "3-48 characters: lowercase letters, numbers, hyphens.", c: "text-muted", i: null },
    invalid: { t: "Use 3-48 lowercase letters, numbers or hyphens. Some words are reserved.", c: "text-stop", i: <X className="h-3.5 w-3.5" /> },
    checking: { t: "Checking availability...", c: "text-ink-2", i: <Loader2 className="h-3.5 w-3.5 animate-spin" /> },
    available: { t: "Available", c: "text-go", i: <Check className="h-3.5 w-3.5" /> },
    taken: { t: "Already taken. Try another handle.", c: "text-stop", i: <X className="h-3.5 w-3.5" /> },
    error: { t: "Could not check right now. Try again in a moment.", c: "text-stop", i: <AlertTriangle className="h-3.5 w-3.5" /> },
  }[state];
  return <p data-testid="text-handle-status" className={cn("mt-1.5 flex items-center gap-1.5 text-[12px] font-medium", m.c)}>{m.i}{m.t}</p>;
}

/* ---------- Gate screens ---------- */
function LoadingWorkspace() {
  return (
    <div className="pt-10">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="mt-3 h-5 w-96 max-w-full" />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[200px] rounded-[28px]" />)}
      </div>
    </div>
  );
}

function ConfigRequired() {
  return (
    <CenterCard>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-coral/10 text-coral"><Settings2 className="h-6 w-6" /></div>
      <h1 className="font-display mt-5 text-3xl font-bold">Configuration required</h1>
      <p className="mt-2 text-[15px] text-ink-2">This deployment does not have authentication and a database connected yet, so real workspaces are unavailable. Add these environment variables and redeploy:</p>
      <ul className="mt-4 space-y-1.5 rounded-2xl bg-ink p-4 font-mono text-[12px] text-paper/90">
        {["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY", "DATABASE_URL", "ADMIN_EMAIL"].map((k) => <li key={k}><span className="text-lime">$</span> {k}</li>)}
      </ul>
      <p className="mt-4 text-[13px] text-muted">Then run <code className="font-mono text-ink">npx prisma db push</code>. Meanwhile, the demo shows every feature using browser-local storage.</p>
      <Link href="/demo" className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-paper" data-testid="link-demo-config">
        <FlaskConical className="h-4 w-4 text-lime" /> Open the browser demo
      </Link>
    </CenterCard>
  );
}

function SignInRequired() {
  const ws = useWorkspace();
  return (
    <CenterCard className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-lime"><Lock className="h-5 w-5" /></div>
      <h1 className="font-display mt-5 text-3xl font-bold">Sign in to your studio</h1>
      <p className="mt-2 text-[15px] text-ink-2">Your workspace is tied to your Google account.</p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Btn size="lg" onClick={ws.signIn} data-testid="button-sign-in">Continue with Google</Btn>
        <Link href="/demo" className="inline-flex h-12 items-center justify-center rounded-full border border-line bg-white/70 px-6 text-[15px] font-semibold" data-testid="link-demo-signin">Try the demo</Link>
      </div>
    </CenterCard>
  );
}

function ActivationRequest() {
  const ws = useWorkspace();
  const [businessName, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [phone, setPhone] = useState("");
  const [slug, setSlug] = useState("");
  const [touchedSlug, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const effectiveSlug = touchedSlug ? slug : slugify(businessName);
  const handle = useHandleCheck(effectiveSlug);
  const canSubmit = businessName.trim().length > 1 && phone.trim().length > 5 && handle === "available" && !busy;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true); setErr(null);
    try {
      await ws.requestActivation({ businessName: businessName.trim(), category, phone: phone.trim(), requestedSlug: effectiveSlug });
      toast.success("Request sent. We will review it shortly.");
    } catch (e) { setErr(e instanceof Error ? e.message : "Could not send your request."); }
    finally { setBusy(false); }
  }

  return (
    <div className="grid min-h-[calc(100dvh-140px)] items-center gap-10 py-10 lg:grid-cols-[1fr_1.1fr]">
      <div className="rise">
        <span className="font-mono text-[12px] text-coral">step 01 / request access</span>
        <h1 className="font-display mt-3 text-4xl font-extrabold leading-[1] sm:text-5xl">Tell us about<br />your business.</h1>
        <p className="mt-4 max-w-sm text-[15px] text-ink-2">Every Opsaky account is reviewed by a person. Once approved, you can build up to {MAX_PAGES} pages from this workspace.</p>
        <ol className="mt-8 space-y-3 text-[14px]">
          {["Request activation", "Opsaky team reviews it", "Your studio unlocks"].map((s, i) => (
            <li key={s} className="flex items-center gap-3">
              <span className={cn("flex h-7 w-7 items-center justify-center rounded-full font-mono text-[12px] font-bold", i === 0 ? "bg-ink text-lime" : "border border-line text-muted")}>{i + 1}</span>
              <span className={i === 0 ? "font-semibold" : "text-muted"}>{s}</span>
            </li>
          ))}
        </ol>
        <p className="mt-8 font-mono text-[12px] text-muted">Signed in as {ws.session.email}</p>
      </div>
      <form onSubmit={submit} className="glass rise space-y-5 rounded-[32px] p-6 sm:p-8" style={{ animationDelay: ".08s" }} data-testid="form-activation">
        <div>
          <Label>Business / store name</Label>
          <TextInput value={businessName} onChange={(e) => setName(e.target.value)} placeholder="Ember & Oat Coffee" data-testid="input-business-name" required />
        </div>
        <div>
          <Label>Category</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CATEGORIES.map((c) => (
              <button type="button" key={c} onClick={() => setCategory(c)} data-testid={`button-category-${slugify(c)}`}
                className={cn("rounded-xl border px-3 py-2.5 text-left text-[12.5px] font-semibold transition", category === c ? "border-ink bg-ink text-paper" : "border-line bg-white/60 text-ink-2 hover:border-ink/40")}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>Phone / WhatsApp</Label>
          <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+962 7 9000 0000" inputMode="tel" data-testid="input-phone" required />
        </div>
        <div>
          <Label>First page handle</Label>
          <div className="flex h-11 items-center rounded-xl border border-line bg-white/80 pl-3.5 focus-within:border-ink focus-within:ring-4 focus-within:ring-ink/5">
            <span className="max-w-[50%] shrink-0 truncate font-mono text-[12.5px] text-muted" title={displayUrl("", false)}>{displayUrl("", false)}</span>
            <input value={effectiveSlug} onChange={(e) => { setTouched(true); setSlug(slugify(e.target.value)); }} placeholder="your-shop"
              className="h-full w-full bg-transparent pr-3 font-mono text-[13px] text-ink outline-none" data-testid="input-slug" />
          </div>
          <HandleHint state={handle} />
        </div>
        {err && <p className="flex items-center gap-2 rounded-xl bg-stop/10 px-3 py-2 text-[13px] text-stop" data-testid="text-activation-error"><AlertTriangle className="h-4 w-4" />{err}</p>}
        <Btn type="submit" size="lg" className="w-full" disabled={!canSubmit} loading={busy} data-testid="button-request-activation">
          Request account activation <ArrowRight className="h-4 w-4" />
        </Btn>
      </form>
    </div>
  );
}

function PendingGate() {
  const ws = useWorkspace();
  const a = ws.session.account!;
  const rejected = a.status === "REJECTED";
  const [busy, setBusy] = useState(false);
  return (
    <CenterCard>
      <div className="flex items-center justify-between">
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", rejected ? "bg-ink/5 text-muted" : "bg-stop/10 text-stop")}>
          {rejected ? <Lock className="h-5 w-5" /> : <Hourglass className="h-5 w-5" />}
        </div>
        <StatusBadge status={a.status} />
      </div>
      <h1 className="font-display mt-5 text-3xl font-bold">{rejected ? "This account is not active" : "Your studio is almost ready"}</h1>
      <p className="mt-2 text-[15px] text-ink-2">
        {rejected
          ? "The Opsaky team did not approve this request, or access was revoked. If you think this is a mistake, contact the team with the email below."
          : "Your account will be unlocked once it is confirmed by the Opsaky team. This page updates on its own."}
      </p>
      <dl className="mt-6 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white/60 text-[13.5px]">
        {[["Google email", ws.session.email], ["Business", a.businessName], ["Category", a.category], ["Requested handle", displayUrl(a.requestedSlug, false)]].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-4 py-3"><dt className="text-muted">{k}</dt><dd className="truncate text-right font-semibold" data-testid={`text-${slugify(k)}`}>{v}</dd></div>
        ))}
      </dl>
      <div className="mt-6 flex flex-wrap gap-2">
        <Btn variant="soft" loading={busy} onClick={async () => { setBusy(true); try { await ws.refresh(); } finally { setBusy(false); } }} data-testid="button-refresh-status">
          <RefreshCw className="h-4 w-4" /> Check status
        </Btn>
        <Link href="/demo" className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-ink-2 hover:bg-ink/5" data-testid="link-demo-pending">Explore the demo meanwhile</Link>
      </div>
    </CenterCard>
  );
}

function ErrorState({ message }: { message: string }) {
  const ws = useWorkspace();
  return (
    <CenterCard>
      <AlertTriangle className="h-8 w-8 text-stop" />
      <h1 className="font-display mt-4 text-2xl font-bold">Something got in the way</h1>
      <p className="mt-2 text-sm text-ink-2" data-testid="text-error">{message}</p>
      <Btn className="mt-6" onClick={() => void ws.refresh()} data-testid="button-retry"><RefreshCw className="h-4 w-4" />Try again</Btn>
    </CenterCard>
  );
}

/* ---------- Create page Modal ---------- */
function CreatePageModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ws = useWorkspace();
  const router = useRouter();
  const { base } = useMode();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [touched, setTouched] = useState(false);
  const [template, setTemplate] = useState(THEMES[0].id);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const effective = touched ? slug : slugify(title);
  const handle = useHandleCheck(effective);
  useEffect(() => { if (open) { setTitle(""); setSlug(""); setTouched(false); setErr(null); } }, [open]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (handle !== "available" || !title.trim()) return;
    setBusy(true); setErr(null);
    try {
      const p = await ws.createPage(title.trim(), effective, template);
      toast.success(`"${p.title}" created`);
      onClose();
      router.push(`${base}/edit/${p.id}`);
    } catch (e) { setErr(e instanceof Error ? e.message : "Could not create the page."); }
    finally { setBusy(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="New page" wide>
      <form onSubmit={submit} className="space-y-5" data-testid="form-create-page">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Page title</Label>
            <TextInput autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ember & Oat, Downtown" data-testid="input-page-title" />
          </div>
          <div>
            <Label>Handle</Label>
            <TextInput value={effective} onChange={(e) => { setTouched(true); setSlug(slugify(e.target.value)); }} placeholder="ember-oat" className="font-mono" data-testid="input-page-slug" />
          </div>
        </div>
        <HandleHint state={handle} />
        <div>
          <Label hint={`${THEMES.length} presets`}>Start from</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {THEMES.map((t) => (
              <button key={t.id} type="button" onClick={() => setTemplate(t.id)} data-testid={`button-template-${t.id}`}
                className={cn("group rounded-2xl border p-2 text-left transition", template === t.id ? "border-ink ring-2 ring-ink/10" : "border-line hover:border-ink/30")}>
                <div className="flex h-16 flex-col items-center justify-center gap-1.5 rounded-xl" style={{ background: t.background }}>
                  <span className="h-2 w-10 rounded-full" style={{ background: t.textColor, opacity: .8 }} />
                  <span className="h-3.5 w-14 rounded-full" style={{ background: t.buttonColor }} />
                  <span className="h-3.5 w-14 rounded-full" style={{ background: t.accent, opacity: .6 }} />
                </div>
                <div className="mt-1.5 truncate px-0.5 text-[11.5px] font-semibold">{t.name}</div>
              </button>
            ))}
          </div>
        </div>
        {err && <p className="rounded-xl bg-stop/10 px-3 py-2 text-[13px] text-stop" data-testid="text-create-error">{err}</p>}
        <div className="flex justify-end gap-2">
          <Btn type="button" variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" variant="coral" loading={busy} disabled={handle !== "available" || !title.trim()} data-testid="button-submit-create">Create and open studio</Btn>
        </div>
      </form>
    </Modal>
  );
}

/* ---------- Mobile-First Clean Page Card ---------- */
function PageCard({ page, onDelete, index }: { page: StorePage; onDelete: () => void; index: number }) {
  const { isDemo, base } = useMode();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const theme = THEMES.find((t) => t.id === page.config.theme) || THEMES[0];
  const url = pageUrl(page.slug, isDemo);

  return (
    <article className="group rise relative flex flex-col justify-between overflow-hidden rounded-[32px] border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur transition hover:border-ink/10 hover:shadow-md"
      style={{ animationDelay: `${index * 0.05}s` }} data-testid={`card-page-${page.id}`}>
      
      {/* Top Header: Logo & Info */}
      <div className="flex items-start gap-4">
        {page.config.logo ? (
          <img src={page.config.logo} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover border border-line" />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full font-display text-xl font-bold border border-line" style={{ background: theme.buttonColor, color: theme.background }}>
            {page.title.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1 pt-1">
          <h3 className="font-display truncate text-lg font-bold leading-tight" data-testid={`text-title-${page.id}`}>{page.title}</h3>
          <div className="mt-1 flex items-center gap-1.5 overflow-hidden">
            <span className="truncate font-mono text-[12px] text-muted">/{page.slug}</span>
            <button onClick={() => copyText(url, "Link copied!")} className="shrink-0 p-1 text-ink-2 transition hover:text-ink" aria-label="Copy link">
              <Copy className="h-3 w-3" />
            </button>
          </div>
        </div>
        <button onClick={() => setMoreOpen(true)} className="shrink-0 p-2 text-ink-2 hover:bg-ink/5 rounded-full" aria-label="More options">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex items-center gap-2">
        <button onClick={() => router.push(`${base}/edit/${page.id}`)} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-ink text-[14px] font-semibold text-paper transition hover:bg-[#24302d]">
          <Pencil className="h-4 w-4" /> Edit Page
        </button>
        <a href={url} target="_blank" rel="noreferrer" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-line bg-white text-ink transition hover:border-ink/30" aria-label="View live">
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {/* Mobile-friendly action sheet / More options */}
      {moreOpen && createPortal((
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6 pt-10 sm:items-center sm:p-0" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-ink/30 backdrop-blur-sm" aria-label="Close" onClick={() => setMoreOpen(false)} />
          <div className="relative w-full max-w-sm rounded-[32px] bg-paper p-6 shadow-2xl rise">
             <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-ink">{page.title}</h2>
                <p className="font-mono text-[11px] text-muted">/{page.slug}</p>
              </div>
              <button onClick={() => setMoreOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/5 text-ink-2"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => { setMoreOpen(false); void copyText(url, "Link copied!"); }} className="flex h-12 items-center gap-3 rounded-2xl bg-ink/5 px-4 text-sm font-semibold text-ink hover:bg-ink/10">
                <Copy className="h-4 w-4" /> Copy link
              </button>
              <a href={url} target="_blank" rel="noreferrer" onClick={() => setMoreOpen(false)} className="flex h-12 items-center gap-3 rounded-2xl bg-ink/5 px-4 text-sm font-semibold text-ink hover:bg-ink/10">
                <ExternalLink className="h-4 w-4" /> View public page
              </a>
              <button onClick={() => { setMoreOpen(false); onDelete(); }} className="flex h-12 items-center gap-3 rounded-2xl bg-stop/10 px-4 text-sm font-semibold text-stop hover:bg-stop/20">
                <Trash2 className="h-4 w-4" /> Delete page
              </button>
            </div>
          </div>
        </div>
      ), document.body)}
    </article>
  );
}

/* ---------- Workspace ---------- */
function Workspace() {
  const ws = useWorkspace();
  const { isDemo } = useMode();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<StorePage | null>(null);
  const [deleting, setDeleting] = useState(false);
  const count = ws.pages.length;
  const full = count >= MAX_PAGES;

  const counts = useMemo(() => {
    const m: Record<string, number> = { All: ws.pages.length };
    ws.pages.forEach((p) => { m[p.config.category] = (m[p.config.category] ?? 0) + 1; });
    return m;
  }, [ws.pages]);
  
  const categoryFilters = useMemo(() => ["All", ...new Set([...CATEGORIES, ...ws.pages.map((p) => p.config.category).filter(Boolean)])], [ws.pages]);
  const filtered = useMemo(() => ws.pages.filter((p) =>
    (cat === "All" || p.config.category === cat) &&
    (!q.trim() || `${p.title} ${p.slug} ${p.config.bio}`.toLowerCase().includes(q.trim().toLowerCase()))), [ws.pages, cat, q]);

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try { await ws.deletePage(toDelete.id); toast.success(`"${toDelete.title}" deleted`); setToDelete(null); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not delete the page."); }
    finally { setDeleting(false); }
  }

  const name = isDemo ? "Demo studio" : ws.session.account?.businessName || "Your studio";
  return (
    <div className="pt-4 sm:pt-8 mx-auto max-w-lg md:max-w-6xl">
      <div className="rise flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-3xl font-extrabold leading-none sm:text-4xl" data-testid="text-workspace-name">{name}</h1>
          <p className="mt-2 text-[14px] text-ink-2">{isDemo ? "Sample pages live in this browser." : "Manage your showcase pages."}</p>
        </div>
        <div className="flex items-center justify-between md:justify-end gap-4 border-t border-line pt-4 md:border-none md:pt-0">
          <div className="text-left md:text-right">
            <div className="font-mono text-[11px] text-ink-2" data-testid="text-page-count">{count} / {MAX_PAGES} used</div>
            <div className="mt-1 flex gap-1">
              {Array.from({ length: MAX_PAGES }).map((_, i) => <span key={i} className={cn("h-1 w-2 rounded-full", i < count ? (full ? "bg-coral" : "bg-ink") : "bg-ink/10")} />)}
            </div>
          </div>
          <button onClick={() => setCreating(true)} disabled={full} className="flex h-11 items-center gap-2 rounded-full bg-coral px-5 text-sm font-bold text-paper transition hover:bg-[#ff5544] disabled:opacity-50">
            <Plus className="h-4 w-4" /> {full ? "Max limit" : "New page"}
          </button>
        </div>
      </div>

      {count > 0 && (
        <div className="rise mt-6 flex flex-col gap-3 lg:flex-row lg:items-center" style={{ animationDelay: ".06s" }}>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pages..." className="rounded-2xl pl-10 h-12" data-testid="input-search" />
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {categoryFilters.map((c) => (
              <button key={c} onClick={() => setCat(c)} data-testid={`filter-${slugify(c)}`}
                className={cn("flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2.5 text-[13px] font-semibold transition",
                  cat === c ? "border-ink bg-ink text-paper" : "border-line bg-white/50 text-ink-2 hover:border-ink/30")}>
                {c}<span className={cn("font-mono text-[10px]", cat === c ? "text-lime" : "text-muted")}>{counts[c] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {count === 0 ? (
        <div className="rise mt-8 rounded-[32px] border border-dashed border-ink/20 bg-white/40 p-8 text-center sm:p-12">
          <h2 className="font-display text-2xl font-bold">Your shelf is empty.</h2>
          <p className="mt-2 text-sm text-ink-2">Create your first page to start selling on WhatsApp.</p>
          <button onClick={() => setCreating(true)} className="mx-auto mt-6 flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-paper">
            <Plus className="h-4 w-4" /> Create first page
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-8 rounded-[28px] border border-dashed border-ink/20 bg-white/40 p-10 text-center">
          <Search className="mx-auto h-6 w-6 text-muted" />
          <p className="mt-3 font-semibold">No pages match your search.</p>
          <Btn variant="soft" size="sm" className="mt-4 mx-auto" onClick={() => { setQ(""); setCat("All"); }}>Clear filters</Btn>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => <PageCard key={p.id} page={p} index={i} onDelete={() => setToDelete(p)} />)}
        </div>
      )}

      <CreatePageModal open={creating} onClose={() => setCreating(false)} />
      
      {/* Delete Confirmation Modal */}
      <Modal open={!!toDelete} onClose={() => !deleting && setToDelete(null)} title="Delete this page?">
        <p className="text-[14px] text-ink-2">
          <b className="text-ink">{toDelete?.title}</b> and its items will be permanently removed. This cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Btn variant="ghost" onClick={() => setToDelete(null)} disabled={deleting}>Cancel</Btn>
          <Btn variant="danger" onClick={confirmDelete} loading={deleting}><Trash2 className="h-4 w-4" /> Delete</Btn>
        </div>
      </Modal>
    </div>
  );
}

export function Dashboard() {
  const ws = useWorkspace();
  const { isDemo } = useMode();
  useTitle(isDemo ? "Demo workspace" : "Workspace");
  let body;
  if (!ws.ready || (ws.loading && !ws.pages.length && isDemo)) body = <LoadingWorkspace />;
  else if (isDemo) body = ws.error && !ws.pages.length ? <ErrorState message={ws.error} /> : <Workspace />;
  else if (!ws.session.configured) body = <ConfigRequired />;
  else if (!ws.session.signedIn) body = <SignInRequired />;
  else if (!ws.session.account) body = <ActivationRequest />;
  else if (ws.session.account.status !== "APPROVED") body = <PendingGate />;
  else if (ws.error && !ws.pages.length) body = <ErrorState message={ws.error} />;
  else body = <Workspace />;
  return <AppShell>{body}</AppShell>;
}
