---
name: Page visibility policy
description: The intended relationship between workspace approval, saving, and public visibility.
---

Any approved workspace's saved page must be immediately live at its slug. Saving does not require a separate publish or ready switch.

**Why:** The user explicitly requested this behavior after approving a workspace still left its saved page inactive.

**How to apply:** Do not reintroduce a second page-level activation gate. Existing saved pages must become visible on approval without requiring another save; pending and rejected workspaces must remain private.
