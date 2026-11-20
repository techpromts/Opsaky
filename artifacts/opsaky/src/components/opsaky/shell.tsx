"use client";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, FlaskConical, LayoutGrid, LogOut, MoreHorizontal, ShieldCheck, X } from "lucide-react";
import { useWorkspace } from "@/lib/workspace";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

export function useMode() {
  const pathname = usePathname() || "/";
  const isDemo = pathname === "/demo" || pathname.startsWith("/demo/");
  return { isDemo, base: isDemo ? "/demo" : "/dashboard", adminPath: "/admin", pathname };
}

export function useTitle(title: string) {
  useEffect(() => { document.title = title ? `${title} · Opsaky` : "Opsaky"; }, [title]);
}

export function DemoBanner() {
  return (
    <div data-testid="banner-demo" className="relative z-40 flex items-center justify-center gap-2 bg-ink px-4 py-2 text-center text-[12px] font-medium text-paper">
      <FlaskConical className="h-3.5 w-3.5 shrink-0 text-lime" />
      <span><b className="text-lime">Demo mode.</b> Everything here is stored only in this browser. Nothing is signed in, saved to a server, or published publicly.</span>
    </div>
  );
}

export function AppShell({ children, wide, hideMobileHeader, mobileFooter }: { children: ReactNode; wide?: boolean; hideMobileHeader?: boolean; mobileFooter?: boolean }) {
  const ws = useWorkspace();
  const [menuOpen, setMenuOpen] = useState(false);
  const { isDemo, base, adminPath, pathname } = useMode();
  const showAdmin = !isDemo && ws.session.isAdmin;
  const nav = [
    { href: base, label: isDemo ? "Demo workspace" : "Workspace", icon: LayoutGrid, active: pathname === base || pathname.startsWith(base + "/edit") },
    ...(showAdmin ? [{ href: adminPath, label: "Admin panel", icon: ShieldCheck, active: pathname === adminPath }] : []),
  ];
  return (
    <div className="ops-canvas">
      {isDemo && <DemoBanner />}
      <header className={cn("relative z-30 border-b border-white/60 bg-paper/75 backdrop-blur-2xl", hideMobileHeader && "hidden md:block")}>
        <div className={cn("mx-auto flex h-14 items-center gap-3 px-4 md:h-16 md:gap-4 md:px-6", wide ? "max-w-[1500px]" : "max-w-6xl")}>
          <Link href={isDemo ? "/demo" : "/"} data-testid="link-home"><Logo /></Link>
          <nav className="ml-2 hidden items-center gap-1 md:flex">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} data-testid={`link-nav-${n.label.toLowerCase().replace(/\s/g, "-")}`}
                className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold transition",
                  n.active ? "bg-ink text-paper" : "text-ink-2 hover:bg-ink/5")}>
                <n.icon className="h-3.5 w-3.5" /><span className="hidden sm:inline">{n.label}</span>
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {isDemo && (
              <Link href="/" aria-label="← Back to Home" data-testid="link-back-to-home"
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-line bg-white/85 px-3 text-[12px] font-bold text-ink shadow-sm transition hover:border-ink/30 hover:bg-white md:text-[13px]">
                <ArrowLeft className="h-4 w-4" />Back to Home
              </Link>
            )}
            <div className="hidden items-center gap-2 md:flex">
              {isDemo ? (
                <span className="rounded-full border border-dashed border-ink/30 px-3 py-1 font-mono text-[11px] text-ink-2">local sample</span>
              ) : ws.session.signedIn ? (
                <>
                  <span className="hidden max-w-[220px] truncate font-mono text-[11.5px] text-ink-2 md:inline" data-testid="text-email">{ws.session.email}</span>
                  <button onClick={ws.signOut} data-testid="button-sign-out" className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold text-ink-2 transition hover:bg-ink/5 hover:text-ink">
                    <LogOut className="h-3.5 w-3.5" /><span className="hidden sm:inline">Sign out</span>
                  </button>
                </>
              ) : null}
            </div>
            <button type="button" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white/65 text-ink md:hidden" data-testid="button-shell-menu">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" data-testid="drawer-shell-menu">
          <button type="button" className="absolute inset-0 bg-ink/30 backdrop-blur-sm" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] border border-white/80 bg-paper/95 p-5 shadow-2xl backdrop-blur-2xl"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)" }}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Menu</h2>
              <button type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/5" data-testid="button-close-shell-menu"><X className="h-4 w-4" /></button>
            </div>
            <nav className="space-y-2">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} data-testid={`mobile-link-nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
                  className={cn("flex min-h-12 items-center gap-3 rounded-2xl px-4 text-sm font-semibold", item.active ? "bg-ink text-paper" : "bg-white/70 text-ink-2")}>
                  <item.icon className="h-4 w-4" />{item.label}
                </Link>
              ))}
              {isDemo && <div className="rounded-2xl border border-dashed border-ink/20 px-4 py-3 text-xs text-ink-2">Demo changes stay in this browser.</div>}
              {!isDemo && ws.session.signedIn && (
                <button type="button" onClick={() => { setMenuOpen(false); ws.signOut(); }} className="flex min-h-12 w-full items-center gap-3 rounded-2xl bg-white/70 px-4 text-sm font-semibold text-ink-2" data-testid="mobile-button-sign-out">
                  <LogOut className="h-4 w-4" />Sign out
                </button>
              )}
            </nav>
          </div>
        </div>
      )}
      <div className={cn("relative z-10 mx-auto px-4 pb-20 sm:px-6", wide ? "max-w-[1500px]" : "max-w-6xl", mobileFooter && "pb-[calc(env(safe-area-inset-bottom)_+_6rem)] md:pb-20")}>{children}</div>
    </div>
  );
}

export function CenterCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="flex min-h-[calc(100dvh-140px)] items-center justify-center py-10">
      <div className={cn("glass rise w-full max-w-lg rounded-[32px] p-7 sm:p-9", className)}>{children}</div>
    </div>
  );
}
