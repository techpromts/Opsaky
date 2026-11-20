import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_GALLERY_ITEMS, defaultConfig } from "../model.ts";
import { configSchema } from "./validation.ts";

const prefix = "data:image/webp;base64,";
const dataUrlOfLength = (length: number) => prefix + "A".repeat(length - prefix.length);

test("accepts page images below the 250 KB data URL limit", () => {
  const result = configSchema.safeParse({
    ...defaultConfig(),
    logo: dataUrlOfLength(249_999),
    gallery: [{ id: "product", image: dataUrlOfLength(249_999), title: "Product", price: "" }],
  });
  assert.equal(result.success, true);
});

test("rejects image data URLs at or above 250 KB", () => {
  const result = configSchema.safeParse({
    ...defaultConfig(),
    logo: dataUrlOfLength(250_000),
  });
  assert.equal(result.success, false);
});

test("rejects SVG and other non-raster image URLs", () => {
  const result = configSchema.safeParse({
    ...defaultConfig(),
    logo: "data:image/svg+xml;base64,PHN2Zz4=",
  });
  assert.equal(result.success, false);
});

test("accepts 12 gallery items and rejects a thirteenth", () => {
  const items = Array.from({ length: MAX_GALLERY_ITEMS }, (_, index) => ({
    id: `product-${index}`, image: "", title: `Product ${index + 1}`, price: "",
  }));
  assert.equal(configSchema.safeParse({ ...defaultConfig(), gallery: items }).success, true);
  assert.equal(configSchema.safeParse({ ...defaultConfig(), gallery: [...items, { id: "extra", image: "", title: "", price: "" }] }).success, false);
});

test("rejects enabled schedules with invalid time zones or time values", () => {
  const config = defaultConfig();
  assert.equal(configSchema.safeParse({ ...config, businessHoursEnabled: true, businessHoursTimezone: "Not/A_Zone" }).success, false);
  assert.equal(configSchema.safeParse({
    ...config,
    businessHoursEnabled: true,
    businessHours: { ...config.businessHours, sun: { ...config.businessHours.sun, open: "25:00" } },
  }).success, false);
});

test("accepts custom page and product categories", () => {
  const result = configSchema.safeParse({
    ...defaultConfig(),
    category: "Coffee & Pastry",
    customCategories: ["Coffee & Pastry", "Seasonal"],
    gallery: [{ id: "product", image: "", title: "Latte", price: "", category: "Seasonal" }],
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.category, "Coffee & Pastry");
    assert.deepEqual(result.data.customCategories, ["Coffee & Pastry", "Seasonal"]);
    assert.equal(result.data.gallery[0].category, "Seasonal");
  }
});

test("fills category and business-hours defaults for older page configs", () => {
  const oldConfig = {
    ...defaultConfig(),
    customCategories: undefined,
    businessHoursEnabled: undefined,
    businessHoursTimezone: undefined,
    businessHours: undefined,
  };
  const result = configSchema.parse({
    ...oldConfig,
    gallery: [{ id: "legacy", image: "", title: "Legacy item", price: "" }],
  });
  assert.deepEqual(result.customCategories, []);
  assert.equal(result.gallery[0].category, "");
  assert.equal(result.businessHoursEnabled, false);
  assert.equal(result.businessHoursTimezone, "Asia/Amman");
  assert.equal(result.businessHours.sun.closed, false);
});
