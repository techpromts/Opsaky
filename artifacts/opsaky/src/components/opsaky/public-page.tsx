"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, RefreshCw } from "lucide-react";
import { useWorkspace } from "@/lib/workspace";
import type { StorePage } from "@/lib/model";
import { Logo } from "./logo";
import { Btn, Skeleton } from "./ui";
import { Storefront } from "./storefront";
import { DemoBanner, useTitle } from "./shell";

function PublicSkeleton() {
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-[480px] flex-col items-center px-5 pt-14">
      <Skeleton className="h-24 w-24 rounded-full" />
      <Skeleton className="mt-5 h-7 w-48" />
      <Skeleton className="mt-3 h-4 w-64" />
      <div className="mt-10 w-full space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[52px] w-full rounded-2xl" />)}</div>
    </div>
  );
}

function NotActive({ slug, demo }: { slug: string; demo?: boolean }) {
  return (
    <div className="ops-canvas flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
      <div className="glass rise w-full max-w-sm rounded-[32px] p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ink text-lime"><Clock className="h-6 w-6" /></div>
        <h1 className="font-display mt-5 text-3xl font-bold" data-testid="text-not-active">Page not active yet</h1>
        <p className="mt-2 text-[14px] text-ink-2">
          {demo ? <>No demo page called <b className="font-mono">/{slug}</b> exists in this browser.</> : <>The page at <b className="font-mono">/{slug}</b> is not available right now. Check back soon.</>}
        </p>
        <Link href={demo ? "/demo" : "/"} className="mt-6 inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-paper" data-testid="link-not-active-home">
          <ArrowLeft className="h-4 w-4" />{demo ? "Back to demo" : "Visit Opsaky"}
        </Link>
      </div>
      <div className="mt-8 opacity-60"><Logo /></div>
    </div>
  );
}

export function PublicPage({ slug, initialPage }: { slug: string; initialPage?: StorePage | null }) {
  const ws = useWorkspace();
  const [page, setPage] = useState<StorePage | null | undefined>(initialPage);
  const [error, setError] = useState<string | null>(null);
  const getRef = ws.getPublicPage;
  useTitle(page ? page.title : page === null ? "Page not active" : "");

  const load = useCallback(async () => {
    setError(null); setPage(undefined);
    try { setPage(await getRef(slug)); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load this page."); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);
  useEffect(() => { if (initialPage === undefined) void load(); }, [load, initialPage]);

  if (error) {
    return (
      <div className="ops-canvas flex min-h-[100dvh] items-center justify-center px-6 text-center">
        <div className="glass w-full max-w-sm rounded-[32px] p-8">
          <h1 className="font-display text-2xl font-bold">Could not load this page</h1>
          <p className="mt-2 text-sm text-ink-2" data-testid="text-public-error">{error}</p>
          <Btn className="mt-5" onClick={() => void load()} data-testid="button-public-retry"><RefreshCw className="h-4 w-4" />Try again</Btn>
        </div>
      </div>
    );
  }
  if (page === undefined) return <div className="ops-canvas"><PublicSkeleton /></div>;
  if (page === null) return <NotActive slug={slug} />;
  return <Storefront title={page.title} config={page.config} hideFooter />;
}

export function DemoPreview({ slug }: { slug: string }) {
  const ws = useWorkspace();
  const page = ws.pages.find((p) => p.slug === slug) ?? null;
  useTitle(page ? `${page.title} (local preview)` : "Local preview");
  if (!ws.ready) return <div className="ops-canvas"><PublicSkeleton /></div>;
  if (!page) return <NotActive slug={slug} demo />;
  return (
    <div>
      <DemoBanner />
      <div className="flex items-center justify-between bg-lime px-4 py-1.5 text-[11.5px] font-semibold text-ink">
        <span>Local preview of a demo page. Not published at /{slug}.</span>
        <Link href={`/demo/edit/${page.id}`} className="underline underline-offset-4" data-testid="link-preview-edit">Edit</Link>
      </div>
      <Storefront title={page.title} config={page.config} footer="Powered by Opsaky · local preview" />
    </div>
  );
}
