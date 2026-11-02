# Launch checklist

The storefront is built and tested, but it ships with **demo content**. Nothing below is
optional if you want customers to see a truthful shop.

> Run `npm run verify` at the end: every warning it prints must be gone before launch.

---

## 0. What the tests do **not** prove

The automated tests verify behaviour (URLs, totals, validation, encoding, RTL, build output).
They cannot verify:

- that your delivery prices match your courier's contract;
- that the order inbox belongs to the shop and is checked;
- that product photos, part numbers, specs and compatibility are correct;
- that your business name, address and opening hours are real;
- that the shop is legally compliant in your situation.

Those are business decisions and must be checked by a human.

---

## 1. Replace every placeholder

| File | Field | Current placeholder | Replace with |
| --- | --- | --- | --- |
| `site.config.json` | `businessName` | `BMG Oran` | Confirm the exact spelling (already set) |
| `site.config.json` | `businessNameAr` | `بي إم جي وهران` | Confirm the Arabic spelling (already set) |
| `site.config.json` | `brandMark` | `BMG` | 1–3 letters for the logo mark |
| `site.config.json` | `demoContact` | `true` | `false` once the contact details are real |
| `site.config.json` | `siteUrl` | `https://bmg-oran.pages.dev` | Real deployed URL / custom domain |
| `site.config.json` | `phoneDisplay` | `+213 673 45 77 12` | Real phone as displayed (done) |
| `site.config.json` | `phoneHref` | `tel:+213673457712` | Click-to-call target (done) |
| `site.config.json` | `addressFr` / `addressAr` | “Adresse … à remplacer” | Real address in both languages |
| `site.config.json` | `cityFr` / `cityAr` | Oran / وهران | Real city (done) |
| `site.config.json` | `openingHoursFr` / `openingHoursAr` | Demo hours | Real hours |
| `site.config.json` | `facebookUrl` / `instagramUrl` | *(empty)* | Real pages, or leave empty to hide them |
| `src/config/shipping.ts` | all 58 × 2 prices | ZR Express rates (done) | Re-check when ZR changes its grid |
| `src/config/shipping.ts` | `SHIPPING_RATES_ARE_EXAMPLES` | `false` | Keep `false` unless the grid is not confirmed |
| `src/data/products.json` | every product | 8 demo products, `isDemo: true` | Real catalogue, `isDemo: false` |
| `src/data/products.json` | `partNumber` | `DEMO-…` | Real references, or remove the field |
| `public/images/products/` | all files | Generated SVG placeholders | Real photos (1200×900, WebP/JPEG) |
| `public/og/` | all files | Demo social images | Regenerate with `npm run og` |
| `public/favicon.svg` | logo | `AP` demo mark | Your mark, or keep a neutral one |
| `index.html` | base title/description | Generic demo copy | Adjust if needed (product pages are generated) |

The **demo banner and the footer notice hide automatically** once no product has
`isDemo: true` and `SHIPPING_RATES_ARE_EXAMPLES` is `false`. If you still see them after
launch, one of those is still set.

---

## 2. Business identity

- [ ] Shop name, phone, e-mail and address are correct in **both** French and Arabic.
- [ ] Opening hours are accurate (and match what you tell customers).
- [ ] Social links work, or are left empty (empty links are hidden, not broken).
- [ ] Address is precise enough for a courier to find you.
- [ ] `demoContact` is set to `false` in `site.config.json` (removes the “demo contact details” note).
- [ ] Someone is responsible for checking orders and calling customers during opening hours.

---

## 3. Email ordering

- [ ] `RESEND_API_KEY` and `ORDER_EMAIL_TO` are set in Cloudflare (see `docs/DEPLOYMENT.md`).
- [ ] A real test order reached the inbox with the right product, price and customer details.
- [ ] You know that **orders are not saved by the site** — the email is the record.
- [ ] You have a habit of labelling order emails (e.g. “Commande – à préparer”).

---

## 4. Delivery rates

- [ ] You have your courier's real grid (zones or per-wilaya prices) for **home** and **desk**.
- [ ] All 58 wilayas you serve have a real price for each method you offer.
- [ ] Wilayas you do **not** serve have `null` for both methods.
- [ ] No price is left as an example; `SHIPPING_RATES_ARE_EXAMPLES = false`.
- [ ] You decided whether shipping is flat per order (current model) or should depend on
      weight/quantity — if the latter, the code and tests must change.
- [ ] You checked the **delivery page** and three checkout cases:
      a served wilaya (home + desk), a `null` wilaya (blocked with a clear message), and a
      quantity change (total recalculates).
- [ ] Free delivery (if any) is entered as `0`, not `null`.

See [`SHIPPING.md`](SHIPPING.md).

---

## 5. Catalogue

- [ ] Every demo product is removed or replaced.
- [ ] `isDemo` is `false` on every real product.
- [ ] Names and descriptions are written naturally in **French and Arabic** (no copy-paste of
      one language into the other, no machine-translation artifacts).
- [ ] Prices are correct, integers in DA, and include what you intend (tax, margin).
- [ ] Photos are real, sharp, well-lit, under ~150 KB each, and show the actual item.
- [ ] Each product has 2–4 images; the first one is the best shot.
- [ ] Part numbers are real, or the field is omitted (never invent one).
- [ ] Stock status is accurate; sold-out items are `out_of_stock` and cannot be ordered.
- [ ] `featured` is set on the 4 products you want on the home page.
- [ ] Compatibility stays `verified: false` unless you physically checked the fitment.
      If verified, the vehicle list is complete and correct for the years stated.
- [ ] `npm run og` was run after the final photos, so social previews are not demo images.
- [ ] Search finds products by name, part number and common misspellings (add `keywords`).

See [`PRODUCTS.md`](PRODUCTS.md).

---

## 6. Legal & privacy

- [ ] The privacy notice on the checkout page matches reality: the site stores only the
      language and a session order counter; the order lives in the shop's inbox.
- [ ] You are allowed to publish the phone number, address and social links shown.
- [ ] You have a return/exchange policy, even a short one, and can state it on request.
- [ ] Prices, delivery fees and availability are presented as offers you can honour.
- [ ] No customer data is added to the repository or to any analytics tool (there are none).

---

## 7. SEO and sharing

- [ ] `siteUrl` is the final domain (no placeholder), and the site was redeployed after
      changing it.
- [ ] `https://<domain>/sitemap.xml` and `/robots.txt` open and list the right URLs.
- [ ] A product link shows the correct title, description and image in a social preview
      debugger (Facebook/WhatsApp cache aggressively — re-scrape after redeploying).
- [ ] Page titles follow `Product — price | Shop` on product pages.
- [ ] Canonical URLs use the final domain, not `pages.dev` (unless that is your domain).

---

## 8. Build, tests and deploy

- [ ] `npm test` — all suites pass.
- [ ] `npm run build` — no type errors, static pages generated.
- [ ] `npm run verify` — “Build structure looks correct” and **zero warnings**.
- [ ] `npm run preview` — manual smoke test on the production build.
- [ ] Cloudflare Pages settings: build `npm run build`, output `dist`, `NODE_VERSION=22`.
- [ ] Custom domain (if used) has a valid certificate and redirects to one canonical host.
- [ ] Lighthouse on the deployed home page: accessibility, best practices and SEO at 1.00
      (or you have reviewed and accepted any regression).

See [`DEPLOYMENT.md`](DEPLOYMENT.md).

---

## 9. Post-deploy smoke test (on a real phone)

- [ ] Open the site on a mid-range Android over mobile data (not Wi-Fi): it loads quickly.
- [ ] No horizontal scrolling, no text clipped at the edges.
- [ ] Switch to Arabic: layout flips, text is readable, the switch is still visible.
- [ ] Reload the page: the language choice is remembered.
- [ ] Open a product link directly from a Facebook/WhatsApp message: correct product,
      correct image preview.
- [ ] Refresh a product page and a checkout page: no 404.
- [ ] Change quantity, wilaya and delivery method: subtotal, shipping and total update.
- [ ] Try an invalid phone and empty fields: errors appear in the active language.
- [ ] Try a sold-out product: it cannot be ordered.
- [ ] Complete a real order and check that the email arrives.
- [ ] Open an unknown URL: the “page not found” screen appears, with a way back to the shop.
- [ ] Use the browser back button after navigating: it returns to the previous page.

---

## 10. After launch

- [ ] Keep `products.json` and `shipping.ts` in Git; every change is a commit and a redeploy.
- [ ] Update stock and prices the same day they change in the shop.
- [ ] Review delivery rates whenever the courier changes its grid.
- [ ] Check the order inbox and hours after any staff change.
- [ ] Re-run `npm run verify` after each content change.
- [ ] Keep a copy of the previous deployment (Cloudflare keeps deployment history for rollback).

---

### Definition of done

A customer can open a shared product link, understand the price in their language, see the
real delivery cost for their wilaya, and send a complete, correctly encoded order to a real
WhatsApp number — and the shop can recognise and fulfil that order.
