"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  getOpsakySession, listPages, listAccounts, createPage as apiCreatePage,
  savePage as apiSavePage, deletePage as apiDeletePage, checkHandle as apiCheckHandle,
  requestActivation as apiRequestActivation, updateAccountStatus, getPublicPage as apiGetPublicPage,
} from "@workspace/api-client-react";
import { type Account, type AccountStatus, type ActivationInput, type StorePage, type PageConfig, newPage, validSlug, THEMES } from "./model";
import { demoAccount, demoAccounts, demoPages } from "./demo";

interface Session { configured: boolean; signedIn: boolean; isAdmin: boolean; email: string; account: Account | null }
interface Workspace {
  isDemo: boolean; ready: boolean; loading: boolean; error: string | null; session: Session;
  pages: StorePage[]; accounts: Account[];
  refresh: () => Promise<void>;
  createPage: (title: string, slug: string, template?: string) => Promise<StorePage>;
  savePage: (page: StorePage) => Promise<StorePage>;
  deletePage: (id: string) => Promise<void>;
  requestActivation: (input: ActivationInput) => Promise<void>;
  checkHandle: (slug: string) => Promise<boolean>;
  updateStatus: (id: string, status: AccountStatus) => Promise<void>;
  getPublicPage: (slug: string) => Promise<StorePage | null>;
  signIn: () => void; signOut: () => void;
}
const Context = createContext<Workspace | null>(null);
const emptySession: Session = { configured: false, signedIn: false, isAdmin: false, email: "", account: null };
const STORAGE = "opsaky-demo-workspace-v1";
function saveLocal(pages: StorePage[], accounts: Account[]) {
  try { localStorage.setItem(STORAGE, JSON.stringify({ pages, accounts })); }
  catch { throw new Error("Your browser’s demo storage is full or unavailable. Try smaller images or remove a demo page."); }
}
const toPage = (page: { config: unknown }) => page as unknown as StorePage;
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const path = usePathname() || "/";
  const isDemo = path === "/demo" || path.startsWith("/demo/");
  const [pages, setPages] = useState<StorePage[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [session, setSession] = useState<Session>(emptySession);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (isDemo) return;
    try {
      const s = await getOpsakySession();
      setSession(s as Session);
      const approved = s.account?.status === "APPROVED" || s.isAdmin;
      const [owned, all] = await Promise.all([
        s.signedIn && approved ? listPages() : Promise.resolve([]),
        s.signedIn && s.isAdmin ? listAccounts() : Promise.resolve([]),
      ]);
      setPages(owned.map(p => toPage(p)));
      setAccounts(all as Account[]);
      setError(null);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load your workspace."); }
    finally { setReady(true); setLoading(false); }
  }, [isDemo]);

  useEffect(() => {
    setReady(false); setLoading(true); setPages([]); setAccounts([]); setError(null); setSession(emptySession);
    if (!isDemo) { void refresh(); return; }
    try {
      const stored = localStorage.getItem(STORAGE);
      const data = stored ? JSON.parse(stored) as { pages: StorePage[]; accounts: Account[] } : null;
      if (data && (!Array.isArray(data.pages) || !Array.isArray(data.accounts))) throw new Error("Saved demo data is not valid. Clear this site’s browser storage to reset the demo.");
      const p = data?.pages ?? demoPages();
      const a = data?.accounts ?? demoAccounts;
      setPages(p); setAccounts(a);
      setSession({ configured: false, signedIn: true, isAdmin: true, email: demoAccount.email, account: { ...demoAccount, pageCount: p.length } });
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load browser-local demo data."); }
    setReady(true); setLoading(false);
  }, [isDemo, refresh]);
  useEffect(() => {
    if (isDemo || !session.signedIn) return;
    const timer = window.setInterval(() => { void refresh(); }, 15000);
    const focus = () => { void refresh(); };
    window.addEventListener("focus", focus);
    return () => { clearInterval(timer); window.removeEventListener("focus", focus); };
  }, [isDemo, session.signedIn, refresh]);

  const createPage = useCallback(async (title: string, slug: string, template?: string) => {
    if (!validSlug(slug)) throw new Error("Use a unique handle with 3–48 lowercase letters, numbers, or hyphens.");
    if (pages.length >= 10) throw new Error("10 / 10 Pages Used. Delete a page before creating another.");
    const page = newPage(title.trim(), slug);
    if (!page.title) throw new Error("Please give your page a name.");
    const theme = THEMES.find(t => t.id === template);
    if (theme) page.config = { ...page.config, ...theme, theme: theme.id } as PageConfig;
    if (isDemo) {
      if (pages.some(p => p.slug === slug)) throw new Error("That handle is already taken in this demo.");
      const next = [page, ...pages];
      saveLocal(next, accounts); setPages(next);
      return page;
    }
    const saved = toPage(await apiCreatePage({ title: page.title, slug: page.slug, config: { ...page.config }, published: false }));
    await refresh();
    return saved;
  }, [isDemo, pages, accounts, refresh]);
  const savePage = useCallback(async (page: StorePage) => {
    if (!validSlug(page.slug)) throw new Error("Choose a valid handle with 3–48 lowercase letters, numbers, or hyphens.");
    if (!page.title.trim()) throw new Error("Your page needs a title.");
    if (page.config.gallery.length > 4 || page.config.links.length > 7) throw new Error("Each page supports up to 4 photos and 7 links.");
    if (isDemo) {
      if (!pages.some(p => p.id === page.id)) throw new Error("This page no longer exists.");
      if (pages.some(p => p.slug === page.slug && p.id !== page.id)) throw new Error("That handle is already taken.");
      const saved = { ...page, updatedAt: new Date().toISOString() };
      const next = pages.map(p => p.id === saved.id ? saved : p);
      saveLocal(next, accounts); setPages(next);
      return saved;
    }
    const saved = toPage(await apiSavePage(page.id, { title: page.title, slug: page.slug, config: { ...page.config }, published: page.published }));
    setPages(previous => previous.map(p => p.id === saved.id ? saved : p));
    return saved;
  }, [isDemo, pages, accounts]);
  const deletePage = useCallback(async (id: string) => {
    if (isDemo) {
      const next = pages.filter(p => p.id !== id);
      saveLocal(next, accounts); setPages(next);
    } else { await apiDeletePage(id); await refresh(); }
  }, [isDemo, pages, accounts, refresh]);
  const checkHandle = useCallback(async (slug: string) => {
    if (!validSlug(slug)) return false;
    return isDemo ? !pages.some(p => p.slug === slug) : (await apiCheckHandle(slug)).available;
  }, [isDemo, pages]);
  const requestActivation = useCallback(async (input: ActivationInput) => {
    if (isDemo) throw new Error("Activation requests require a live signed-in account. Demo accounts are browser-local examples.");
    await apiRequestActivation(input); await refresh();
  }, [isDemo, refresh]);
  const updateStatus = useCallback(async (id: string, status: AccountStatus) => {
    if (isDemo) {
      if (id === demoAccount.id && status !== "APPROVED") throw new Error("The demo owner stays active so you can explore the studio.");
      const next = accounts.map(a => a.id === id ? { ...a, status } : a);
      saveLocal(pages, next); setAccounts(next);
    } else { await updateAccountStatus(id, { status }); await refresh(); }
  }, [isDemo, pages, accounts, refresh]);
  const getPublicPage = useCallback(async (slug: string) => {
    if (isDemo) return pages.find(p => p.slug === slug) ?? null;
    try { return toPage(await apiGetPublicPage(slug)); }
    catch (e) { if ((e as { status?: number }).status === 404) return null; throw e; }
  }, [isDemo, pages]);
  const signIn = useCallback(() => { window.location.assign("/sign-in"); }, []);
  const signOut = useCallback(() => {
    if (isDemo) { window.location.assign("/"); return; }
    setPages([]); setAccounts([]); setSession(emptySession);
    const clerk = (window as unknown as { Clerk?: { signOut: (options: { redirectUrl: string }) => Promise<void> } }).Clerk;
    if (clerk) void clerk.signOut({ redirectUrl: "/" });
    else window.location.assign("/");
  }, [isDemo]);
  const value = useMemo(() => ({
    isDemo, ready, loading, error, session: isDemo && session.account ? { ...session, account: { ...session.account, pageCount: pages.length } } : session,
    pages, accounts, refresh, createPage, savePage, deletePage, checkHandle, requestActivation, updateStatus, getPublicPage, signIn, signOut,
  }), [isDemo, ready, loading, error, session, pages, accounts, refresh, createPage, savePage, deletePage, checkHandle, requestActivation, updateStatus, getPublicPage, signIn, signOut]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useWorkspace() {
  const context = useContext(Context);
  if (!context) throw new Error("WorkspaceProvider is required.");
  return context;
}
