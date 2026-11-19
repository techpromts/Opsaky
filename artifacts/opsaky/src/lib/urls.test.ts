import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { displayUrl, getAppOrigin, originFromHeaders, pageUrl } from "./urls.ts";

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const originalFallback = process.env.NEXT_PUBLIC_APP_URL;
afterEach(() => {
  if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
  else Reflect.deleteProperty(globalThis, "window");
  if (originalFallback === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
  else process.env.NEXT_PUBLIC_APP_URL = originalFallback;
});
function browser(origin: string) {
  Object.defineProperty(globalThis, "window", { configurable: true, value: { location: { origin } } });
}

test("Vercel browser domain wins over a different configured fallback", () => {
  browser("https://opsaky.vercel.app");
  process.env.NEXT_PUBLIC_APP_URL = "https://fallback.example.com/";
  assert.equal(pageUrl("sage-and-sip", false), "https://opsaky.vercel.app/sage-and-sip");
  assert.equal(displayUrl("sage-and-sip", false), "opsaky.vercel.app/sage-and-sip");
});
test("custom hosts and ports are preserved for copied and QR URLs", () => {
  browser("http://shop.example.com:4000");
  assert.equal(pageUrl("shop", false), "http://shop.example.com:4000/shop");
  assert.equal(pageUrl("shop", true), "http://shop.example.com:4000/demo/preview/shop");
});
test("SSR falls back to the optional configured origin", () => {
  Reflect.deleteProperty(globalThis, "window");
  process.env.NEXT_PUBLIC_APP_URL = "https://custom.example.com/path/";
  assert.equal(getAppOrigin(), "https://custom.example.com");
  assert.equal(pageUrl("shop", false), "https://custom.example.com/shop");
});
test("missing or invalid fallback never invents a domain", () => {
  Reflect.deleteProperty(globalThis, "window");
  process.env.NEXT_PUBLIC_APP_URL = "javascript:alert(1)";
  assert.equal(pageUrl("shop", false), "/shop");
  delete process.env.NEXT_PUBLIC_APP_URL;
  assert.equal(getAppOrigin(), "");
});
test("social previews resolve the request domain rather than the fallback", () => {
  Reflect.deleteProperty(globalThis, "window");
  process.env.NEXT_PUBLIC_APP_URL = "https://fallback.example.com";
  assert.equal(originFromHeaders(new Headers({
    "x-forwarded-host": "shop.example.com",
    "x-forwarded-proto": "https",
    host: "internal-server:3000",
  })), "https://shop.example.com");
});
test("server resolution supports direct hosts and validates forwarded values", () => {
  Reflect.deleteProperty(globalThis, "window");
  process.env.NEXT_PUBLIC_APP_URL = "https://fallback.example.com";
  assert.equal(originFromHeaders(new Headers({ host: "localhost:3000", "x-forwarded-proto": "http" })), "http://localhost:3000");
  assert.equal(originFromHeaders(new Headers({ "x-forwarded-host": "bad.example/path" })), "https://fallback.example.com");
});
