# Deployment — GitHub + Cloudflare Pages

The storefront is static: Cloudflare Pages serves the `dist/` folder from its CDN. One Pages
Function, `functions/api/order.ts`, emails orders through Resend. There is no database. The free plan is enough for a shop of
this size (check Cloudflare's current limits before relying on exact numbers).

---

## Before you deploy

1. **Replace the placeholders** — at minimum `site.config.json` (business name,
   phone, e-mail, address, opening hours) and the `siteUrl`. See the
   [launch checklist](LAUNCH-CHECKLIST.md).
2. **Confirm the build is green locally:**
   ```bash
   npm install
   npm test
   npm run build
   npm run verify
   ```
   `verify` must end with “Build structure looks correct”. Remaining warnings are the
   placeholders you still have to replace.
3. **Check the production build locally:**
   ```bash
   npm run preview   # http://localhost:4173
   ```
   Open a product URL directly (e.g. `/product/led-headlights`), reload it, switch to Arabic,
   and complete a test order up to the validation errors. `npm run preview` has no `/api/order`, so a real
   submission only works once deployed.

---

## 1. Put the project on GitHub

The project is not a Git repository yet. From `autoparts-store/`:

```bash
git init
git add .
git commit -m "Initial storefront"
git branch -M main
```

Create an empty repository on GitHub (no README, no .gitignore — both already exist here),
then:

```bash
git remote add origin https://github.com/<your-account>/<your-repo>.git
git push -u origin main
```

`.gitignore` already excludes `node_modules/`, `dist/` and `.tmp/`, so only sources, images
and docs are committed.

> A **private** repository works fine with Cloudflare Pages. The site itself is public.

---

## 2. Connect Cloudflare Pages

1. Sign in to <https://dash.cloudflare.com> → **Workers & Pages** → **Create** →
   **Pages** → **Connect to Git**.
2. Authorise GitHub and select the repository.
3. Use these build settings exactly:

   | Setting | Value |
   | --- | --- |
   | Production branch | `main` |
   | Framework preset | **None** |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Root directory | *(leave empty — repository root)* |

4. Add an environment variable (Production **and** Preview):

   | Variable | Value |
   | --- | --- |
   | `NODE_VERSION` | `22` |

   Vite 8 needs a modern Node; Node 22 is what this project was built and tested with
   (22.23.2). Do not pin an old Node 16/18 image.

5. **Save and Deploy**. The first build takes a couple of minutes. You get a URL like
   `https://<project>.pages.dev`.

`npm run build` runs `tsc --noEmit`, the Vite build, then `scripts/postbuild.mjs`, which adds
the per-product HTML files, `_redirects`, `sitemap.xml` and `robots.txt` to `dist/`.
Nothing else is required.

---

## Order email setup

Orders fail with a visible error until both variables below are set.

1. Create an account at <https://resend.com> using the inbox that should receive orders.
2. Create an API key with sending access.
3. In Cloudflare: **Workers & Pages → your project → Settings → Variables and Secrets**. Add, for
   Production:

   | Variable | Type | Value |
   | --- | --- | --- |
   | `RESEND_API_KEY` | Secret | The Resend API key |
   | `ORDER_EMAIL_TO` | Secret | The same inbox as the Resend account |

4. Redeploy, because variable changes only apply to new deployments.
5. Place a test order and check the inbox, including spam.

The default sender `onboarding@resend.dev` only delivers to the Resend account's own address. To
send to another address, verify a domain in Resend and change `EMAIL_FROM` in the function.

Never commit these values: the repository is public.

---

## 3. Set the real URL

Canonical links, Open Graph images and the sitemap are generated from
`site.config.json` → `siteUrl`.

1. Open `site.config.json` and set:
   ```json
   "siteUrl": "https://<project>.pages.dev"
   ```
   (or your custom domain, see below — no trailing slash needed).
2. Commit and push:
   ```bash
   git add site.config.json
   git commit -m "Set production site URL"
   git push
   ```
3. Cloudflare rebuilds automatically. Verify that
   `https://<your-domain>/product/led-headlights` has the right `<link rel="canonical">`
   and `og:image` (view source, or use a social preview debugger).

If you skip this step, sharing previews and canonical URLs still point at
`https://YOUR-PROJECT.pages.dev`, and `npm run verify` warns about it.

---

## 4. Custom domain (optional)

1. In the Pages project → **Custom domains** → **Set up a custom domain**.
2. Enter the domain (e.g. `bmg-oran.dz` or `www.bmg-oran.dz`).
3. If the domain is on Cloudflare, DNS is created automatically. Otherwise add the CNAME/A
   records Cloudflare shows at your registrar.
4. Wait for the certificate to be issued (usually minutes), then update `siteUrl` to the
   custom domain and push again.

Pick **one** canonical host (`https://www.example.com` or `https://example.com`) and use it
everywhere; the other should redirect to it.

---

## 5. Deep links, refresh and SPA fallback

Two mechanisms work together:

- **Static product pages**: the build writes `dist/product/<slug>/index.html` for every product,
  so `/product/led-headlights` is a real file with its own meta tags — no JavaScript needed
  for crawlers to see the title, description and image.
- **SPA fallback**: `dist/_redirects` contains a per-product rewrite followed by a catch-all
  `/* /index.html 200`, so `/shop`, `/checkout/...`, `/delivery` and unknown paths load the app
  instead of a 404.

Cloudflare Pages reads `_redirects` automatically. **Do not delete it** and do not replace the
catch-all with a 404 rule, or direct links and refreshes will break.

The same `_redirects` file is what makes `/product/<slug>` keep its own meta tags: the rewrite
serves the static file rather than the SPA shell.

---

## 6. Caching, headers and security

`public/_headers` is copied to `dist/_headers` and applied by Cloudflare Pages:

- `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`,
  restrictive `Permissions-Policy`
- a Content-Security-Policy that only allows same-origin scripts, styles, images and
  connections
- long-lived immutable caching for `/assets/*`, 30 days for `/images/*`, 1 day for `/og/*`,
  and `must-revalidate` for `index.html`

If you later add analytics, a map embed, external fonts or images from another domain, you
**must** extend the CSP (`script-src`, `img-src`, `connect-src`, …) or the browser will block
them. The current policy intentionally allows nothing external.

Never put private keys,
passwords or customer data in this repository.

---

## 7. Updating the shop after launch

All content is in the repository; every push to `main` triggers a new deployment.

| Change | Edit | Then |
| --- | --- | --- |
| Product, price, stock, photos | `src/data/products.json`, `public/images/products/` | `npm run build`, `npm test`, commit, push |
| Delivery rates | `src/config/shipping.ts` | same |
| Phone, address, hours | `site.config.json` | same |
| Interface wording / translations | `src/i18n/translations.ts` | same |
| Business name in page titles | `site.config.json` (rebuild regenerates meta) | same |

Local check before pushing:

```bash
npm test
npm run build
npm run verify
npm run preview
```

### Rollback

Pages → your project → **Deployments** → pick a previous successful deployment →
**Rollback**. This is instant and does not require a new commit.

### Preview deployments

Every branch/PR gets its own preview URL. Use it to check a price change or a new product
before merging to `main`. Preview URLs are public unless you enable Cloudflare Access.

---

## 8. Optional: deploy without GitHub (Wrangler)

If you prefer uploading the build directly:

```bash
npm run build
npx wrangler pages deploy dist --project-name <project-name>
```

This requires a Cloudflare login/token and does **not** set up automatic deployments on push.
The GitHub integration above is recommended for a shop that will be updated regularly.

---

## 9. Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `/product/...` shows “not found” on refresh | `_redirects` missing from `dist/`. Run `npm run build`; confirm `dist/_redirects` exists and starts with the product rewrites |
| All deep links 404 | Build output directory is not `dist`, or the SPA catch-all line was removed |
| Build fails on `tsc` | Run `npm run typecheck` locally and fix; the build refuses to ship type errors |
| Build fails on Node version | Set `NODE_VERSION=22` in Pages environment variables and redeploy |
| Images missing only in production | File name case mismatch (Linux is case-sensitive) or the file is not inside `public/` |
| Old title/image in Facebook/WhatsApp preview | The platform cached the old page. Re-scrape in the platform's debugger after redeploying with the correct `siteUrl` |
| Demo banner still visible | `isDemo` flags / `SHIPPING_RATES_ARE_EXAMPLES` / placeholder business data are still set — see the launch checklist |
| “La commande n’a pas pu être envoyée” | Check `RESEND_API_KEY` and `ORDER_EMAIL_TO`, redeploy, then read the function logs in Cloudflare |
| Shipping shows “exemple” | `SHIPPING_RATES_ARE_EXAMPLES` is still `true` |
| Checkout blocked for one wilaya | That wilaya/method has `null` in `src/config/shipping.ts` |
| Styles look unstyled after deploy | `dist/assets/*` not uploaded, or a CSP rule blocks the stylesheet (should not happen with the default policy) |

---

## 10. What is intentionally not deployed

- No database or customer accounts.
- No order storage: the order exists only in the shop's inbox.
- No analytics, cookies or tracking pixels.
- No payment integration.

If the shop later needs stock sync, order history or payments, that is a new backend project —
this storefront is designed to stay static and free to host.
