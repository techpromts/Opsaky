import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { database } from "@/lib/server/db";
import { appConfigured, authConfigured, identity, ensureAdmin, requireIdentity, requireApproved, requireAdmin, HttpError } from "@/lib/server/auth";
import { activationSchema, pageSchema, statusSchema } from "@/lib/server/validation";
import { defaultConfig, validSlug } from "@/lib/model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path?: string[] }> };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
const accountView = (a: { _count?: { pages: number }; [key: string]: unknown }) => {
  const { clerkId: _, _count, ...rest } = a;
  return { ...rest, pageCount: _count?.pages ?? 0 };
};
async function body(req: NextRequest) {
  const content = await req.text();
  if (Buffer.byteLength(content, "utf8") > 3_700_000) throw new HttpError(413, "Images are too large. Use smaller compressed images.");
  try { return JSON.parse(content); } catch { throw new HttpError(400, "Invalid JSON request."); }
}
async function handle(req: NextRequest, { params }: Context) {
  try {
    const path = (await params).path ?? [];
    const [resource, id, extra] = path;
    if (path.length > 3) throw new HttpError(404, "Not found.");
    if (req.method !== "GET") {
      const origin = req.headers.get("origin");
      const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
      if (origin && new URL(origin).host !== host) throw new HttpError(403, "Cross-origin writes are not allowed.");
      const length = Number(req.headers.get("content-length") ?? 0);
      if (length > 3_700_000) throw new HttpError(413, "Upload size limit exceeded.");
    }
    if (resource === "session" && req.method === "GET") {
      if (!authConfigured()) return json({ configured: false, signedIn: false, isAdmin: false, email: "", account: null });
      const user = await identity();
      const account = user && appConfigured() ? await ensureAdmin(user) : null;
      return json({ configured: appConfigured(), signedIn: Boolean(user), isAdmin: user?.isAdmin ?? false, email: user?.email ?? "", account: account ? accountView(account) : null });
    }
    if (resource === "public" && id && req.method === "GET") {
      if (!appConfigured()) throw new HttpError(503, "Live pages are not configured yet.");
      const page = await database().page.findUnique({ where: { slug: id }, include: { owner: { select: { status: true } } } });
      if (!page || !page.published || page.owner.status !== "APPROVED") throw new HttpError(404, "Page Not Active Yet");
      const { owner: _, ownerId: __, ...publicPage } = page;
      return json(publicPage);
    }
    if (resource === "handles" && id && req.method === "GET") {
      await requireIdentity();
      if (!validSlug(id)) return json({ available: false });
      const db = database();
      const [page, account] = await Promise.all([db.page.findUnique({ where: { slug: id }, select: { id: true } }), db.account.findUnique({ where: { requestedSlug: id }, select: { id: true } })]);
      return json({ available: !page && !account });
    }
    if (resource === "activation" && req.method === "POST") {
      const user = await requireIdentity();
      const input = activationSchema.parse(await body(req));
      const account = await database().$transaction(async tx => {
        if (await tx.account.findUnique({ where: { clerkId: user.clerkId } })) throw new HttpError(409, "An activation request already exists.");
        const existingPage = await tx.page.findUnique({ where: { slug: input.requestedSlug } });
        if (existingPage) throw new HttpError(409, "This handle is already taken.");
        return tx.account.create({
          data: { ...input, email: user.email, clerkId: user.clerkId, status: "PENDING",
            pages: { create: { title: input.businessName, slug: input.requestedSlug,
              config: { ...defaultConfig(), category: input.category, phone: input.phone } as unknown as Prisma.InputJsonValue } } },
          include: { _count: { select: { pages: true } } },
        });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      return json(accountView(account));
    }
    if (resource === "admin" && id === "accounts") {
      const admin = await requireAdmin();
      const db = database();
      if (req.method === "GET" && !extra) {
        const accounts = await db.account.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { pages: true } } } });
        return json(accounts.map(accountView));
      }
      if (req.method === "PATCH" && extra) {
        const input = statusSchema.parse(await body(req));
        const target = await db.account.findUnique({ where: { id: extra } });
        if (!target) throw new HttpError(404, "Account not found.");
        if (target.clerkId === admin.clerkId && input.status !== "APPROVED") throw new HttpError(400, "The administrator must keep access to their workspace.");
        const account = await db.account.update({ where: { id: extra }, data: { status: input.status }, include: { _count: { select: { pages: true } } } });
        return json(accountView(account));
      }
    }
    if (resource === "pages") {
      const { account } = await requireApproved();
      const db = database();
      if (req.method === "GET" && !id) return json(await db.page.findMany({ where: { ownerId: account.id }, orderBy: { updatedAt: "desc" } }));
      if (req.method === "POST" && !id) {
        const input = pageSchema.parse(await body(req));
        const page = await db.$transaction(async tx => {
          if (await tx.page.count({ where: { ownerId: account.id } }) >= 10) throw new HttpError(409, "10 / 10 Pages Used. Delete a page before creating another.");
          const reservation = await tx.account.findUnique({ where: { requestedSlug: input.slug } });
          if (reservation && reservation.id !== account.id) throw new HttpError(409, "This handle is reserved.");
          return tx.page.create({ data: { ...input, config: input.config as unknown as Prisma.InputJsonValue, ownerId: account.id } });
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        return json(page, 201);
      }
      if (id && ["PUT", "DELETE"].includes(req.method)) {
        const owned = await db.page.findFirst({ where: { id, ownerId: account.id } });
        if (!owned) throw new HttpError(404, "Page not found.");
        if (req.method === "DELETE") {
          await db.page.delete({ where: { id } });
          return new NextResponse(null, { status: 204 });
        }
        const input = pageSchema.parse(await body(req));
        const reservation = await db.account.findUnique({ where: { requestedSlug: input.slug } });
        if (reservation && reservation.id !== account.id) throw new HttpError(409, "This handle is reserved.");
        return json(await db.page.update({ where: { id }, data: { ...input, config: input.config as unknown as Prisma.InputJsonValue } }));
      }
    }
    throw new HttpError(404, "Not found.");
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.message }, error.status);
    if (error instanceof z.ZodError) return json({ error: error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ") }, 400);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") return json({ error: "That handle or account is already registered." }, 409);
      if (error.code === "P2034") return json({ error: "Another change happened at the same time. Please try again." }, 409);
    }
    // Do not leak connection strings, credentials, or raw database errors.
    return json({ error: "The service is unavailable. Check your external Clerk configuration and database schema." }, 503);
  }
}
export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
