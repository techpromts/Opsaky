import assert from "node:assert/strict";
import { test } from "node:test";
import { compressImage, isSupportedImageType, MAX_IMAGE_DATA_URL_LENGTH } from "./images.ts";

type MockCanvas = { width: number; height: number; toDataURL: (type: string, quality?: number) => string };

async function withCanvas(
  encode: (canvas: MockCanvas, type: string, quality?: number) => string,
  run: (dimensions: { width: number; height: number; qualities: number[] }) => Promise<void>,
) {
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  const previousBitmap = Object.getOwnPropertyDescriptor(globalThis, "createImageBitmap");
  const dimensions = { width: 0, height: 0, qualities: [] as number[] };
  const context = {
    fillStyle: "#000",
    clearRect() {},
    fillRect() {},
    drawImage() {},
  };
  const canvas: MockCanvas = {
    width: 0,
    height: 0,
    toDataURL(type, quality) {
      dimensions.width = canvas.width;
      dimensions.height = canvas.height;
      if (quality !== undefined) dimensions.qualities.push(quality);
      return encode(canvas, type, quality);
    },
  };
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: { createElement: () => Object.assign(canvas, { getContext: () => context }) },
  });
  Object.defineProperty(globalThis, "createImageBitmap", {
    configurable: true,
    value: async () => ({ width: 1600, height: 800, close() {} }),
  });

  try {
    await run(dimensions);
  } finally {
    if (previousDocument) Object.defineProperty(globalThis, "document", previousDocument);
    else Reflect.deleteProperty(globalThis, "document");
    if (previousBitmap) Object.defineProperty(globalThis, "createImageBitmap", previousBitmap);
    else Reflect.deleteProperty(globalThis, "createImageBitmap");
  }
}

test("accepts supported browser image formats and rejects non-image uploads", async () => {
  assert.equal(isSupportedImageType("image/png"), true);
  assert.equal(isSupportedImageType("image/avif"), true);
  assert.equal(isSupportedImageType("application/pdf"), false);
  await assert.rejects(
    compressImage({ type: "application/pdf", size: 10 } as File, { maxWidth: 400, maxHeight: 400 }),
    /JPEG, PNG, WebP, or AVIF/,
  );
});

test("compresses logos within 400 by 400 at quality 0.8", async () => {
  await withCanvas(
    (_canvas, type, quality) => `data:${type};base64,${quality}`,
    async (stats) => {
      const image = await compressImage({ type: "image/png", size: 100 } as File, { maxWidth: 400, maxHeight: 400 });
      assert.match(image, /^data:image\/webp;base64,/);
      assert.deepEqual([stats.width, stats.height], [400, 200]);
      assert.equal(stats.qualities[0], 0.8);
      assert.ok(image.length < 250_000);
    },
  );
});

test("reduces dimensions before lowering quality to meet the data URL limit", async () => {
  await withCanvas(
    (canvas, type, quality) => {
      if (canvas.width > 330) return `data:${type};base64,${"A".repeat(MAX_IMAGE_DATA_URL_LENGTH)}`;
      return `data:${type};base64,${quality}`;
    },
    async (stats) => {
      const image = await compressImage({ type: "image/jpeg", size: 100 } as File, { maxWidth: 1000 });
      assert.ok(image.length < MAX_IMAGE_DATA_URL_LENGTH);
      assert.ok(stats.width <= 330);
      assert.ok(stats.height <= 165);
      assert.ok(stats.qualities.length > 2);
      assert.equal(stats.qualities.every((quality) => quality === 0.8), true);
    },
  );
});
