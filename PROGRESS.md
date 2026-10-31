# BMG Oran — Project Progress & AI Handoff

> **Purpose of this file**: This document tracks the complete development progress, architectural decisions, current state, and upcoming tasks for the BMG Oran bilingual auto/moto parts storefront. **Any AI assistant resuming this project should read this document first to get full context without redundant exploration.**

---

## 📌 Project Overview

- **Project**: Bilingual (French LTR / Arabic RTL) static storefront for an Algerian auto & motorcycle parts shop.
- **Client / Location**: Oran, Algeria (serving all 58 wilayas).
- **Architecture**: 100% static client-side React 19 + TypeScript + Vite 8 application. Zero backend, zero database, no runtime server, free deployment on Cloudflare Pages.
- **Order Channel**: WhatsApp handoff (`wa.me` links with structured, localized order details).
- **Admin System**: Serverless in-browser CMS (`/admin`) that commits directly to GitHub via GitHub REST API and user's Personal Access Token.
- **Repository Path**: `d:\softwares\OpenBot\autoparts-store`

---

## 🚀 Quick Reference Commands

```bash
# Development server (http://localhost:5173)
npm run dev

# Full test suite (Vitest + React Testing Library)
npm test

# Full production build (tsc + Vite + static product prerendering + OG + sitemap)
npm run build

# Preview production build (http://localhost:4173)
npm run preview

# Verify build structure, placeholders, and SEO integrity
npm run verify

# Regenerate placeholder SVG product images
npm run images

# Regenerate 1200x630 Open Graph cards (requires Chrome/Edge installed)
npm run og
```

---

## 🏗️ Architecture & Key Files

| Area | Key Files | Description |
|---|---|---|
| **Site Config** | `site.config.json` | Business info, contact, WhatsApp, GitHub repo, site URL |
| **Business Logic** | `src/config/business.ts` | Loaded config, WhatsApp URL builders, formatters |
| **Shipping Rules** | `src/config/shipping.ts` | All 58 Algerian wilayas, home/desk delivery rates |
| **Catalogue** | `src/data/products.json`, `src/data/products.ts` | Product schema, categories, typed query helpers |
| **i18n** | `src/i18n/translations.ts`, `src/i18n/I18nProvider.tsx` | Complete FR (LTR) and AR (RTL) dictionaries |
| **Router & Nav** | `src/lib/router.tsx`, `src/App.tsx` | Lightweight custom hash/history router with deep linking |
| **Order & WA** | `src/lib/order.ts`, `src/lib/shipping.ts` | Order validation, live totals, WhatsApp message encoding |
| **Admin CMS** | `src/pages/AdminPage.tsx`, `src/lib/admin/` | GitHub-backed static CMS (catalogue, github api, image processing) |
| **Static Build** | `scripts/postbuild.mjs`, `scripts/verify-build.mjs` | Prerenders HTML for each product, `_redirects`, sitemap |
| **Styles** | `src/styles.css`, `src/admin.css` | Design system, CSS logical properties for RTL, dark automotive aesthetic |

---

## ✅ Completed & Verified Features

### 1. Storefront & Customer UX
- [x] **Home Page (`HomePage.tsx`)**: Hero, category grid, featured products, 3-step ordering process explainer, trust badges.
- [x] **Shop Page (`ShopPage.tsx`)**: Search (title, brand, part number, keywords), category tabs, query string persistence in URL (`/shop?q=...&category=...`).
- [x] **Product Details (`ProductPage.tsx`)**: Dedicated permanent URLs (`/product/:slug`), multi-image gallery with keyboard navigation, stock badge, part numbers, full specs table, quantity stepper.
- [x] **Static Prerendering**: `scripts/postbuild.mjs` generates standalone HTML files for each product with custom `<title>`, description, canonical URL, and Open Graph tags.
- [x] **Information Pages**: `/delivery` (explanation of 58 wilayas, desk vs domicile), `/contact` (hours, map/address, phone, email, socials), `/404` custom not found page.

### 2. Localization (i18n) & RTL
- [x] Dual language support: French (LTR) and Arabic (RTL).
- [x] Persistent preference in `localStorage`.
- [x] Immediate `<html lang="" dir="">` initialization via `public/locale-init.js` to eliminate layout flash.
- [x] Layout built with CSS logical properties (`margin-inline`, `padding-inline`, `start`, `end`).

### 3. Checkout & Algerian Delivery (58 Wilayas)
- [x] Dual delivery methods: **Domicile** (home delivery) & **Stop-Desk** (depot pickup).
- [x] Live subtotal, delivery quote, and total calculation.
- [x] **Safety guard**: Missing delivery rates block checkout explicitly; missing rates are never treated as 0 DZD.
- [x] Form validation: Name length, Algerian phone number syntax (`05/06/07...` or `+213...`), wilaya selection, delivery method selection.
- [x] Privacy notice: Explains that data stays on customer's device and is transmitted solely through WhatsApp.

### 4. WhatsApp Order Pipeline
- [x] Generates complete localized message with order reference, product details, quantity, prices, customer name, phone, wilaya, delivery method, and exact total.
- [x] One-click WhatsApp launch (`https://wa.me/<number>?text=...`).
- [x] Copy text fallback button for desktop or blocked popups.
- [x] Blocks checkout with warning if WhatsApp number is unconfigured in `site.config.json`.

### 5. In-Browser Admin Panel (`/admin`)
- [x] Authenticates directly with GitHub Personal Access Token (stored in `sessionStorage`).
- [x] Loads `src/data/products.json` directly from GitHub repository.
- [x] Create, edit, and delete products with auto-generated slugs.
- [x] Client-side image processing: WebP conversion, thumbnail generation, automatic social OG card creation via HTML Canvas.
- [x] Atomic commits to GitHub default branch via GitHub Git Trees & Commits API.
- [x] Fully covered by unit and integration tests (`admin-catalogue.test.ts`, `admin-github.test.ts`, `admin-page.test.tsx`).

### 6. Testing & Quality Assurance
- [x] **12 test suites, 140 tests** (139 passing, 1 skipped static-build sentinel).
- [x] Unit tests for order math, validation, catalogue helpers, shipping lookup, and GitHub API.
- [x] Integration tests for storefront routing, deep links, checkout flow, missing rate safety, and admin workflows.
- [x] Strict TypeScript typing (`tsc --noEmit` clean).

---

## ⏳ Pending / Next Steps for Incoming AI

### 1. Pre-Launch Configuration (Business Data)
- [ ] Set real `whatsappNumber` in `site.config.json` (e.g. `213XXXXXXXXX` without `+` or spaces).
- [ ] Set real `siteUrl` in `site.config.json` once Cloudflare Pages subdomain or custom domain is chosen.
- [ ] Set real phone, address, and social links in `site.config.json`, then switch `demoContact` to `false`.
- [ ] Connect GitHub repository in `site.config.json` (`"repository": "owner/repo"`).

### 2. Shipping Rates
- [ ] Update `src/config/shipping.ts` with real quotes from the shop's chosen courier partner (e.g., Yalidine, ZR Express, Procolis, Kazitour).
- [ ] Set `SHIPPING_RATES_ARE_EXAMPLES = false` once verified.

### 3. Product Catalogue & Assets
- [ ] Add real initial products to `src/data/products.json` (or use `/admin` once deployed).
- [ ] Replace demo SVG product images in `public/images/products/` with real photos.
- [ ] Run `npm run og` to regenerate high-resolution social sharing cards.

### 4. Optional Enhancements
- [ ] Multi-item shopping cart (if the client requests ordering multiple different parts simultaneously; currently single-product checkout with quantity stepper).
- [ ] Wilaya search/filter autocomplete dropdown in checkout for faster selection on mobile.
- [ ] Vehicle selector / compatibility filter (Brand -> Model -> Year) if catalogue grows past 50+ items.

---

## 📋 Handoff Guide for the Next AI Assistant

When continuing work on this project:
1. **Always read `PROGRESS.md` first.**
2. Run `npm test` to ensure all existing test suites pass.
3. Check `site.config.json` and `src/data/products.json` before modifying catalogue or business config.
4. When writing UI changes, always maintain **both** French and Arabic strings in `src/i18n/translations.ts` and test RTL layout (`dir="rtl"`).
5. When modifying pages or routes, run `npm run build` to verify that `scripts/postbuild.mjs` runs without errors.
6. Keep this `PROGRESS.md` updated with any newly completed features, architectural changes, or pending tasks.
