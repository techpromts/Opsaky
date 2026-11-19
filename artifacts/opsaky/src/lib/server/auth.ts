import "server-only";
import { currentUser } from "@clerk/nextjs/server";
import { database } from "./db";
import { defaultConfig } from "../model";
import { Prisma } from "@prisma/client";

export const authConfigured = () => Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
export const appConfigured = () => authConfigured() && Boolean(process.env.DATABASE_URL);
export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export async function identity() {
  if (!authConfigured()) return null;
  const user = await currentUser();
  if (!user) return null;
  const primary = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId);
  if (!primary || primary.verification?.status !== "verified") throw new HttpError(403, "A verified primary email is required.");
  const email = primary.emailAddress.toLowerCase();
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return { clerkId: user.id, email, isAdmin: Boolean(adminEmail && email === adminEmail) };
}
export async function requireIdentity() {
  if (!appConfigured()) throw new HttpError(503, "Connect your external Clerk application and PostgreSQL database to use live accounts. The demo remains available.");
  const user = await identity();
  if (!user) throw new HttpError(401, "Please sign in to continue.");
  return user;
}
export async function ensureAdmin(user: NonNullable<Awaited<ReturnType<typeof identity>>>) {
  const db = database();
  let account = await db.account.findUnique({ where: { clerkId: user.clerkId }, include: { _count: { select: { pages: true } } } });
  if (!account && user.isAdmin) {
    const slug = `studio-${user.clerkId.toLowerCase().replace(/[^a-z0-9]/g, "").slice(-16)}`;
    try {
      account = await db.account.create({
        data: { clerkId: user.clerkId, email: user.email, businessName: "My studio", category: "Other", phone: "", requestedSlug: slug, status: "APPROVED",
          pages: { create: { title: "My studio", slug, config: defaultConfig() as unknown as Prisma.InputJsonValue } } },
        include: { _count: { select: { pages: true } } },
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
      account = await db.account.findUnique({ where: { clerkId: user.clerkId }, include: { _count: { select: { pages: true } } } });
    }
  }
  return account;
}
export async function requireApproved() {
  const user = await requireIdentity();
  const account = await ensureAdmin(user);
  if (!account || (account.status !== "APPROVED" && !user.isAdmin)) throw new HttpError(403, "Your account must be approved before using the builder.");
  return { user, account };
}
export async function requireAdmin() {
  const user = await requireIdentity();
  if (!user.isAdmin) throw new HttpError(403, "Only the Opsaky administrator can access this area.");
  return user;
}
