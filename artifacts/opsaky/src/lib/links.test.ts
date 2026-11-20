import assert from "node:assert/strict";
import test from "node:test";
import { getWhatsAppDigits, whatsAppOrderUrl } from "./links.ts";

test("normalizes a WhatsApp number to international digits", () => {
  assert.equal(getWhatsAppDigits([{ url: "+962 (79) 123-4567" }]), "962791234567");
});

test("reads a phone number from WhatsApp links", () => {
  assert.equal(getWhatsAppDigits([{ url: "https://wa.me/+962-79-123-4567" }]), "962791234567");
  assert.equal(getWhatsAppDigits([{ url: "https://api.whatsapp.com/send?phone=%2B962%2079%20123%204567" }]), "962791234567");
});

test("hides order links when no WhatsApp number is configured", () => {
  assert.equal(getWhatsAppDigits([{ url: "https://instagram.com/shop" }]), null);
});

test("builds an encoded direct order message with the item price", () => {
  const url = new URL(whatsAppOrderUrl("962791234567", "Latte", "3.50 JOD"));
  assert.equal(url.origin + url.pathname, "https://wa.me/962791234567");
  assert.equal(url.searchParams.get("text"), "Hi! I'd like to order: Latte (3.50 JOD)");
});
