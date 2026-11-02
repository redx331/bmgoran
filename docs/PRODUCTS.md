# Product catalogue

All product data lives in **`src/data/products.json`**. The UI and the build script both read
that single file, so editing the JSON is the only step needed to add or change a product.

```
src/data/products.json   ← the catalogue (edit this)
src/data/products.ts     ← TypeScript types + helpers (search, filtering, formatting)
src/data/categories.ts   ← the 4 categories (id, FR/AR names, descriptions, icon)
```

After editing, always run:

```bash
npm run build    # regenerates static product pages, OG tags, sitemap, _redirects
npm run verify   # checks images, OG files, redirects and placeholders
npm test
```

---

## Field reference

Each product is one object in the JSON array.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | yes | Internal identifier, unique, never shown. e.g. `p-001` |
| `slug` | string | yes | URL segment: `/product/<slug>`. Unique, lowercase, `a-z`, `0-9`, `-` |
| `name` | string | yes | Fallback name. Keep equal to `nameFr` |
| `nameFr` | string | yes | French name shown in LTR mode, cards, page title |
| `nameAr` | string | yes | Arabic name shown in RTL mode |
| `category` | string | yes | One of `car-parts`, `motorcycle-parts`, `universal-accessories`, `vehicle-specific-parts` |
| `price` | number | yes | Price in Algerian dinars (DA), integer, no decimals, no currency symbol |
| `images` | string[] | yes | Public paths, first image is the main photo. `[]` falls back to `placeholder.svg` |
| `description` | string | yes | Fallback description. Keep equal to `descriptionFr` |
| `descriptionFr` | string | yes | French description (2–4 sentences works best) |
| `descriptionAr` | string | yes | Arabic description, natural wording — not a machine translation |
| `specifications` | array | yes | `{ labelFr, labelAr, valueFr, valueAr }`, 3–6 rows recommended |
| `partNumber` | string | no | Searchable reference (OEM or internal). Omit if you do not have one |
| `brand` | string | no | Searchable brand name |
| `compatibility` | object | no | See [Compatibility](#compatibility--do-not-invent-fitment) |
| `stockStatus` | string | yes | `in_stock`, `low_stock` or `out_of_stock` |
| `featured` | boolean | yes | Featured products appear on the home page (first 4) and the hero |
| `isDemo` | boolean | yes | Shows the “démo” badge and demo-price note. Set to `false` for real products |
| `keywords` | string[] | no | Extra search terms (misspellings, Arabic/French synonyms) |

### Prices

- Integers only, in dinars: `3500` renders as `3 500 DA` (FR) or `3 500 دج` (AR).
- Never encode shipping in the product price; shipping is calculated separately.
- `isDemo: true` adds a visible demo marker next to the price. Remove the flag **and** the
  demo wording in the descriptions when you publish real data.

### Slugs (permanent URLs)

- Use the product, not the campaign: `led-headlights`, not `promo-octobre`.
- Changing a slug breaks existing links, Facebook ads and shared WhatsApp messages.
  If you must rename one, keep the old slug as a redirect in `scripts/postbuild.mjs`
  (the `_redirects` file is generated there) or keep the product available under the old URL.
- The build creates `dist/product/<slug>/index.html` for every product, so
  `https://your-site/product/led-headlights` opens directly, with its own
  `<title>`, description, canonical URL and Open Graph image.

### Images

- Put files in `public/images/products/` and reference them as `/images/products/...`.
- Recommended: **1200×900 (4:3)**, WebP or optimised JPEG, under ~150 KB each.
  The cards and gallery use a 4:3 frame.
- Use 2–4 photos per product: full product, detail, packaging or installed view.
  Real photos of the actual item sell far better than catalogue renders.
- The first image is used on cards, the home hero and the social preview.
- Images are rendered as decorative inside labelled buttons/links, so a missing `alt`
  attribute is not a bug; the accessible name comes from the product name.
- Never hotlink images from another website: local files keep the site fast and reliable.

### Stock status

| Value | Behaviour |
| --- | --- |
| `in_stock` | Normal “En stock” badge, orderable |
| `low_stock` | “Stock limité” badge, orderable |
| `out_of_stock` | “Rupture de stock” badge, **not orderable**; Buy Now is disabled and checkout refuses the product |

### Compatibility — do not invent fitment

The site is deliberately conservative:

```json
"compatibility": {
  "verified": false,
  "vehicles": [],
  "noteFr": "Envoyez-nous la marque, le modèle et l'année de votre véhicule avant de commander.",
  "noteAr": "أرسل لنا ماركة سيارتك وطرازها وسنتها قبل الطلب."
}
```

- `verified` must stay `false` until **you** have physically checked the part on the vehicle.
- Only then fill `vehicles` with real entries:

```json
"compatibility": {
  "verified": true,
  "vehicles": [
    { "make": "Renault", "model": "Clio III", "years": "2005–2012" },
    { "make": "Dacia", "model": "Logan I", "years": "2004–2012" }
  ],
  "noteFr": "Vérifié sur véhicule d'origine. Confirmez la motorisation avant commande.",
  "noteAr": "تم التحقق على سيارة أصلية. أكّد نوع المحرك قبل الطلب."
}
```

- When in doubt, leave `verified: false` and keep a note asking the customer to confirm.
  An unverified claim is worse than “contact us to check”.

---

## Categories

Defined in `src/data/categories.ts`:

| id | FR | AR |
| --- | --- | --- |
| `car-parts` | Pièces auto | قطع غيار السيارات |
| `motorcycle-parts` | Pièces moto | قطع غيار الدراجات النارية |
| `universal-accessories` | Accessoires universels | إكسسوارات عامة |
| `vehicle-specific-parts` | Pièces spécifiques | قطع خاصة بطراز معين |

To add a category: extend `CategoryId` in `src/data/products.ts`, add an entry in
`src/data/categories.ts` (with an existing icon name), and use the new id in products.
Filtering, counts and the shop page pick it up automatically.

---

## Add a product — step by step

> Fastest route: open `/admin`, use GitHub mode (live commit) or local mode (edits saved in the
> browser, then export the ZIP and extract it at the project root). The manual steps below remain
> the reference for bulk edits or when the admin is unavailable.

1. **Add photos** to `public/images/products/`, named after the slug (`my-part-1.jpg`, `my-part-2.jpg`).
2. **Append an object** to `src/data/products.json`. Copy an existing product and edit every field.
   Keep `id` and `slug` unique.
3. **Write both languages.** French and Arabic descriptions should read naturally; do not leave
   one language as a copy of the other.
4. **Set honest stock and demo flags.** Real product → `isDemo: false`. Out of stock →
   `stockStatus: "out_of_stock"`.
5. **Generate the social image** (needs Chrome or Edge installed):
   ```bash
   npm run og
   ```
   This writes `public/og/<slug>.png` (1200×630). If you skip it, `npm run verify` fails.
6. **Build and check:**
   ```bash
   npm run build
   npm run verify
   npm test
   ```
7. Open `http://localhost:4173/product/<slug>` and check: title, price, both languages,
   gallery, quantity, Buy Now, and the order email.

## Remove a product

1. Delete its object from `products.json` (and its images/OG file if unused).
2. Rebuild. The static page disappears, and `/product/<old-slug>` falls back to the SPA,
   which shows the “product not found” page.
3. If the URL was used in ads or messages, add a redirect for it in `scripts/postbuild.mjs`
   so visitors land on a relevant product instead of a 404.

## Search behaviour

Search (`/shop?q=...`) matches, case- and accent-insensitively:

- `name`, `nameFr`, `nameAr`
- `partNumber`
- `brand`
- every entry in `keywords`

Arabic diacritics and common letter variants (أ/ا, ة/ه, ى/ي) are normalised. Add customer
spellings and dialect words to `keywords` to make search forgiving.

---

## Generated files (do not edit by hand)

`npm run build` produces, from `products.json` and `site.config.json`:

- `dist/product/<slug>/index.html` — static entry with product-specific meta/OG tags
- `dist/_redirects` — per-product rewrites + SPA fallback for Cloudflare Pages
- `dist/sitemap.xml`, `dist/robots.txt`
- `dist/og/<slug>.png` — copied from `public/og/`

Edit the sources, not `dist/`.
