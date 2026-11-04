# BMG Oran — bilingual storefront for an Algerian parts shop

A static, mobile-first storefront in **French (LTR)** and **Arabic (RTL)** for a car and
motorcycle parts shop in Algeria. Customers browse the catalogue, open a permanent product
URL, choose a wilaya and a delivery method, see the exact total, and send the finished order
to the shop by **email**.

No database and no customer accounts. Small Cloudflare functions email the orders and check the
admin password. The whole site is static files that can be hosted for free on Cloudflare Pages.

---

## ⚠️ This build is a demo — read this first

Everything below is **placeholder content**, not verified business information:

| Item | Current state |
| --- | --- |
| Address, opening hours | Demo values |
| Order email | Configured — Resend secrets are set on the `bmg-oran` Pages project and a real test order arrived |
| Products, prices, part numbers, specs | 8 fictional demo products, marked “démo” in the UI |
| Product photos | Generated SVG placeholders, not real photos |
| Delivery rates (all 58 wilayas) | Real ZR Express grid (departure Oran); wilayas ZR does not serve block checkout |
| Product compatibility | Not claimed anywhere (`verified: false`, no vehicle list) |
| Site URL | `https://YOUR-PROJECT.pages.dev` placeholder |

The interface still shows a demo banner and marks demo products and prices, so nothing here can
be mistaken for a real quote. Replace the data before launch — see
[`docs/LAUNCH-CHECKLIST.md`](docs/LAUNCH-CHECKLIST.md).

---

## What works today

- **Home page** with hero, categories, featured products and a 3-step “how to order” section.
- **Shop page** with text search (product name, part number, brand, keywords) and category filters,
  all reflected in the URL (`/shop?q=…&category=…`).
- **Product pages** at permanent URLs such as `/product/led-headlights`, with gallery,
  price, description, specs, part number, stock state, quantity stepper and Buy Now.
- **Direct links and refreshes work**: the build generates a static HTML file per product with
  its own `<title>`, description, canonical and Open Graph tags, plus an SPA fallback.
- **Checkout** (`/checkout/<slug>?qty=N`): guest form (first name, last name, phone, wilaya,
  delivery method), inline validation in the active language, live subtotal / shipping / total.
- **All 58 wilayas**, each with separate home-delivery and desk-delivery prices.
  A missing rate blocks the order instead of silently becoming `0`.
- **Email orders**: the customer submits the form on the site, and the server recalculates the
  price and emails reference, product, quantity, totals and customer details to the shop.
- **Language switch** (FR / AR) persisted in `localStorage`, with `<html lang>`/`dir` updated,
  RTL layout using CSS logical properties, and no horizontal overflow at 390 px.
- **Accessibility**: Lighthouse 1.00 on the home, product, checkout and delivery pages
  (accessibility, best practices and SEO), keyboard-visible focus, reduced-motion support,
  labelled controls and live regions.
- **Small footprint**: ~343 kB JS (≈100 kB gzip) and ~60 kB CSS (≈10 kB gzip), no web fonts,
  no tracking scripts, no third-party requests.

---

## Requirements

- Node.js 20 or newer (built and tested on Node 22)
- npm

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

Production build and local preview:

```bash
npm run build      # typecheck + Vite build + static pages/OG/redirects/sitemap
npm run preview    # http://localhost:4173
npm test           # Vitest + Testing Library (run build first for the static-build suite)
npm run verify     # checks the dist/ output and lists remaining placeholders
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck, bundle, then generate product pages, `_redirects`, sitemap, robots |
| `npm run preview` | Serve the production build on port 4173 |
| `npm test` / `npm run test:watch` | Test suite (unit + rendered app + static build) |
| `npm run typecheck` | TypeScript only |
| `npm run verify` | Structural/SEO/image audit of `dist/` + placeholder warnings |
| `npm run images` | Regenerate the demo SVG product images |
| `npm run og` | Regenerate 1200×630 social images (needs local Chrome/Edge) |

---

## Tests

`npm test` runs 19 suites (186 passing, 1 skipped) against the real application rendered at URLs,
plus assertions on the production build in `dist/`:

- product URLs, generated static pages, Open Graph tags, `_redirects`, sitemap and robots
- search, category filters, quantity / wilaya / delivery-method changes and live totals
- missing shipping rates blocking checkout with an explanation
- field validation (names, Algerian/international phone, wilaya, method, quantity)
- unavailable products not being orderable
- order function validation, price recalculation and email content
- French LTR and Arabic RTL rendering, plus persisted language choice
- demo disclosures (banner, demo products and prices)
- admin login: password hashing, signed sessions, cookie flags, throttling, and the GitHub proxy
  (no token in the browser, path allowlist)

Run `npm run build` before `npm test` so the static-build assertions inspect the current
`dist/`. One sentinel test is intentionally skipped while `dist/` exists.

---

## What to configure before launch

| File | What it controls |
| --- | --- |
| `site.config.json` | Business name (FR/AR), brand initials, deployed URL, phone, address, opening hours, social links, `demoContact` flag |
| `src/config/shipping.ts` | The 58 wilayas, both delivery prices, and `SHIPPING_RATES_ARE_EXAMPLES` |
| `src/data/products.json` | The entire catalogue (texts, prices, specs, images, stock, part numbers) |
| `src/data/categories.ts` | The 4 category names, descriptions and icons |
| `src/i18n/translations.ts` | Every French and Arabic interface string |
| `public/images/products/`, `public/og/` | Real product photos and social images |
| `index.html` | Base title/description used by the SPA shell |
| Cloudflare env vars | `RESEND_API_KEY`, `ORDER_EMAIL_TO` for orders; `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`, `GITHUB_TOKEN` for the admin |

Detailed guides:

- [`docs/PRODUCTS.md`](docs/PRODUCTS.md) — catalogue schema, photos, part numbers, compatibility rules
- [`docs/SHIPPING.md`](docs/SHIPPING.md) — wilaya rates, `null` semantics, delivery methods
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — GitHub + Cloudflare Pages, build settings, custom domain
- [`docs/LAUNCH-CHECKLIST.md`](docs/LAUNCH-CHECKLIST.md) — placeholder list and go-live checks

---

## How ordering works

1. Customer picks a product and a quantity, then opens the checkout page.
2. They enter name, phone, wilaya and delivery method. The page validates each field and
   recalculates shipping and total on every change.
3. “Passer la commande” posts the order to `/api/order`.
4. The function validates it and emails the shop. The customer sees a reference, and the shop calls
   to confirm.

Important consequences, also stated in the UI:

- **Orders are not stored anywhere.** There is no dashboard, no order history and no
  confirmation e-mail to the customer. The shop's inbox is the order record.
- **The order reference** (for example `ORD-2026-0001-K7Q`) is generated per browser session
  to make a conversation easy to find. It is **not** a globally unique order number.
- **Personal data** goes to the shop by email, through Cloudflare and Resend; the site stores only the
  chosen language and the session order counter. The checkout shows a short privacy notice.
- If the email cannot be sent, the customer sees an error and can retry. Success is never faked.
- If the selected wilaya/method has no rate, checkout is blocked with a clear message.

---

## Project structure

```
autoparts-store/
├─ index.html                 SPA shell (base meta tags)
├─ site.config.json           Business / contact configuration
├─ public/
│  ├─ images/products/        Product images (SVG placeholders today)
│  ├─ og/                     Social sharing images (1200×630 PNG)
│  ├─ _headers                Security + cache headers for Cloudflare Pages
│  ├─ locale-init.js          Sets lang/dir before first paint (no language flash)
│  └─ favicon.svg
├─ scripts/
│  ├─ postbuild.mjs           Static product pages, OG tags, _redirects, sitemap, robots
│  ├─ verify-build.mjs        Post-build audit + placeholder warnings
│  ├─ generate-demo-images.mjs
│  └─ generate-og.mjs
├─ src/
│  ├─ components/             Header, footer, product card, gallery, quantity stepper, …
│  ├─ config/                 business.ts (site config), shipping.ts (58 wilayas)
│  ├─ data/                   products.json + typed helpers, categories
│  ├─ i18n/                   I18nProvider + FR/AR dictionaries
│  ├─ lib/                    router, seo, order math/validation/message, shipping quote
│  ├─ pages/                  Home, Shop, Product, Checkout, Delivery, Contact, 404
│  ├─ test/                   Setup, render helper, 14 test suites
│  └─ styles.css              Design system, responsive and RTL rules
└─ docs/                      Product, shipping, deployment and launch documentation
```

The UI never contains hard-coded product data: pages read from `src/data/products.json`
through `src/data/products.ts`, and the build script reads the same JSON to generate the
static product pages.

---

## Admin (`/admin`)

A static, French-only CMS with two modes:

- **Server mode** — sign in with a **username and password**. Credentials are checked in
  `functions/api/admin/login.ts` against `ADMIN_USERNAME` and a PBKDF2-SHA256 hash
  (`ADMIN_PASSWORD_HASH`); the session is a signed, `HttpOnly`, `SameSite=Strict` cookie valid for
  8 hours. The GitHub token stays in the server environment (`GITHUB_TOKEN`) and is never sent to
  the browser, which talks only to `/api/admin/*`. Products, photos and OG images are saved as one
  commit; Cloudflare redeploys automatically.
- **Local mode** — no account needed. Edits are stored in the browser (`localStorage` for the
  catalogue, IndexedDB for photos), restored on reload, and exported as a ZIP containing
  `src/data/products.json`, `public/images/products/*`, `public/og/*` and `LISEZ-MOI.txt`.
  Extract it at the project root and commit.

Server mode needs `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET` and
`GITHUB_TOKEN` set in Cloudflare (Production). Generate the hash with
`node scripts/hash-admin-password.mjs "votre-mot-de-passe"`; full steps in
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md#admin-login-setup).

---

## Deployment (short version)

Cloudflare Pages, free plan:

| Setting | Value |
| --- | --- |
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | `22` (set `NODE_VERSION=22` if the default differs) |

Push the project to GitHub, connect the repository in Cloudflare Pages, deploy, then put the
real domain in `site.config.json` → `siteUrl` and deploy again so canonical, Open Graph and
sitemap URLs are correct. Full steps, custom domain notes and troubleshooting:
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

---

## Intentionally out of scope

- No payment processing, no cart across devices, no customer accounts.
- No stock synchronisation. The catalogue is edited with `/admin` (GitHub commit or local ZIP
  export) or directly in `products.json`.
- No analytics or advertising pixels (nothing loads from third parties).
- No automatic order storage; the shop's inbox is the system of record.

---

Private project — replace all demo content before publishing.
