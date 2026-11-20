import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Fraunces, Syne } from "next/font/google";
import "./globals.css";

const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const serif = Fraunces({ subsets: ["latin"], variable: "--font-serif", display: "swap" });
const geometric = Syne({ subsets: ["latin"], variable: "--font-geometric", display: "swap" });

export const metadata: Metadata = {
  title: "Opsaky",
  description: "Modern digital storefront & link-in-bio studio",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${geometric.variable}`}>
      <body className="min-h-[100dvh] bg-paper text-ink antialiased selection:bg-coral/20">
        {children}
      </body>
    </html>
  );
}
