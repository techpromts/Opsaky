---
name: Clean deployment checks
description: Prevent local generated TypeScript output from masking failures in fresh Vercel builds.
---

Verify Vercel fixes using the isolated Next.js application's production build after cleaning generated shared-package declarations, not only after a root workspace typecheck or code generation.

**Why:** Earlier local verification had prebuilt dependency declarations that were absent in Vercel's fresh checkout. A passing warm build therefore masked a real TypeScript project-reference failure.

**How to apply:** Preserve the distinction between a source-consuming Next.js build and declaration-producing library builds. Reproduce deployment failures without warmed library outputs before declaring them fixed; do not commit generated declarations to hide the dependency.
