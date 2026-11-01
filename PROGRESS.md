# BMG Oran — Project Progress & AI Handoff

> **Purpose of this file**: This document tracks the complete development progress, architectural decisions, current state, and upcoming tasks for the BMG Oran bilingual auto/moto parts storefront. **Any AI assistant resuming this project should read this document first to get full context without redundant exploration.**

> **Last updated**: 2026-11-01 — Session 3 (local admin persistence + ZIP export).

---

## 📌 Project Overview

- **Project**: Bilingual (French LTR / Arabic RTL) static storefront for an Algerian auto & motorcycle parts shop.
- **Client / Location**: Oran, Algeria (serving all 58 wilayas).
- **Architecture**: 100% static client-side React 19 + TypeScript + Vite 8 application. Zero backend, zero database, no runtime server, free deployment on Cloudflare Pages.
- **Order Channel**: WhatsApp handoff (`wa.me` links with structured, localized order details).
- **Admin System**: Serverless in-browser CMS (`/admin`) that commits directly to GitHub via GitHub REST API and user's Personal Access Token.
- **Repository Path**: `d:\softwares\OpenBot\autoparts-store`
- **User OS**: Windows (PowerShell). Use `;` not `&&` to chain commands.

---

## 🚀 Quick Reference Commands

```bash
# Development server (http://localhost:5173)
npm run dev

# Development server accessible on LAN (e.g. phone on same WiFi)
npm run dev -- --host

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
| **Communes** | `src/data/communes.ts` | All communes/cities for every wilaya (FR + AR names) with `getCommunesForWilaya()` and `formatCommuneName()` |
| **i18n** | `src/i18n/translations.ts`, `src/i18n/I18nProvider.tsx` | Complete FR (LTR) and AR (RTL) dictionaries |
| **Router & Nav** | `src/lib/router.tsx`, `src/App.tsx` | Lightweight custom hash/history router with deep linking |
| **Order & WA** | `src/lib/order.ts`, `src/lib/shipping.ts` | Order validation, live totals, WhatsApp message encoding |
| **Admin CMS** | `src/pages/AdminPage.tsx`, `src/lib/admin/` | GitHub-backed static CMS (catalogue, github api, image processing), plus browser-local persistence (`local.ts`) and ZIP export (`zip.ts`) |
| **Static Build** | `scripts/postbuild.mjs`, `scripts/verify-build.mjs` | Prerenders HTML for each product, `_redirects`, sitemap |
| **Styles** | `src/styles.css`, `src/admin.css` | Design system, CSS logical properties for RTL, dark automotive aesthetic |

---

## 📜 Git History (most recent first)

```
2625630 feat(admin): persist local mode and export ready-to-commit ZIP
d6a841e docs: update PROGRESS.md with full session 2 history and deployment guide
838119c feat(checkout): add dynamic commune/city selector for all 58 wilayas
9fcdb16 feat(admin): add local sandbox mode and footer administration link
82bd174 feat: complete storefront, admin cms, test suites and progress documentation
```

- **Branch**: `main` (only branch)
- **Remote**: ⚠️ **No remote configured yet.** The repo is local only. User needs to create a GitHub repo and `git remote add origin`.
- **Git config** (local scope only): `user.name "BMG Oran Dev"`, `user.email "dev@bmg-oran.local"`
- **Working tree**: Clean at the end of Session 3.

---

## ✅ Completed & Verified Features

### 1. Storefront & Customer UX
- [x] **Home Page (`HomePage.tsx`)**: Hero, category grid, featured products, 3-step ordering process explainer, trust badges.
- [x] **Shop Page (`ShopPage.tsx`)**: Search (title, brand, part number, keywords), category tabs, query string persistence in URL (`/shop?q=&category=...`).
- [x] **Product Details (`ProductPage.tsx`)**: Dedicated permanent URLs (`/product/:slug`), multi-image gallery with keyboard navigation, stock badge, part numbers, full specs table, quantity stepper.
- [x] **Static Prerendering**: `scripts/postbuild.mjs` generates standalone HTML files for each product with custom `<title>`, description, canonical URL, and Open Graph tags.
- [x] **Information Pages**: `/delivery` (explanation of 58 wilayas, desk vs domicile), `/contact` (hours, map/address, phone, email, socials), `/404` custom not found page.

### 2. Localization (i18n) & RTL
- [x] Dual language support: French (LTR) and Arabic (RTL).
- [x] Persistent preference in `localStorage`.
- [x] Immediate `<html lang="" dir="">` initialization via `public/locale-init.js` to eliminate layout flash.
- [x] Layout built with CSS logical properties (`margin-inline`, `padding-inline`, `start`, `end`).

### 3. Checkout & Algerian Delivery (58 Wilayas + Communes)
- [x] Dual delivery methods: **Domicile** (home delivery) & **Stop-Desk** (depot pickup).
- [x] **Dynamic City / Commune Selector**:
  - Automatically loads the exact communes/cities for the selected wilaya (e.g. Oran -> Gdyel, Es Senia, Bir El Djir, Arzew...).
  - Full dataset covering all 58 Algerian wilayas in both French and Arabic (`src/data/communes.ts`).
  - Includes an "Autre commune (préciser) / أخرى" fallback input for any unlisted village or locality.
  - Communes are seamlessly included in the generated WhatsApp message (e.g. `Wilaya: Oran (31) · Gdyel`).
- [x] Live subtotal, delivery quote, and total calculation.
- [x] **Safety guard**: Missing delivery rates block checkout explicitly; missing rates are never treated as 0 DZD.
- [x] Form validation: Name length, Algerian phone number syntax (`05/06/07...` or `+213...`), wilaya selection, delivery method selection.
- [x] Privacy notice: Explains that data stays on customer's device and is transmitted solely through WhatsApp.

### 4. WhatsApp Order Pipeline
- [x] Generates complete localized message with order reference, product details, quantity, prices, customer name, phone, wilaya, commune, delivery method, and exact total.
- [x] One-click WhatsApp launch (`https://wa.me/<number>?text=...`).
- [x] Copy text fallback button for desktop or blocked popups.
- [x] Blocks checkout with warning if WhatsApp number is unconfigured in `site.config.json`.

### 5. In-Browser Admin Panel (`/admin`)
- [x] Accessible at `/admin` (and via the discreet "Administration" footer link).
- [x] **Local Mode & GitHub Mode**:
  - **Local Mode (One-Click)**: Works without a GitHub token. Products, prices and uploaded photos are persisted in the browser (`localStorage` for the catalogue, IndexedDB for photos), restored on reload, and exportable as a **ready-to-commit ZIP** containing `src/data/products.json`, `public/images/products/*`, `public/og/*` and a French `LISEZ-MOI.txt`. A separate “Réinitialiser” action clears the local copy after confirmation.
  - **GitHub Mode**: Authenticates directly with a GitHub Personal Access Token (stored safely in `sessionStorage`).
- [x] Loads catalogue directly from GitHub repository (or local fallback).
- [x] Create, edit, and delete products with auto-generated or custom slugs.
- [x] Price control in Algerian Dinars (DA) with validation.
- [x] Client-side image processing: automatic 1200×900 4:3 JPEG resizing and compression via HTML Canvas.
- [x] Automatic social OG card generator: draws a branded 1200×630 card with product name, price, brand mark, and image.
- [x] Atomic commits to GitHub default branch via GitHub Git Trees & Commits API.
- [x] Fully covered by unit and integration tests (`admin-catalogue.test.ts`, `admin-github.test.ts`, `admin-local.test.ts`, `admin-zip.test.ts`, `admin-page.test.tsx`).

### 6. Testing & Quality Assurance
- [x] **14 test suites, 155 tests passing, 1 skipped** (static-build sentinel).
- [x] Unit tests for order math, validation, catalogue helpers, shipping lookup, and GitHub API.
- [x] Integration tests for storefront routing, deep links, checkout flow, commune selector, missing rate safety, and admin workflows.
- [x] Strict TypeScript typing (`tsc --noEmit` clean).
- [x] Build passes clean: `npm run build` completes successfully (~179ms Vite build + postbuild prerendering).
- [x] Verify passes: `npm run verify` shows 5 expected warnings (all for pre-launch placeholder values).

---

## 🔧 Development Session Log

### Session 1 (Previous AI — "open code")
Built the entire foundation:
- Full React 19 + TypeScript + Vite 8 project scaffold.
- All 8 pages: Home, Shop, Product, Checkout, Delivery, Contact, Admin, 404.
- Custom lightweight router (`src/lib/router.tsx`).
- 58 wilayas with shipping rates (`src/config/shipping.ts`).
- WhatsApp order message builder (`src/lib/order.ts`).
- Admin panel with GitHub API integration.
- Complete FR/AR translations.
- Static prerendering with OG cards.
- Full test suite (12 files, 130+ tests).

### Session 2 (Antigravity AI — 2026-10-31)
Picked up from Session 1, added:

1. **`PROGRESS.md` handoff document** — This file. Created to allow seamless AI-to-AI handoff.

2. **Git repository initialized** — `main` branch, 3 commits (see Git History above).
   - Git config set with local scope only.

3. **Admin Panel Local Mode** — Commit `9fcdb16`:
   - Files modified: `AdminPage.tsx`, `Icon.tsx`, `Footer.tsx`, `admin.css`, `styles.css`, `admin-page.test.tsx`.
   - Added `isLocalMode` state, `startLocalMode()`, `exportJson()`.
   - Added `download` icon to Icon component.
   - Added discreet "Administration" link in the footer.
   - Added `.admin-login__divider` styles (or/divider between GitHub login and local mode).
   - Added `.footer-admin-link` styles.
   - Added test for local mode button and flow.

4. **Dynamic Commune/City Selector** — Commit `838119c`:
   - **New file**: `src/data/communes.ts` — Complete dataset of communes for all 58 wilayas (French + Arabic names).
   - Modified: `CheckoutPage.tsx` — Added `commune`, `customCommune` state, `availableCommunes` memo, commune `<select>` with custom input fallback.
   - Modified: `src/lib/order.ts` — Added `commune?` field to `OrderFormValues` and `OrderMessageInput`, included in WhatsApp message.
   - Modified: `src/i18n/translations.ts` — Added 6 new translation keys for commune UI (both FR and AR).
   - Added tests: `checkout.test.tsx` (communes populate when wilaya selected), `order.test.ts` (commune appears in WhatsApp message).

5. **Dev Server Setup**:
   - Started with `npm run dev -- --host` for LAN access.
   - Accessible at `http://localhost:5173/` and on LAN via `http://<local-ip>:5173/`.
   - Explained to user: LAN link works for devices on same WiFi; for external sharing, see Deployment section below.

6. **User Guidance Provided**:
   - How to access the admin panel (`/admin` or footer link).
   - How to share locally on LAN vs externally (tunneling/deployment).

### Session 3 (AI — 2026-11-01)

Made the local admin sandbox a real, reload-safe editor:

1. **Local persistence** — new `src/lib/admin/local.ts`:
   - Catalogue stored in `localStorage` under `bmg.admin.local.products` with a versioned envelope (`version: 1`, `savedAt`, `products`).
   - Uploaded photos stored as blobs in IndexedDB (`bmg-admin`, store `images`, keyed by future repository path).
   - Corrupt/outdated payloads are discarded automatically; unavailable storage falls back gracefully.
   - `clearLocalData()` wipes both stores for the “Réinitialiser” action.

2. **Admin wiring** — `src/pages/AdminPage.tsx`:
   - “Tester en mode local” restores the saved catalogue and hydrates saved photo previews.
   - Local save persists the catalogue, writes new photos and deletes removed ones.
   - Local delete updates the saved catalogue and removes its photos.
   - “Recharger” reloads the saved local state instead of resetting to the demo catalogue.
   - New confirmed “Réinitialiser” action clears the browser copy.
   - Replaced the JSON-only export with a **ZIP bundle** export.

3. **ZIP export** — new `src/lib/admin/zip.ts`:
   - Store-method ZIP writer (no dependency) with CRC32 and UTF-8 paths.
   - Archive mirrors the repo: `src/data/products.json`, `public/images/products/*`, `public/og/*` (OG cards regenerated in-browser) and `LISEZ-MOI.txt` with publish instructions.
   - Missing photos are reported instead of silently breaking the export.

4. **Tests** — new `admin-local.test.ts` and `admin-zip.test.ts`; updated `admin-page.test.tsx` for persistence, restore, reset and ZIP export.
   - Suite: **14 files, 155 passed + 1 skipped**.
   - `npm run typecheck`, `npm run build`, `npm test` and `npm run verify` all pass (5 expected pre-launch warnings).

5. **Real-browser QA** — preview build in Chromium:
   - Changed a price 3 500 → 4 321 DA, uploaded an extra photo, saved, reloaded: both the price and the photo preview were restored from `localStorage` / IndexedDB.
   - Exported the ZIP (4.37 MB): 8 products, 17 photos, 8 OG cards, `products.json` with the edited price, and `LISEZ-MOI.txt`.
   - “Réinitialiser” cleared `localStorage` and the IndexedDB image store and restored the original catalogue.

6. **Files touched**:
   - New: `src/lib/admin/local.ts`, `src/lib/admin/zip.ts`, `src/test/admin-local.test.ts`, `src/test/admin-zip.test.ts`.
   - Modified: `src/pages/AdminPage.tsx`, `src/admin.css`, `src/test/admin-page.test.tsx`, `src/test/setup.ts`, `PROGRESS.md`.

---

## 🌐 Sharing & Deployment Options

The user asked how to share the site with a friend who isn't on the same WiFi. Here are the options discussed:

### Quick Temporary Share (for testing/demo)
```powershell
# Option A: Cloudflare Tunnel (free, no signup needed for quick share)
winget install Cloudflare.cloudflared
cloudflared tunnel --url http://localhost:5173
# Prints a public URL like https://random-words.trycloudflare.com

# Option B: ngrok (free tier, requires signup at ngrok.com)
winget install ngrok.ngrok
ngrok http 5173
# Prints a public URL like https://xxxx.ngrok-free.app
```

### Production Deployment (recommended — what the project is designed for)
1. Create a GitHub repository (public or private).
2. Add remote: `git remote add origin https://github.com/<owner>/<repo>.git`
3. Push: `git push -u origin main`
4. Connect the repo to **Cloudflare Pages**:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment: Node 20+
5. Gets a permanent `*.pages.dev` URL (or custom domain).
6. Update `siteUrl` in `site.config.json` with the final URL.
7. Update `repository` in `site.config.json` with `owner/repo` so the admin CMS can commit.

---

## ⏳ Pending / Next Steps for Incoming AI

### 1. Pre-Launch Configuration (Business Data — requires user input)
- [ ] Set real `whatsappNumber` in `site.config.json` (e.g. `213XXXXXXXXX` without `+` or spaces).
- [ ] Set real `siteUrl` in `site.config.json` once Cloudflare Pages subdomain or custom domain is chosen.
- [ ] Set real phone, address, and social links in `site.config.json`, then switch `demoContact` to `false`.
- [ ] Connect GitHub repository in `site.config.json` (`"repository": "owner/repo"`).

### 2. Shipping Rates (requires user input)
- [ ] Update `src/config/shipping.ts` with real quotes from the shop's chosen courier partner (e.g., Yalidine, ZR Express, Procolis, Kazitour).
- [ ] Set `SHIPPING_RATES_ARE_EXAMPLES = false` once verified.

### 3. Product Catalogue & Assets
- [ ] Add real initial products to `src/data/products.json` (or use `/admin` once deployed).
- [ ] Replace demo SVG product images in `public/images/products/` with real photos.
- [ ] Run `npm run og` to regenerate high-resolution social sharing cards.

### 4. Deployment
- [ ] Create GitHub repository and push code (see Deployment section above).
- [ ] Connect to Cloudflare Pages for automatic deployment.
- [ ] Update `siteUrl` and `repository` in `site.config.json` after deployment.

### 5. Optional Feature Enhancements
- [ ] **Multi-item shopping cart** — Currently the checkout only handles one product at a time with a quantity stepper. Adding a cart would let customers order multiple different parts in one WhatsApp message.
- [ ] **Wilaya search/filter autocomplete** — Type-ahead dropdown in checkout for faster selection on mobile (58 wilayas is long to scroll).
- [ ] **Vehicle selector / compatibility filter** — Brand → Model → Year to help customers find the right part (useful when catalogue grows past 50+ items).
- [ ] **Product image zoom / lightbox** — Pinch-to-zoom on product gallery images.
- [ ] **Recently viewed products** — `localStorage`-based section on home or shop page.

---

## ⚠️ Important Constraints & Invariants

These rules must **never** be violated:

1. **PROGRESS.md must be kept updated** — The user explicitly requested this as the handoff mechanism for AI-to-AI continuity. Update it after every significant change.
2. **Bilingual parity** — Every UI string must exist in both French and Arabic in `src/i18n/translations.ts`.
3. **RTL testing** — Layout changes must work with CSS logical properties and `dir="rtl"`.
4. **Tests must pass** — Run `npm test` after every code change; all tests must pass (currently 155 passed + 1 skipped).
5. **Build must be clean** — Run `npm run build` (includes `tsc --noEmit`) to verify TypeScript and static generation.
6. **Zero backend** — The entire site must remain fully static with no server-side code.
7. **Admin panel is French-only** — The admin area (`src/admin.css`, `AdminPage.tsx`) is intentionally LTR/French only.
8. **Never treat missing shipping rates as free** — A `null` rate blocks checkout; this is a safety invariant tested explicitly.
9. **User's OS**: Windows. Shell: PowerShell. Use `;` to chain commands (not `&&`). Path style: backslash in Windows commands, forward slash in code.

---

## 🐛 Known Issues & Gotchas

1. **LF/CRLF warnings on Windows**: Every `git add` produces CRLF warnings. These are harmless and can be ignored (or silenced with `git config core.autocrlf true`).
2. **`npm run verify` shows 5 warnings**: These are all expected placeholder warnings for pre-launch configuration values (WhatsApp number, site URL, etc.). They will disappear once real values are set.
3. **`edit_file` precision**: When using edit_file, always read the actual file content first. Target strings must match exactly including whitespace — don't guess.

---

## 📋 Handoff Guide for the Next AI Assistant

When continuing work on this project:
1. **Always read `PROGRESS.md` first** (this file).
2. Run `npm test` to ensure all existing test suites pass before making changes.
3. Check `site.config.json` and `src/data/products.json` before modifying catalogue or business config.
4. When writing UI changes, always maintain **both** French and Arabic strings in `src/i18n/translations.ts` and test RTL layout (`dir="rtl"`).
5. When modifying pages or routes, run `npm run build` to verify that `scripts/postbuild.mjs` runs without errors.
6. **PowerShell note**: Use `;` to chain commands (e.g. `Set-Location d:\softwares\OpenBot\autoparts-store; npm test`), **not** `&&`.
7. The dev server can be started with `npm run dev` (localhost only) or `npm run dev -- --host` (LAN accessible).
8. The admin panel is at `/admin` — its local sandbox mode persists catalogue edits in `localStorage`, photos in IndexedDB, and exports a ready-to-commit ZIP. GitHub mode remains available for live saves.
9. **Keep this `PROGRESS.md` updated** with any newly completed features, architectural changes, or pending tasks.
