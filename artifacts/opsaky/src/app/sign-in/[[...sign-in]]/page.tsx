import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
export default function SignInPage() {
  const configured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
  return <main style={{ minHeight: "100vh", display: "grid", placeContent: "center", gap: 24, background: "#f5f4ef", textAlign: "center", padding: 24 }}>
    <Link href="/" style={{ fontWeight: 700, fontSize: 30, color: "#253a30", textDecoration: "none" }}>opsaky</Link>
    {configured ? <SignIn routing="path" path="/sign-in" forceRedirectUrl="/dashboard" signUpUrl="/sign-up" /> : <section style={{ maxWidth: 420, background: "white", padding: 36, borderRadius: 24 }}>
      <h1 style={{ fontSize: 24, marginBottom: 14 }}>Your workspace is almost ready</h1>
      <p style={{ color: "#6e756f", lineHeight: 1.7 }}>Google sign-in needs your external Clerk application keys. Add the variables listed in the README to enable live accounts.</p>
      <Link href="/demo" style={{ display: "inline-block", background: "#344d3d", color: "white", padding: "12px 24px", borderRadius: 12, marginTop: 20 }}>Explore the demo studio</Link>
    </section>}
  </main>;
}
