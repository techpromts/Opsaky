import assert from "node:assert/strict";
import test from "node:test";
import { defaultBusinessHours } from "./model.ts";
import { getBusinessStatus } from "./business-hours.ts";

test("calculates open and closed state in the business time zone", () => {
  const hours = defaultBusinessHours();
  const open = getBusinessStatus(hours, "Asia/Amman", new Date("2026-01-04T07:00:00.000Z"));
  const closed = getBusinessStatus(hours, "Asia/Amman", new Date("2026-01-04T15:00:00.000Z"));
  assert.deepEqual(open, { isOpen: true, hoursText: "09:00–17:00", valid: true });
  assert.deepEqual(closed, { isOpen: false, hoursText: "09:00–17:00", valid: true });
});

test("accounts for an overnight opening from the previous day", () => {
  const hours = defaultBusinessHours();
  hours.sat = { open: "20:00", close: "02:00", closed: false };
  const status = getBusinessStatus(hours, "Asia/Amman", new Date("2026-01-03T22:00:00.000Z"));
  assert.deepEqual(status, { isOpen: true, hoursText: "Open until 02:00", valid: true });
});

test("reports invalid time zones instead of silently using a different zone", () => {
  const status = getBusinessStatus(defaultBusinessHours(), "Not/A_Zone", new Date());
  assert.deepEqual(status, { isOpen: false, hoursText: "Hours unavailable", valid: false });
});
