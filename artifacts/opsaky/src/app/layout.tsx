import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { WorkspaceProvider } from "@/lib/workspace";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Opsaky — Your business. One beautiful link.", template: "%s · Opsaky" },
  description: "Turn your business into one beautiful link. Create a digital showcase, share your products, and connect with customers with Opsaky.",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  openGraph: { title: "Opsaky — Your business. One beautiful link.", description: "A beautiful online home for every kind of business.", type: "website" },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const content = <WorkspaceProvider>{children}</WorkspaceProvider>;
  return <html lang="en" dir="ltr"><body>{process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY ? <ClerkProvider afterSignOutUrl="/">{content}</ClerkProvider> : content}</body></html>;
}
