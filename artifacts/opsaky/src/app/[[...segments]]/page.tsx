import OpsakyApp from "@/components/opsaky/opsaky-app";
import type { Metadata } from "next";
import { publishedPage } from "@/lib/server/public-page";
import { PublicPage } from "@/components/opsaky/public-page";
import { validSlug } from "@/lib/model";
import { getRequestOrigin } from "@/lib/server/urls";

// Read saved content and workspace approval on every visit, even for inactive slugs.
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ segments?: string[] }> }): Promise<Metadata> {
  const segments = (await params).segments ?? [];
  const route = segments[0];
  const origin = await getRequestOrigin();
  const url = origin ? `${origin}/${segments.map(encodeURIComponent).join("/")}` : undefined;
  const hostMetadata: Metadata = {
    ...(origin ? { metadataBase: new URL(origin) } : {}),
    alternates: { canonical: url },
  };
  if (segments.length === 1 && validSlug(route)) {
    const page = await publishedPage(route);
    if (page) return {
      ...hostMetadata,
      title: page.title, description: page.config.bio || `Discover ${page.title} on Opsaky.`,
      openGraph: { title: page.title, description: page.config.bio || `Discover ${page.title} on Opsaky.`, type: "website", url },
    };
    return { title: "Page not active yet", robots: { index: false, follow: false } };
  }
  const title = route === "dashboard" ? "Your workspace" : route === "admin" ? "Account management" : route === "demo" ? "Explore the studio" : route ? "Business showcase" : "Your business. One beautiful link.";
  return {
    ...hostMetadata, title,
    openGraph: { title, description: "A beautiful online home for every kind of business.", type: "website", url },
    robots: route === "dashboard" || route === "admin" || route === "demo" ? { index: false, follow: false } : undefined,
  };
}
export default async function Page({ params }: { params: Promise<{ segments?: string[] }> }) {
  const segments = (await params).segments ?? [];
  if (segments.length === 1 && validSlug(segments[0])) {
    return <PublicPage key={segments[0]} slug={segments[0]} initialPage={await publishedPage(segments[0])} />;
  }
  return <OpsakyApp />;
}
