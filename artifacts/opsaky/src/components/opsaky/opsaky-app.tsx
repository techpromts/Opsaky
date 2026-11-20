"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { Landing } from "./landing";
import { Dashboard } from "./dashboard";
import { Editor } from "./editor";
import { Admin } from "./admin";
import { DemoPreview, PublicPage } from "./public-page";
import { Logo } from "./logo";
import { useTitle } from "./shell";

function NotFound() {
  useTitle("Not found");
  return (
    <div className="ops-canvas flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
      <Logo />
      <div className="font-display mt-10 text-[120px] font-extrabold leading-none text-coral">404</div>
      <p className="mt-2 text-ink-2">Nothing lives at this address.</p>
      <Link href="/" className="mt-6 inline-flex h-10 items-center rounded-full bg-ink px-5 text-sm font-semibold text-paper" data-testid="link-404-home">Go home</Link>
    </div>
  );
}

function Route({ path }: { path: string }) {
  const parts = path.split("/").filter(Boolean).map((p) => decodeURIComponent(p));
  const [a, b, c, d] = parts;
  if (parts.length === 0) return <Landing />;
  if (a === "dashboard" || a === "demo") {
    if (parts.length === 1) return <Dashboard />;
    if (b === "edit" && c && !d) return <Editor key={c} id={c} />;
    if (a === "demo" && b === "preview" && c && !d) return <DemoPreview slug={c} />;
    return <NotFound />;
  }
  if (a === "admin" && parts.length === 1) return <Admin />;
  if (parts.length === 1) return <PublicPage slug={a.toLowerCase()} />;
  return <NotFound />;
}

export default function OpsakyApp() {
  const pathname = usePathname() || "/";
  return (
    <>
      <Route path={pathname} />
      <Toaster position="bottom-center" toastOptions={{ style: { borderRadius: 18, background: "#17201e", color: "#f1eee7", border: "none", fontFamily: "var(--font-sans)" } }} />
    </>
  );
}
