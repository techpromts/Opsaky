# Opsaky

**Your business. One beautiful link.**

Opsaky is an English, left-to-right bio-link and digital showcase builder for restaurants, boutiques, beauty businesses, electronics shops, home businesses, and creators.

## Stack

- **Next.js 16 App Router**, React, TypeScript, Tailwind CSS
- **External Clerk** authentication, using `@clerk/nextjs`
- **PostgreSQL + Prisma ORM**, using your own `DATABASE_URL`
- Client-side compressed, database-backed WebP images
- No billing, payment processing, Replit Auth, Replit database provisioning, or external image buckets

The application lives in **`artifacts/opsaky`**. The surrounding pnpm workspace contains the generated API client and development scaffolding. Opsaky's live API is implemented entirely in Next.js route handlers, not the Express scaffold.

## Start locally

Requirements: Node.js 22+ and pnpm 10.

```bash
pnpm install
cp artifacts/opsaky/.env.example artifacts/opsaky/.env.local
```

Add your four environment variables to `artifacts/opsaky/.env.local`:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Your external Clerk application's publishable key |
| `CLERK_SECRET_KEY` | The matching Clerk secret key; server-side only |
| `DATABASE_URL` | Your external PostgreSQL connection string, with SSL where required by your provider |
| `ADMIN_EMAIL` | The administrator's verified primary Clerk email address |

Never commit real credentials. `.env.example` intentionally contains blank placeholders.

### Set up your external Clerk application

1. Create or use a Clerk application you own.
2. Enable **Google** under its social authentication connections.
3. Set the sign-in path to `/sign-in`, sign-up path to `/sign-up`, and the successful sign-in/sign-up destination to `/dashboard`.
4. For a Google-only experience, disable other sign-in methods in your Clerk application's configuration.
5. Configure your production domain, production Clerk keys, and Google's OAuth production settings in Clerk when going live. Development keys and users are separate from production.
6. Set `ADMIN_EMAIL` to the verified **primary** email you will use to sign in. Email comparison is case-insensitive; client-provided email and role values are never trusted.

The first sign-in by that administrator creates their approved personal workspace. The administrator can use both `/dashboard` and `/admin`. Other users must request activation and wait for approval.

### Initialize PostgreSQL

Prisma reads `.env` automatically, but does not automatically read Next.js's `.env.local` for CLI commands. Export `DATABASE_URL` in your shell using your local environment manager, or temporarily put it in `artifacts/opsaky/.env` (also ignored by Git).

```bash
cd artifacts/opsaky
npx prisma generate
npx prisma db push
cd ../..
pnpm --filter @workspace/opsaky dev
```

The Replit preview starts through its configured Opsaky workflow instead.

`prisma db push` is appropriate for first-time schema initialization. Review schema changes before applying them to a database containing live data; use reviewed Prisma migrations as your production database evolves. No schema is changed automatically on server startup.

## Deploy on Vercel

1. Push this repository to GitHub and import it into Vercel.
2. Set **Root Directory** to **`artifacts/opsaky`** and Framework Preset to **Next.js**.
3. Enable inclusion of source files outside the root directory, so the shared workspace API client is available.
4. Use the repository's pnpm lockfile. Install command: `pnpm install`. Build command: `pnpm run build`. Do not set a static output directory.
5. Add all four environment variables from the table above in Vercel's project settings. Use your **production** Clerk keys for the production deployment.
6. Initialize the external PostgreSQL schema once with `npx prisma db push`, as described above, against the correct target database.
7. Deploy. Sign in with the configured admin email, then open `/admin` to approve activation requests.

For serverless PostgreSQL hosting, use your provider's recommended pooled Prisma-compatible connection URL. Follow the provider's guidance for connection limits and schema administration. A database URL is never generated or provisioned by this application.

## Product routes

| Route | Purpose |
| --- | --- |
| `/` | Opsaky sign-in landing; signed-in users redirect to their dashboard |
| `/sign-in`, `/sign-up` | External Clerk authentication |
| `/dashboard` | Activation request, pending/rejected state, or approved page dashboard |
| `/dashboard/edit/[pageId]` | Four-tab live customization studio |
| `/admin` | Server-protected, administrator-only account management |
| `/[slug]` | Public showcase; only approved owners' published pages are visible |
| `/demo` | Clearly labeled, browser-local sample workspace |
| `/demo/edit/[pageId]` | Demo customization studio |
| `/demo/preview/[slug]` | Browser-local demo preview, not a public published page |
| `/demo/admin` | Sample approval controls; never affects real accounts |

## Important behavior

- Activation requests reserve the requested handle and create a first **draft** page in one transaction.
- All accounts start `PENDING`, except the configured administrator's initial workspace.
- `PENDING` and `REJECTED` accounts cannot use the live builder. Revocation also hides their public pages immediately.
- An approved account can own at most **10 pages**. This is enforced on the server in a serializable database transaction, as well as in the interface.
- Each page supports up to **4 showcase images** and **7 links**, validated server-side.
- Images are compressed in the browser to at most **800 px wide**, encoded as WebP, and stored in the page's PostgreSQL JSON content. Individual images are capped at approximately 225 KB and requests at 3.7 MB to stay below serverless request-body limits.
- No SVG uploads or arbitrary image URLs are accepted by the live storage API.
- URL schemes are restricted to `http`, `https`, `mailto`, and `tel`; JavaScript URLs are never rendered.
- Public pages are always checked against the owner's current approval status, not a cached approval result.
- Account state refreshes while a signed-in dashboard remains open, so approvals and revocations reach other sessions.
- All share URLs, displayed handle previews, copied links, and QR codes use **`window.location.origin`**. Social-preview URLs and canonical tags use the current request's forwarded host and protocol. Optional `NEXT_PUBLIC_APP_URL` (for example, your Vercel or custom-domain origin) is a fallback only when the current origin cannot be determined. No production domain is hardcoded. Keep this optional value consistent with your deployment; changing it requires a rebuild because Next.js inlines public environment variables.
- Demo data is saved only in the current browser's local storage. It is not authentication, a live account, a production database, or public publication. Clearing site storage resets it.
- Sample product photos are AI-generated example assets, not real merchants or real performance data.
- Without external service credentials, live account and public-page operations explicitly report that setup is needed. The demo remains usable.

## Development

```bash
# Generate the Prisma client
pnpm --filter @workspace/opsaky exec prisma generate

# Regenerate shared API clients after changing the OpenAPI specification
pnpm --filter @workspace/api-spec run codegen

# Typecheck Opsaky
pnpm --filter @workspace/opsaky run typecheck

# Production build
pnpm --filter @workspace/opsaky run build
```

### Key folders

- `artifacts/opsaky/src/app` — Next.js routes and layouts
- `artifacts/opsaky/src/components/opsaky` — dashboard, studio, and public storefront
- `artifacts/opsaky/src/lib/server` — authorization, Prisma singleton, request validation
- `artifacts/opsaky/src/lib/workspace.tsx` — live API adapter and explicitly separate demo persistence
- `artifacts/opsaky/prisma/schema.prisma` — PostgreSQL schema
- `lib/api-spec/openapi.yaml` — source API contract

No live Google OAuth flow or external database connection can be exercised until the four environment variables are configured.
