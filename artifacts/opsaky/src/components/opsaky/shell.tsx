"use client";
import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FlaskConical, LayoutGrid, LogOut, ShieldCheck } from "lucide-react";
import { useWorkspace } from "@/lib/workspace";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

export function useMode() {
  const pathname = usePathname() || "/";
  const isDemo = pathname === "/demo" || pathname.startsWith("/demo/");
  return { isDemo, base: isDemo ? "/demo" : "/dashboard", adminPath: isDemo ? "/demo/admin" : "/admin", pathname };
}

export function useTitle(title: string) {
  useEffect(() => { document.title = title ? `${title} · Opsaky` : "Opsaky"; }, [title]);
}

export function DemoBanner() {
  return (
    <div data-testid="banner-demo" className="relative z-40 flex items-center justify-center gap-2 bg-ink px-4 py-2 text-center text-[12px] font-medium text-paper">
      <FlaskConical className="h-3.5 w-3.5 shrink-0 text-lime" />
      <span><b className="text-lime">Demo mode.</b> Everything here is stored only in this browser. Nothing is signed in, saved to a server, or published publicly.</span>
      <Link href="/" className="ml-2 hidden shrink-0 underline decoration-lime/60 underline-offset-4 hover:text-lime sm:inline" data-testid="link-exit-demo">Exit demo</Link>
    </div>
  );
}

export function AppShell({ children, wide }: { children: ReactNode; wide?: boolean }) {
  const ws = useWorkspace();
  const { isDemo, base, adminPath, pathname } = useMode();
  const showAdmin = isDemo || ws.session.isAdmin;
  const nav = [
    { href: base, label: isDemo ? "Demo workspace" : "Workspace", icon: LayoutGrid, active: pathname === base || pathname.startsWith(base + "/edit") },
    ...(showAdmin ? [{ href: adminPath, label: isDemo ? "Demo admin" : "Admin panel", icon: ShieldCheck, active: pathname === adminPath }] : []),
  ];
  return (
    <div className="ops-canvas">
      {isDemo && <DemoBanner />}
      <header className="sticky top-0 z-30 border-b border-white/60 bg-paper/70 backdrop-blur-xl">
        <div className={cn("mx-auto flex h-16 items-center gap-4 px-4 sm:px-6", wide ? "max-w-[1500px]" : "max-w-6xl")}>
          <Link href={isDemo ? "/demo" : "/"} data-testid="link-home"><Logo /></Link>
          <nav className="ml-2 flex items-center gap-1">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} data-testid={`link-nav-${n.label.toLowerCase().replace(/\s/g, "-")}`}
                className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold transition",
                  n.active ? "bg-ink text-paper" : "text-ink-2 hover:bg-ink/5")}>
                <n.icon className="h-3.5 w-3.5" /><span className="hidden sm:inline">{n.label}</span>
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
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
        </div>
      </header>
      <div className={cn("relative z-10 mx-auto px-4 pb-20 sm:px-6", wide ? "max-w-[1500px]" : "max-w-6xl")}>{children}</div>
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
