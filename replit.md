# Opsaky

A universal bio-link, digital showcase, and mini-storefront page builder for independent businesses and creators.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/opsaky run dev` — Next.js application
- `pnpm --filter @workspace/opsaky exec prisma generate` — generate the Prisma client
- Required live env: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL`, `ADMIN_EMAIL`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Application: Next.js App Router, React, TypeScript, Tailwind CSS
- Opsaky API: Next.js route handlers under `/api/opsaky`
- DB: external PostgreSQL + Prisma ORM
- Authentication: external Clerk (`@clerk/nextjs`), verified primary email admin check
- Validation: Zod
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/opsaky` — self-contained Next.js application, Prisma schema, `.env.example`
- `lib/api-spec/openapi.yaml` — API contract; regenerate after changes
- `README.md` — external Clerk/PostgreSQL and Vercel setup instructions

## Architecture decisions

- The user explicitly requires a portable Next.js/Vercel architecture, not Replit-specific auth, database provisioning, or image storage.
- The user explicitly requires client-compressed Base64 images stored in PostgreSQL, not buckets.
- External credentials are intentionally left as placeholders. Never silently substitute managed Replit services.
- `/demo` is browser-local and visibly separate from live accounts; never allow demo state to bypass server authorization.

## Product

Manual approval gates, 10-page accounts, a four-tab customization studio with live preview, theme presets, image galleries, smart links, contact actions, QR codes, and public showcase pages.

## User preferences

English only, left-to-right. No payments, billing logic, or checkout. Admin activation only.

## Gotchas

- Run Prisma generation before a first typecheck/build. Do not run schema pushes against an unconfirmed external database.
- The Express scaffold only owns `/api/healthz`; Next.js must own `/api/opsaky`.
- The live Google sign-in and PostgreSQL paths require the user's own configured external services.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
