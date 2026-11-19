---
name: Deployment schema tradeoff
description: Why deployment-time schema synchronization may accept data-loss warnings.
---

The user deliberately chose automatic schema synchronization during Vercel builds, including accepting Prisma data-loss warnings.

**Why:** After being warned that this may delete production data and that database changes persist even if the application build fails, the user explicitly approved the requested approach.

**How to apply:** Treat this as an intentional deployment tradeoff, not an accidental flag. This approval does not authorize unrelated destructive database operations.
