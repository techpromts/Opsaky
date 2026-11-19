/** Saved pages are live whenever their workspace is approved.
 * The legacy page-level `published` flag is not a second activation gate.
 */
export function isSavedPagePublic(page: { owner: { status: string } } | null): boolean {
  return page?.owner.status === "APPROVED";
}
