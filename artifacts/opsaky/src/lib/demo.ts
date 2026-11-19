import { defaultConfig, type Account, type StorePage } from "./model";

const date = "2026-11-20T10:00:00.000Z";
const link = (id: string, label: string, url: string) => ({ id, label, url, active: true, message: "" });
export function demoPages(): StorePage[] {
  return [
    { id: "sage-coffee", title: "Sage & Sip", slug: "sage-and-sip", published: true, createdAt: date, updatedAt: date, config: {
      ...defaultConfig(), category: "Restaurant/Cafe", bio: "Good coffee. Slow mornings. A little everyday magic.\nYour neighborhood coffee ritual, reimagined.",
      logo: "/images/cafe-logo.jpg", showStatus: true, isOpen: true, announcement: "Your daily dose of something good.", showAnnouncement: true,
      phone: "+962790000000", email: "hello@example.com", showPhone: true, showEmail: false, font: "serif",
      gallery: [{ id: "coffee-1", image: "/images/coffee.jpg", title: "Your morning ritual", price: "3.50 JOD" }, { id: "coffee-2", image: "/images/ceramics.jpg", title: "Made to slow down", price: "" }],
      links: [link("sage-menu", "Explore our menu", "https://example.com/menu"), link("sage-instagram", "A little behind the scenes", "https://instagram.com"), link("sage-whatsapp", "Let’s talk coffee", "https://wa.me/962790000000"), link("sage-location", "Find your new favorite spot", "https://maps.google.com")],
    } },
    { id: "form-studio", title: "Form Studio", slug: "form-studio", published: true, createdAt: date, updatedAt: date, config: {
      ...defaultConfig(), category: "Home Business", bio: "Objects for a slower kind of living.\nThoughtfully made, beautifully imperfect.",
      background: "#e9e5dc", surface: "#f8f6f1", buttonColor: "#655849", accent: "#897460", textColor: "#40392f", font: "serif", logoShape: "rounded",
      galleryMode: "featured", gallery: [{ id: "form-1", image: "/images/ceramics.jpg", title: "The everyday collection", price: "From 24 JOD" }],
      links: [link("form-shop", "Discover the collection", "https://example.com/collection"), link("form-instagram", "Follow the process", "https://instagram.com")],
    } },
    { id: "maison-noir", title: "Maison Noir", slug: "maison-noir", published: false, createdAt: date, updatedAt: date, config: {
      ...defaultConfig(), category: "Perfumes/Beauty", bio: "An expression, not an accessory.\nDiscover your signature scent.",
      theme: "noir", background: "#1d2220", surface: "#2b302d", accent: "#c3ab80", buttonColor: "#c3ab80", textColor: "#eee9dd", font: "serif",
      galleryMode: "grid", gallery: [{ id: "maison-1", image: "/images/perfume.jpg", title: "No. 04 — Amber", price: "65 JOD" }],
      links: [link("maison-discover", "Discover your scent", "https://example.com/scents"), link("maison-instagram", "The world of Maison", "https://instagram.com")],
    } },
  ];
}
export const demoAccount: Account = { id: "demo-owner", email: "studio@example.com", businessName: "Your workspace", category: "Other", phone: "", requestedSlug: "sage-and-sip", status: "APPROVED", pageCount: 3 };
export const demoAccounts: Account[] = [
  demoAccount,
  { id: "demo-cafe", email: "cafe@example.com", businessName: "Morning Ritual", category: "Restaurant/Cafe", phone: "+962790000001", requestedSlug: "morning-ritual", status: "PENDING", pageCount: 1 },
  { id: "demo-fashion", email: "boutique@example.com", businessName: "Linen & Line", category: "Fashion/Apparel", phone: "+962790000002", requestedSlug: "linen-and-line", status: "PENDING", pageCount: 1 },
  { id: "demo-tech", email: "tech@example.com", businessName: "Circuit Supply", category: "Electronics", phone: "+962790000003", requestedSlug: "circuit-supply", status: "REJECTED", pageCount: 1 },
];
