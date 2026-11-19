import assert from "node:assert/strict";
import { test } from "node:test";
import { isSavedPagePublic } from "./publication.ts";

for (const published of [false, true]) {
  test(`approved saved page is live with legacy published=${published}`, () => {
    const page = { owner: { status: "APPROVED" }, published };
    assert.equal(isSavedPagePublic(page), true);
  });
  for (const status of ["PENDING", "REJECTED"]) {
    test(`${status} workspace stays private with published=${published}`, () => {
      const page = { owner: { status }, published };
      assert.equal(isSavedPagePublic(page), false);
    });
  }
}

test("missing pages are not public", () => {
  assert.equal(isSavedPagePublic(null), false);
});

test("approval and revocation take effect without changing the saved page", () => {
  const page = { owner: { status: "PENDING" }, published: false };
  assert.equal(isSavedPagePublic(page), false);
  page.owner.status = "APPROVED";
  assert.equal(isSavedPagePublic(page), true);
  page.owner.status = "REJECTED";
  assert.equal(isSavedPagePublic(page), false);
});
