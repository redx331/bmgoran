# BMG Oran — Project Progress & AI Handoff

> **Purpose of this file**: This document tracks the complete development progress, architectural decisions, current state, and upcoming tasks for the BMG Oran bilingual auto/moto parts storefront. **Any AI assistant resuming this project should read this document first to get full context without redundant exploration.**

> **Last updated**: 2026-11-04 — Session 10 (write-capable GitHub token; add/delete verified live end-to-end).

---

## 📌 Project Overview

- **Project**: Bilingual (French LTR / Arabic RTL) static storefront for an Algerian auto & motorcycle parts shop.
- **Client / Location**: Oran, Algeria (serving all 58 wilayas).
- **Architecture**: Static React 19 + TypeScript + Vite 8 storefront on Cloudflare Pages, plus Pages Functions: `functions/api/order.ts` (emails orders) and `functions/api/admin/*` (password login + authenticated GitHub proxy). No database, no customer accounts.
- **Order Channel**: Email. The customer submits the form, `POST /api/order` validates it, recalculates the price server-side and emails the shop through Resend. WhatsApp was removed at the owner's request; the shop's email and phone must not appear on the site or in this public repo.
- **Admin System**: Serverless CMS (`/admin`). Username/password login checked in a Pages Function; signed 8-hour `HttpOnly` session cookie; the GitHub token lives only in Cloudflare env vars, and the browser commits through `/api/admin/github`.
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
| **Site Config** | `site.config.json` | Business info, GitHub repo, site URL |
| **Business Logic** | `src/config/business.ts` | Loaded config, URL helpers |
| **Shipping Rules** | `src/config/shipping.ts` | All 58 Algerian wilayas, home/desk delivery rates |
| **Catalogue** | `src/data/products.json`, `src/data/products.ts` | Product schema, categories, typed query helpers |
| **Communes** | `src/data/communes.ts` | All communes/cities for every wilaya (FR + AR names) with `getCommunesForWilaya()` and `formatCommuneName()` |
| **i18n** | `src/i18n/translations.ts`, `src/i18n/I18nProvider.tsx` | Complete FR (LTR) and AR (RTL) dictionaries |
| **Router & Nav** | `src/lib/router.tsx`, `src/App.tsx` | Lightweight custom hash/history router with deep linking |
| **Orders** | `src/lib/order.ts`, `src/lib/shipping.ts`, `functions/api/order.ts` | Order validation, live totals, order submission and email |
| **Admin CMS** | `src/pages/AdminPage.tsx`, `src/lib/admin/`, `functions/api/admin/` | Server-session CMS: password login, GitHub proxy, catalogue, image processing, browser-local persistence (`local.ts`), ZIP export (`zip.ts`) |
| **Static Build** | `scripts/postbuild.mjs`, `scripts/verify-build.mjs` | Prerenders HTML for each product, `_redirects`, sitemap |
| **Styles** | `src/styles.css`, `src/admin.css` | Design system, CSS logical properties for RTL, dark automotive aesthetic |

---

## 📜 Git History (most recent first)

```
48f5ba0 fix(admin): send a User-Agent header to the GitHub API
7f3bb53 feat(admin): deploy username/password login
55f91fe docs: keep local admin demo credentials out of the public repo
1021879 feat(admin): username/password login with server-side GitHub token
d3d69ae ci: deploy main to Cloudflare Pages on every push
30b36b2 copy: delivery page no longer calls the rates examples
ebfcf23 feat: apply real ZR Express delivery rates and open checkout
31fa262 feat: email orders, verified-rate guard, phone contact and bmg-oran deploy
e648451 docs: record Session 3 commit and clean tree
2625630 feat(admin): persist local mode and export ready-to-commit ZIP
d6a841e docs: update PROGRESS.md with full session 2 history and deployment guide
838119c feat(checkout): add dynamic commune/city selector for all 58 wilayas
9fcdb16 feat(admin): add local sandbox mode and footer administration link
82bd174 feat: complete storefront, admin cms, test suites and progress documentation
```

- **Branches**: `main` only (deployed by `.github/workflows/deploy.yml` on push and by direct
  `wrangler pages deploy`). The `admin-login` branch was merged in Session 9.
- **Remote**: `origin` = https://github.com/redx331/bmgoran (public repo: never commit private contact details or keys).
- **Git config** (local scope only): `user.name "BMG Oran Dev"`, `user.email "dev@bmg-oran.local"`
- **Working tree**: clean on `main` after Session 9.

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
  - Communes are included in the order email (e.g. `Wilaya: Oran (31) · Gdyel`).
- [x] Live subtotal, delivery quote, and total calculation.
- [x] **Safety guard**: Missing delivery rates block checkout explicitly; missing rates are never treated as 0 DZD.
- [x] Form validation: Name length, Algerian phone number syntax (`05/06/07...` or `+213...`), wilaya selection, delivery method selection.
- [x] Privacy notice: Explains that order details go to the shop through the host and a messaging service.

### 4. Email Order Pipeline
- [x] Checkout posts to `/api/order`; the customer stays on the site and gets a reference on success, or a retryable error on failure.
- [x] Server re-validates every field and takes price and delivery rate from the deployed catalogue, ignoring browser values.
- [x] Spam limits: honeypot field, same-origin check and body size limit. No CAPTCHA yet.
- [x] Secrets are Cloudflare environment variables: `RESEND_API_KEY`, `ORDER_EMAIL_TO`.

### 5. In-Browser Admin Panel (`/admin`)
- [x] Accessible at `/admin` (and via the discreet "Administration" footer link).
- [x] **Local Mode & GitHub Mode**:
  - **Local Mode (One-Click)**: Works without a GitHub token. Products, prices and uploaded photos are persisted in the browser (`localStorage` for the catalogue, IndexedDB for photos), restored on reload, and exportable as a **ready-to-commit ZIP** containing `src/data/products.json`, `public/images/products/*`, `public/og/*` and a French `LISEZ-MOI.txt`. A separate “Réinitialiser” action clears the local copy after confirmation.
  - **GitHub (server) Mode**: The browser logs in with a **username and password**. `functions/api/admin/login.ts` verifies the PBKDF2-SHA256 hash and issues a signed, `HttpOnly`, `SameSite=Strict` cookie (8 hours). `functions/api/admin/github.ts` injects `GITHUB_TOKEN` server-side, so the token never reaches the browser. Path allowlist: `src/data/products.json`, `public/images/products/*`, `public/og/*`. Throttle: 5 failed logins per IP per 10 minutes.
- [x] Loads catalogue directly from GitHub repository (or local fallback).
- [x] Create, edit, and delete products with auto-generated or custom slugs.
- [x] Price control in Algerian Dinars (DA) with validation.
- [x] Client-side image processing: automatic 1200×900 4:3 JPEG resizing and compression via HTML Canvas.
- [x] Automatic social OG card generator: draws a branded 1200×630 card with product name, price, brand mark, and image.
- [x] Atomic commits to GitHub default branch via GitHub Git Trees & Commits API (called from the server function).
- [x] Fully covered by unit and integration tests (`admin-catalogue.test.ts`, `admin-github.test.ts`, `admin-local.test.ts`, `admin-zip.test.ts`, `admin-page.test.tsx`, `admin-auth.test.ts`, `admin-functions.test.ts`).

### 6. Testing & Quality Assurance
- [x] **19 test files, 186 passing, 1 skipped** (static-build sentinel).
- [x] Unit tests for order math, validation, catalogue helpers, shipping lookup, GitHub API, admin password hashing/sessions and the admin endpoints.
- [x] Integration tests for storefront routing, deep links, checkout flow, commune selector, missing rate safety, and admin workflows (login, session restore, catalogue load, local persistence, ZIP export).
- [x] Strict TypeScript typing (`tsc --noEmit` clean).
- [x] Build passes clean: `npm run build` completes successfully.
- [x] Verify passes: `npm run verify` shows 2 expected warnings (demo contact details, demo products).

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

### Session 4 (AI — 2026-11-01)

1. **Deployed**: code pushed to `redx331/bmgoran`, live on Cloudflare Pages at https://bmgoran.pages.dev. Use the Pages flow, not "Create Worker".
2. **Email orders**: new `functions/api/order.ts` + `submitOrder()` in `src/lib/order.ts`. WhatsApp links, config fields, icon, CSS and copy removed in FR and AR.
3. **Contact details hidden**: `whatsappNumber` and `email` removed from config. Phone is hidden until `phoneHref` is set.
4. **Tests**: new `order-function.test.ts`; checkout tests rewritten. Function also exercised in `wrangler pages dev` with a fake key (422 on bad order, 502 on rejected email). Real email delivery not tested yet.

### Session 5 (AI — 2026-11-02)

1. **Phone published**: `+213 673 45 77 12` (`tel:+213673457712`) is now in `site.config.json` and appears on the Contact page and in the footer in both languages. The shop address is still a placeholder, so `demoContact` stays `true`.
2. **Example rates cannot take orders anymore**:
   - New `isExampleShipping()` in `src/lib/shipping.ts`.
   - `validateOrderFields()` returns `validation.rateNotVerified`; checkout disables the submit button and labels it “Commande indisponible”.
   - `functions/api/order.ts` returns **409 `rates-not-verified`** before sending any email.
   - New test file `order-function-example-rates.test.ts`; suite is now **16 files, 164 passed + 1 skipped**.
3. **Deployed to https://bmg-oran.pages.dev** (Cloudflare project `bmg-oran`, account `taguinekossai@gmail.com`). The old `bmgoran.pages.dev` is still online but belongs to another Cloudflare account — the API answers “Project not found” — so it cannot be updated from this machine. `siteUrl` was updated to the new domain.
4. **Order inbox chosen**: the owner’s inbox (kept out of this public repo; set it as `ORDER_EMAIL_TO` in Cloudflare). The code still needs `RESEND_API_KEY` + `ORDER_EMAIL_TO` on the Pages project; until then `/api/order` returns 503 and no email is sent.
5. **Hygiene**: `.dev.vars` and `.dev.vars.*` added to `.gitignore`.

### Session 6 (AI — 2026-11-02)

1. **Real ZR Express rates entered** in `src/config/shipping.ts` from the owner’s grid (departure Oran, W31) and `SHIPPING_RATES_ARE_EXAMPLES` set to `false`.
   - `homeDeliveryPrice` = ZR “TARIF”, `deskDeliveryPrice` = ZR “STOP DESK”; `/` → `null`.
   - Matched **by wilaya name**, because the sheet’s numbering diverges from official codes from row 49 (sheet 54 = Timimoun = official 49).
   - Not served (missing from the sheet) → `null`: Illizi (33), Tindouf (37), Bordj Badji Mokhtar (50), Djanet (56).
   - ZR “ANNULE RETOUR” is not modelled.
   - Spot checks: Oran 800/450, Alger 400/300, Béjaïa home 800 + desk `null`, Adrar 1300/900.
2. **Tests updated for real rates**: `shipping.test.ts`, `checkout.test.tsx`, `storefront.test.tsx`, `order-function.test.ts` (Alger total now 7 400). New `checkout-example-rates.test.tsx` keeps UI coverage of example mode; `order-function-example-rates.test.ts` now mocks the flag to `true` to keep testing the 409 guard. Suite: **17 files, 165 passed + 1 skipped**.
3. **Redeployed to https://bmg-oran.pages.dev** and verified in the live browser:
   - Oran: home 800 → total 4 300, desk 450 → total 3 950; button “Passer la commande” enabled, no example badge/notice.
   - Illizi home and Béjaïa desk: “Non configuré”, button “Commande indisponible”, no `0` fallback.
   - `/api/order` with a valid Oran payload now returns **503 `not-configured`** (the rate guard passes; only Resend is missing).
4. **Superseded in Session 7**: Resend is now configured.

### Session 7 (AI — 2026-11-02)

1. **Email orders live**: the owner added `RESEND_API_KEY` and `ORDER_EMAIL_TO` as Production secrets on `bmg-oran`; site redeployed with `wrangler pages deploy`.
2. **Verified**: a direct POST to the live `/api/order` returned 200 and the owner confirmed the email arrived. The form was not clicked through in a browser for this test.
3. **Auto-deploy**: `.github/workflows/deploy.yml` builds, tests and deploys `main` to `bmg-oran` on every push, including admin saves. `bmg-oran` has no Git connection, so this workflow is what publishes changes. Needs GitHub secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

### Session 8 (AI — 2026-11-03)

Built a **username/password admin login** so the owner no longer pastes a GitHub token. **Not deployed on purpose** — it waits for the owner's local test.

1. **Server auth** — new `functions/lib/admin-auth.ts`:
   - `ADMIN_PASSWORD_HASH` format `pbkdf2-sha256$<iterations>$<saltB64>$<hashB64>` (100k iterations, Web Crypto); the iteration count is stored, so it can be lowered if Cloudflare's free-plan CPU limit complains.
   - Session = HMAC-SHA256-signed payload `{ username, expiresAt }`, 8 hours.
   - Cookie `bmg_admin`: `Path=/api/admin`, `HttpOnly`, `SameSite=Strict`, `Secure` only on HTTPS (so `http://localhost` works).
   - Same-origin check on every `/api/admin/*` call; in-memory throttle of 5 failed logins per IP per 10 minutes.
2. **Endpoints** — new `functions/api/admin/`: `login.ts`, `logout.ts`, `session.ts`, `github.ts`.
   - `github.ts` is the only place `GITHUB_TOKEN` is used: `action: 'catalogue'` and `action: 'commit'` (base64 changes, max 40 files).
   - Path allowlist: `src/data/products.json`, `public/images/products/*`, `public/og/*`; traversal rejected before any GitHub call.
3. **Client** — new `src/lib/admin/api.ts`; `AdminPage.tsx` now shows username + password, restores the session on mount via `GET /api/admin/session`, and no longer stores a token anywhere (the old `sessionStorage` keys are gone).
4. **Tooling** — `scripts/hash-admin-password.mjs` prints the hash + session secret; `.dev.vars.example` documents the variables; `.dev.vars` (gitignored) holds the local-only demo credentials; `docs/DEPLOYMENT.md` gained an “Admin login setup” section.
5. **Tests** — new `admin-auth.test.ts`, `admin-functions.test.ts`; `admin-page.test.tsx` rewritten for the server session. **19 files, 186 passed + 1 skipped**; typecheck clean.
6. **Local test** — `npm run build` then `npx wrangler pages dev dist --port 8788` → http://localhost:8788/admin.
   - Credentials are in the gitignored `.dev.vars` (do not commit them; use different secrets in production).
   - Verified in Chromium (Session 8): login 200, dashboard opens, cookie `bmg_admin` is `HttpOnly` (invisible to `document.cookie`), session survives a reload, logout returns 204 and the form comes back.
   - Without `GITHUB_TOKEN` in `.dev.vars`, the login still succeeds; the dashboard shows “Connexion réussie, mais le catalogue n’a pas pu être chargé…” instead of pretending the password was wrong.

### Session 9 (AI — 2026-11-03)

The owner approved the login and asked to deploy.

1. **Production secrets set on `bmg-oran`**: `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`, `GITHUB_TOKEN`. `GITHUB_REPOSITORY` / `GITHUB_BRANCH` still default to `site.config.json` (`redx331/bmgoran`, `main`).
2. **First deploy failed on the catalogue** with `502 github-auth`. Cause: the GitHub REST API answers **403 for any request without a `User-Agent`**, and a Workers `fetch` sends none (the old browser-based client always did). Fixed in `src/lib/admin/github.ts` (`User-Agent: bmg-oran-admin`), with a regression assertion in `admin-github.test.ts`.
3. **Deployed**: `wrangler pages deploy dist --project-name bmg-oran --branch main`, then `main` pushed to GitHub.
4. **Verified live** at https://bmg-oran.pages.dev/admin: login 200 → session 200 (`githubConfigured: true`) → catalogue 200 with 8 products → logout 204. Also verified in Chromium: `/admin` shows the 8 products and no error.
5. **Admin password is short** (`akuma`). Login is throttled (5 tries / 10 min / IP), but a stronger password is advisable: regenerate the hash, update `ADMIN_PASSWORD_HASH`, redeploy.
6. **Token hygiene**: the GitHub token was shared in chat during setup; rotate it if it may have been exposed, then update `GITHUB_TOKEN`.

### Session 10 (AI — 2026-11-04)

The owner reported that he could not delete existing products, and that products he added took a long time and never appeared.

1. **Root cause**: the production `GITHUB_TOKEN` was a fine-grained token with **read-only** Contents. Reads worked (the catalogue loaded), but every write failed at the first blob upload: `403 Resource not accessible by personal access token`, with `x-accepted-github-permissions: contents=write`. On an add, the browser had already resized and uploaded the photos before the failure — hence the long wait and the missing product.
2. **Fail-fast guard**: `/api/admin/session` now returns `canWrite` from `checkWriteAccess()` — a harmless probe that creates an unreferenced blob (no commit, no ref). `/admin` shows a red “jeton en lecture seule” banner and blocks save/delete **before** any upload. Tests: **190 passed + 1 skipped**.
3. **Token replaced**: a classic token with the `repo` scope (the simplest reliable route; a fine-grained token with “Contents: Read and write” also works). Uploaded with `wrangler pages secret put GITHUB_TOKEN --project-name bmg-oran`, rebuilt and redeployed (`38797c98`).
4. **Verified live end-to-end** through the admin proxy: add commit `5dd2bc8` (test product present on GitHub) → delete/restore commit `2619871` (file byte-identical to the original, `cbb142f`), 8 products, workflow `completed/success`, and `sitemap.xml` still lists exactly 8 product URLs with no test product.
5. **Still to do**: revoke the two old read-only fine-grained tokens (both were pasted in chat), and consider a longer admin password than `akuma`.

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

### 1. Pre-Launch Configuration (requires user input)
- [x] Resend configured on the **bmg-oran** Pages project; live test order ORD-2026-E3529B53 reached the owner’s inbox.
- [x] **Admin login deployed** (Session 9): `/admin` asks for a username and password. Production secrets `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`, `GITHUB_TOKEN` are set on `bmg-oran`; login, catalogue read and logout verified live.
- [x] **Write-capable GitHub token** (Session 10): classic `repo` token uploaded; add/delete verified live through the admin proxy.
- [ ] Revoke the two old read-only fine-grained tokens (both were pasted in chat).
- [ ] Change the admin password to something longer than `akuma` (regenerate `ADMIN_PASSWORD_HASH` and redeploy).
- [ ] Add a Cloudflare rate-limiting rule on `/api/order` and `/api/admin/login`, or Turnstile if spam appears.
- [ ] Set real address and social links in `site.config.json`, then switch `demoContact` to `false` (phone is already real).

### 2. Shipping Rates (ZR Express — done, pending confirmation)
- [x] Courier chosen: **ZR Express**, departure Oran (W31).
- [x] Rates entered in `src/config/shipping.ts`; `SHIPPING_RATES_ARE_EXAMPLES = false`; unserved wilayas are `null`.
- [ ] Optional: the owner should re-check the grid against their ZR merchant portal when prices change (ZR’s public calculator API returns 404 for every corridor, so it cannot be automated).
- [ ] Optional: enter ZR “ANNULE RETOUR” handling if the shop decides to pass return fees on.

### 3. Product Catalogue & Assets
- [ ] Add real initial products to `src/data/products.json` (or use `/admin` once deployed).
- [ ] Replace demo SVG product images in `public/images/products/` with real photos.
- [ ] Run `npm run og` to regenerate high-resolution social sharing cards.

### 5. Optional Feature Enhancements
- [ ] **Multi-item shopping cart** — Currently the checkout only handles one product at a time with a quantity stepper. Adding a cart would let customers order multiple different parts at once.
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
4. **Tests must pass** — Run `npm test` after every code change; all tests must pass (currently 186 passed + 1 skipped).
5. **Build must be clean** — Run `npm run build` (includes `tsc --noEmit`) to verify TypeScript and static generation.
6. **Minimal backend** — The server only holds `functions/api/order.ts` (email) and the small `functions/api/admin/*` auth/proxy endpoints. No database. Keep everything else static.
7. **Admin panel is French-only** — The admin area (`src/admin.css`, `AdminPage.tsx`) is intentionally LTR/French only.
8. **Never treat missing shipping rates as free** — A `null` rate blocks checkout; this is a safety invariant tested explicitly. Example rates also block orders (`409 rates-not-verified`).
9. **The GitHub token never reaches the browser** — Admin commits go through `/api/admin/github`, which reads `GITHUB_TOKEN` from the environment. Do not reintroduce token entry in the UI.
10. **Always send a `User-Agent` to the GitHub API** — Workers `fetch` sends none and GitHub answers 403; the shared client sets `bmg-oran-admin`.
11. **User's OS**: Windows. Shell: PowerShell. Use `;` to chain commands (not `&&`). Path style: backslash in Windows commands, forward slash in code.

---

## 🐛 Known Issues & Gotchas

1. **LF/CRLF warnings on Windows**: Every `git add` produces CRLF warnings. These are harmless and can be ignored (or silenced with `git config core.autocrlf true`).
2. **`npm run verify` shows 2 warnings**: Expected placeholder warnings for demo contact details and demo products. They disappear once real values are set.
3. **`edit_file` precision**: When using edit_file, always read the actual file content first. Target strings must match exactly including whitespace — don't guess.
4. **Two Pages projects exist**: `bmgoran.pages.dev` is live but belongs to a different Cloudflare account (“Project not found” from the logged-in account). Deployments from this machine go to **`bmg-oran.pages.dev`** (project `bmg-oran`).
5. **Admin session cookie path**: it is scoped to `Path=/api/admin`, so `/admin` (the static page) cannot read it. The UI learns the session by calling `GET /api/admin/session`; do not expect a cookie during page rendering.
6. **PBKDF2 cost**: 100k iterations is near the Cloudflare free-plan CPU budget. The iteration count is embedded in `ADMIN_PASSWORD_HASH`, so regenerate with fewer iterations (minimum 10 000 in the script) if logins hit CPU limits.

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
8. The admin panel is at `/admin`. Server mode now uses a username/password session (GitHub token stays in Cloudflare env); local mode persists catalogue edits in `localStorage`, photos in IndexedDB, and exports a ready-to-commit ZIP.
9. **Keep this `PROGRESS.md` updated** with any newly completed features, architectural changes, or pending tasks.
