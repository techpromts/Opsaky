"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="ops-canvas flex min-h-screen items-center justify-center px-6">
    <section className="glass max-w-md rounded-[28px] p-8 text-center">
      <h1 className="font-display text-3xl font-bold">We couldn’t load this page</h1>
      <p className="mt-4 text-sm text-ink-2">Please try again in a moment. If you manage this deployment, check your external Clerk settings, database connection, and initialized Prisma schema.</p>
      <button onClick={reset} className="mt-6 rounded-full bg-ink px-6 py-3 font-semibold text-paper">Try again</button>
      <Link href="/" className="ml-4 text-sm underline">Go home</Link>
    </section>
  </main>;
}
