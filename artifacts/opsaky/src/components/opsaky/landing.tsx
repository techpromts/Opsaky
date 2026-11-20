"use client";
import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight, Check, FlaskConical, Link2, Palette, QrCode, Smartphone } from "lucide-react";
import { useWorkspace } from "@/lib/workspace";
import { defaultConfig, THEMES, type PageConfig } from "@/lib/model";
import { Logo } from "./logo";
import { Btn } from "./ui";
import { StoreThumb } from "./storefront";
import { useTitle } from "./shell";

function GoogleG() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.6 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12s4.2 9.5 9.4 9.5c5.4 0 9-3.8 9-9.2 0-.6-.07-1.1-.16-1.6z" />
      <path fill="#34A853" d="M3.7 7.5l3.2 2.4C7.8 8 9.7 6.6 12 6.6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.6 2.5 12 2.5 8.4 2.5 5.3 4.5 3.7 7.5z" opacity=".0" />
      <path fill="#4285F4" d="M21 12.3c0-.6-.07-1.1-.16-1.6H12v3.9h5.5c-.27 1.3-1.1 2.4-2.3 3.1l3.3 2.6c1.9-1.8 2.5-4.6 2.5-8z" />
      <path fill="#FBBC05" d="M6.3 14.3a6 6 0 0 1 0-4.6L3 7.2a9.5 9.5 0 0 0 0 9.6z" />
      <path fill="#34A853" d="M12 21.5c2.6 0 4.7-.9 6.3-2.3l-3.3-2.6c-.9.6-2 1-3 1-2.3 0-4.3-1.6-5-3.7L3.7 16.5c1.6 3 4.7 5 8.3 5z" />
    </svg>
  );
}

const sample = (id: string, patch: Partial<PageConfig>): PageConfig => {
  const t = THEMES.find((x) => x.id === id) ?? THEMES[0];
  return { ...defaultConfig(), theme: t.id, background: t.background, surface: t.surface, accent: t.accent, buttonColor: t.buttonColor, textColor: t.textColor, ...patch };
};
const L = (label: string, url: string) => ({ id: label, label, url, active: true, message: "" });

const previews = [
  { title: "Ember & Oat", r: "-6deg", config: sample("cream", { category: "Restaurant/Cafe", logo: "/images/cafe-logo.jpg", bio: "Slow coffee, warm bread, small-batch everything.", showStatus: true, buttonShape: "pill", links: [L("Order on WhatsApp", "https://wa.me/1"), L("Instagram", "https://instagram.com/x"), L("Find us", "https://maps.google.com")] }) },
  { title: "Maison Ambre", r: "0deg", config: sample("noir", { category: "Perfumes/Beauty", font: "serif", logo: "/images/perfume.jpg", bio: "Hand-blended extraits, bottled in small runs.", material: "glass", galleryMode: "featured", gallery: [{ id: "a", image: "/images/perfume.jpg", title: "Oud Nocturne", price: "48 JOD" }], links: [L("Book a scent consultation", "https://wa.me/1")] }) },
  { title: "Kiln Theory", r: "6deg", config: sample("appetite", { category: "Home Business", font: "geometric", logo: "/images/ceramics.jpg", logoShape: "rounded", material: "border", buttonShape: "sharp", gallery: [{ id: "a", image: "/images/ceramics.jpg", title: "Speckled mug", price: "14 JOD" }, { id: "b", image: "/images/coffee.jpg", title: "Pour-over set", price: "32 JOD" }], links: [L("Shop drop", "https://shop.example.com")] }) },
];

export function Landing() {
  const ws = useWorkspace();
  useTitle("Your storefront, in one link");
  const configured = ws.session.configured;

  return (
    <div className="ops-canvas overflow-hidden">
      <header className="relative z-20 mx-auto flex h-20 max-w-6xl items-center justify-between px-5">
        <Logo />
        <div className="flex items-center gap-2">
          {ws.session.isAdmin && <Link href="/admin" className="rounded-full px-3 py-1.5 text-sm font-semibold text-ink-2 hover:bg-ink/5" data-testid="link-admin">Admin panel</Link>}
          <Link href="/demo" data-testid="link-demo-header" className="rounded-full border border-ink/15 bg-white/50 px-4 py-2 text-sm font-semibold text-ink backdrop-blur transition hover:bg-white">Try the demo</Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-6 lg:grid-cols-[1.05fr_1fr] lg:pt-12">
        <div className="rise">
          <div className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/60 px-3 py-1.5 text-[12px] font-semibold text-ink-2 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-coral" /> Bio-link · showcase · mini storefront
          </div>
          <h1 className="font-display mt-6 text-[44px] font-extrabold leading-[0.95] text-ink sm:text-[68px]">
            The corner shop,<br />
            <span className="relative inline-block">
              <span className="relative z-10">dressed like</span>
              <span className="absolute inset-x-[-4px] bottom-1 z-0 h-4 -rotate-1 rounded bg-lime sm:h-6" />
            </span>{" "}
            <span className="text-coral">a brand.</span>
          </h1>
          <p className="mt-6 max-w-md text-[17px] leading-relaxed text-ink-2">
            Opsaky turns one link into a page your customers trust: your logo, your products, your WhatsApp, your hours. Built for cafes, boutiques, perfumers, and the business you run from home.
          </p>

          <div className="glass mt-8 max-w-md rounded-[28px] p-5" data-testid="card-sign-in">
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-2">Sign in to your studio</div>
            <button onClick={ws.signIn} disabled={!configured} data-testid="button-google-sign-in"
              className="mt-3 flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-ink/10 bg-white text-[15px] font-semibold text-ink shadow-[0_8px_20px_-12px_rgba(23,32,30,.4)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-14px_rgba(23,32,30,.5)] active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0">
              <GoogleG /> Continue with Google
            </button>
            {!configured && ws.ready && (
              <p className="mt-2 text-[12px] text-muted" data-testid="text-not-configured">Sign-in is not configured on this deployment yet. The demo works fully in your browser.</p>
            )}
            <div className="my-4 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-widest text-muted">
              <span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" />
            </div>
            <Link href="/demo" data-testid="button-try-demo"
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ink text-[15px] font-semibold text-paper transition hover:bg-[#24302d]">
              <FlaskConical className="h-4 w-4 text-lime" /> Try the browser demo
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
            <p className="mt-2.5 text-center text-[11.5px] text-muted">Demo runs locally in this browser. No account, nothing published.</p>
          </div>
        </div>

        <div className="relative hidden h-[560px] sm:block">
          {previews.map((p, i) => (
            <div key={p.title} className="float absolute top-0 w-[248px] overflow-hidden rounded-[34px] border-[7px] border-ink bg-ink shadow-[0_40px_70px_-30px_rgba(23,32,30,.55)]"
              style={{ left: `${i * 30}%`, top: i === 1 ? 0 : 50, zIndex: i === 1 ? 3 : 1, ["--r" as string]: p.r, animationDelay: `${i * -2.2}s` } as CSSProperties}>
              <div className="overflow-hidden rounded-[27px]"><StoreThumb title={p.title} config={p.config} height={470} scale={0.6} /></div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-24">
        <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="glass rounded-[28px] p-7">
            <Smartphone className="h-6 w-6 text-coral" />
            <h3 className="font-display mt-4 text-2xl font-bold">A studio with a live phone beside it.</h3>
            <p className="mt-2 text-[15px] text-ink-2">Every color, font, photo and link updates the preview the moment you touch it. No publish-and-pray.</p>
          </div>
          <div className="rounded-[28px] bg-ink p-7 text-paper">
            <Palette className="h-6 w-6 text-lime" />
            <h3 className="font-display mt-4 text-xl font-bold">Five presets, full custom control</h3>
            <p className="mt-2 text-[14px] text-paper/70">Luxury Noir to Clean Studio, then gradients, image backgrounds, glass and brutal cards.</p>
          </div>
          <div className="rounded-[28px] bg-coral p-7 text-white">
            <QrCode className="h-6 w-6" />
            <h3 className="font-display mt-4 text-xl font-bold">Print-ready QR</h3>
            <p className="mt-2 text-[14px] text-white/85">Download a high-res PNG for your counter, table, or packaging.</p>
          </div>
        </div>
        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[13px] font-medium text-ink-2">
          {["Up to 10 pages per account", "7 smart links with auto icons", "4-item product showcase", "WhatsApp pre-filled messages", "Manually reviewed accounts"].map((t) => (
            <li key={t} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-teal" />{t}</li>
          ))}
        </ul>
        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-line pt-6 text-[12px] text-muted sm:flex-row sm:items-center">
          <span className="flex items-center gap-2"><Link2 className="h-3.5 w-3.5" /> opsaky — one link, a whole shop window.</span>
          <Btn variant="ghost" size="sm" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Back to top</Btn>
        </div>
      </section>
      <footer className="border-t border-line/70 px-5 py-5 text-center text-[12px] font-medium text-muted">
        Powered by techpromts
      </footer>
    </div>
  );
}
