"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, FlaskConical, Inbox, RefreshCw, Search, ShieldAlert, X } from "lucide-react";
import { useWorkspace } from "@/lib/workspace";
import type { Account, AccountStatus } from "@/lib/model";
import { cn } from "@/lib/utils";
import { AppShell, CenterCard, useMode, useTitle } from "./shell";
import { Btn, Skeleton, StatusBadge, TextInput } from "./ui";
import { MAX_PAGES } from "./dashboard";

function Actions({ a, busy, onSet }: { a: Account; busy: string | null; onSet: (s: AccountStatus) => void }) {
  return (
    <div className="flex justify-end gap-1.5">
      <button disabled={!!busy || a.status === "APPROVED"} onClick={() => onSet("APPROVED")} data-testid={`button-approve-${a.id}`}
        className="inline-flex h-8 items-center gap-1 rounded-full bg-go px-3 text-[12px] font-bold text-white transition hover:brightness-110 disabled:opacity-25">
        {busy === "APPROVED" ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}Yes
      </button>
      <button disabled={!!busy || a.status === "REJECTED"} onClick={() => onSet("REJECTED")} data-testid={`button-reject-${a.id}`}
        className="inline-flex h-8 items-center gap-1 rounded-full border border-ink/20 bg-white px-3 text-[12px] font-bold text-ink-2 transition hover:border-stop hover:text-stop disabled:opacity-25">
        {busy === "REJECTED" ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}{a.status === "APPROVED" ? "Revoke" : "No"}
      </button>
    </div>
  );
}

export function Admin() {
  const ws = useWorkspace();
  const { isDemo } = useMode();
  useTitle("Admin panel");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"ALL" | AccountStatus>("ALL");
  const [busy, setBusy] = useState<Record<string, string>>({});

  const counts = useMemo(() => {
    const m = { ALL: ws.accounts.length, PENDING: 0, APPROVED: 0, REJECTED: 0 };
    ws.accounts.forEach((a) => { m[a.status]++; });
    return m;
  }, [ws.accounts]);
  const rows = useMemo(() => ws.accounts.filter((a) => (filter === "ALL" || a.status === filter) &&
    (!q.trim() || `${a.email} ${a.businessName} ${a.requestedSlug} ${a.phone} ${a.category}`.toLowerCase().includes(q.trim().toLowerCase()))), [ws.accounts, filter, q]);

  async function setStatus(a: Account, s: AccountStatus) {
    setBusy((b) => ({ ...b, [a.id]: s }));
    try { await ws.updateStatus(a.id, s); toast.success(`${a.businessName} is now ${s.toLowerCase()}`); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not update status."); }
    finally { setBusy((b) => { const n = { ...b }; delete n[a.id]; return n; }); }
  }

  if (!ws.ready) return <AppShell><div className="pt-10"><Skeleton className="h-10 w-64" /><Skeleton className="mt-8 h-96 rounded-[28px]" /></div></AppShell>;
  if (!isDemo && !ws.session.isAdmin) {
    return (
      <AppShell>
        <CenterCard className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-stop/10 text-stop"><ShieldAlert className="h-6 w-6" /></div>
          <h1 className="font-display mt-5 text-3xl font-bold">Admins only</h1>
          <p className="mt-2 text-[15px] text-ink-2">{ws.session.signedIn ? "This account does not have access to the admin panel." : "Sign in with the administrator account to continue."}</p>
          <div className="mt-6 flex justify-center gap-2">
            {!ws.session.signedIn && ws.session.configured && <Btn onClick={ws.signIn} data-testid="button-admin-sign-in">Sign in</Btn>}
            <Link href="/" className="inline-flex h-10 items-center rounded-full border border-line bg-white/70 px-4 text-sm font-semibold" data-testid="link-admin-home">Back home</Link>
          </div>
        </CenterCard>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="rise pt-8 sm:pt-12">
        {isDemo && <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-ink/30 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-ink-2"><FlaskConical className="h-3 w-3" />Sample accounts only · changes stay in this browser</span>}
        <h1 className="font-display mt-3 text-4xl font-extrabold sm:text-5xl">Account requests</h1>
        <p className="mt-2 text-ink-2">Approve to unlock a studio. Reject or revoke to lock it and hide its pages.</p>
      </div>

      <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="no-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-full bg-ink/5 p-1">
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
            <button key={s} onClick={() => setFilter(s)} data-testid={`filter-status-${s.toLowerCase()}`}
              className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold capitalize transition", filter === s ? "bg-ink text-paper" : "text-ink-2 hover:bg-white/70")}>
              {s === "PENDING" && <span className="h-1.5 w-1.5 rounded-full bg-stop" />}{s === "APPROVED" && <span className="h-1.5 w-1.5 rounded-full bg-go" />}{s === "REJECTED" && <span className="h-1.5 w-1.5 rounded-full bg-muted" />}
              {s.toLowerCase()}<span className="font-mono text-[10.5px] opacity-60">{counts[s]}</span>
            </button>
          ))}
        </div>
        <div className="relative md:ml-auto md:w-80">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search email, store, handle, phone" className="rounded-full pl-10" data-testid="input-admin-search" />
        </div>
      </div>

      {ws.error && !ws.accounts.length ? (
        <div className="mt-6 rounded-[28px] border border-stop/20 bg-stop/5 p-8 text-center">
          <p className="text-sm text-stop">{ws.error}</p>
          <Btn className="mt-4" size="sm" onClick={() => void ws.refresh()} data-testid="button-admin-retry"><RefreshCw className="h-3.5 w-3.5" />Retry</Btn>
        </div>
      ) : ws.loading && !ws.accounts.length ? (
        <div className="mt-6 space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
      ) : rows.length === 0 ? (
        <div className="mt-6 rounded-[28px] border border-dashed border-ink/20 bg-white/40 p-12 text-center">
          <Inbox className="mx-auto h-7 w-7 text-muted" />
          <p className="mt-3 font-semibold">{ws.accounts.length ? "No accounts match." : "No requests yet."}</p>
          <p className="text-[13px] text-muted">{ws.accounts.length ? "Try another filter or search." : "New activation requests will land here."}</p>
        </div>
      ) : (
        <>
          <div className="glass mt-6 hidden overflow-hidden rounded-[28px] lg:block">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-line text-[10.5px] uppercase tracking-[0.12em] text-muted">
                  {["Email", "Store", "Category", "Handle", "Phone", "Pages", "Status", ""].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id} className="border-b border-line/60 transition last:border-0 hover:bg-white/50" data-testid={`row-account-${a.id}`}>
                    <td className="max-w-[200px] truncate px-4 py-3 font-mono text-[12px]">{a.email}</td>
                    <td className="px-4 py-3 font-semibold">{a.businessName}</td>
                    <td className="px-4 py-3 text-ink-2">{a.category}</td>
                    <td className="px-4 py-3 font-mono text-[12px] text-teal">/{a.requestedSlug}</td>
                    <td className="px-4 py-3 font-mono text-[12px]">{a.phone}</td>
                    <td className="px-4 py-3 font-mono text-[12px]">{a.pageCount}/{MAX_PAGES}</td>
                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-4 py-3"><Actions a={a} busy={busy[a.id] ?? null} onSet={(s) => setStatus(a, s)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 space-y-4 lg:hidden">
            {rows.map((a) => (
              <div key={a.id} className="glass rounded-[24px] p-5" data-testid={`card-account-${a.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><div className="font-display truncate text-lg font-bold">{a.businessName}</div><div className="truncate font-mono text-[11.5px] text-muted">{a.email}</div></div>
                  <StatusBadge status={a.status} />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-[12px]">
                  <div><dt className="text-muted">Category</dt><dd className="font-semibold">{a.category}</dd></div>
                  <div><dt className="text-muted">Handle</dt><dd className="font-mono text-teal">/{a.requestedSlug}</dd></div>
                  <div><dt className="text-muted">Phone</dt><dd className="font-mono">{a.phone}</dd></div>
                  <div><dt className="text-muted">Pages</dt><dd className="font-mono">{a.pageCount}/{MAX_PAGES}</dd></div>
                </dl>
                <div className="mt-3"><Actions a={a} busy={busy[a.id] ?? null} onSet={(s) => setStatus(a, s)} /></div>
              </div>
            ))}
          </div>
        </>
      )}
    </AppShell>
  );
}
