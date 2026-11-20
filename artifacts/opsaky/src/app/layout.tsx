import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Fraunces, Syne } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { WorkspaceProvider } from "@/lib/workspace";
import "./globals.css";

const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const serif = Fraunces({ subsets: ["latin"], variable: "--font-serif", display: "swap" });
const geometric = Syne({ subsets: ["latin"], variable: "--font-geometric", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Opsaky — Your business. One beautiful link.", template: "%s · Opsaky" },
  description: "Turn your business into one beautiful link. Create a digital showcase, share your products, and connect with customers with Opsaky.",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  openGraph: {
    title: "Opsaky — Your business. One beautiful link.",
    description: "A beautiful online home for every kind of business.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
  const content = <WorkspaceProvider>{children}</WorkspaceProvider>;

  return (
    <html lang="en" dir="ltr" className={`${sans.variable} ${serif.variable} ${geometric.variable}`}>
      <body className="min-h-[100dvh] bg-paper text-ink antialiased selection:bg-coral/20">
        {hasClerk ? <ClerkProvider afterSignOutUrl="/">{content}</ClerkProvider> : content}
      </body>
    </html>
  );
}
