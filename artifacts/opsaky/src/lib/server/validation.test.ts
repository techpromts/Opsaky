import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultConfig } from "../model.ts";
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

test("fills category defaults for pages saved before custom categories existed", () => {
  const oldConfig = { ...defaultConfig(), customCategories: undefined };
  const result = configSchema.parse({
    ...oldConfig,
    gallery: [{ id: "legacy", image: "", title: "Legacy item", price: "" }],
  });
  assert.deepEqual(result.customCategories, []);
  assert.equal(result.gallery[0].category, "");
});
