# Delivery & wilaya rates

Delivery pricing is **one file**: [`src/config/shipping.ts`](../src/config/shipping.ts).
It contains all **69 Algerian wilayas**, each with two independent prices, plus a global flag
that marks the whole table as example data.

```
src/config/shipping.ts   ← the only file to edit for delivery prices
src/lib/shipping.ts      ← quote resolution (never invents a price)
src/pages/CheckoutPage.tsx, DeliveryPage.tsx  ← UI
```

---

## Data shape

```ts
export interface WilayaShipping {
  code: string;                       // "01" … "58"
  nameFr: string;
  nameAr: string;
  homeDeliveryPrice: number | null;   // delivery to the customer's home, in DA
  deskDeliveryPrice: number | null;   // pickup at the courier's agency, in DA
}

export const SHIPPING_RATES_ARE_EXAMPLES = false; // real ZR Express grid, 2026-11-02

export const WILAYAS: WilayaShipping[] = [
  { code: '16', nameFr: 'Alger', nameAr: 'الجزائر', homeDeliveryPrice: 400, deskDeliveryPrice: 300 },
  // …
];
```

The current table is the **ZR Express** grid supplied by the shop (departure Oran, W31):
`homeDeliveryPrice` = ZR “TARIF”, `deskDeliveryPrice` = ZR “STOP DESK”. The sheet is mapped
**by wilaya name**, because its numbering diverges from official codes from row 49
(sheet 54 = Timimoun = official 49). ZR “ANNULE RETOUR” is not modelled. Illizi (33),
Tindouf (37), Bordj Badji Mokhtar (50) and Djanet (56) are absent from the sheet → `null`.

Both prices are **integers in dinars**. Shipping is charged **once per order**, not per item:
`total = (unit price × quantity) + shipping`.

### `null` is not zero

| Value | Meaning | Result in checkout |
| --- | --- | --- |
| `700` | Real rate | Shipping = 700 DA, order allowed |
| `0` | Genuine free delivery for that wilaya and method | Shipping = 0 DA, order allowed |
| `null` | Not configured / wilaya not served | **Order blocked** with an explanation; order button disabled |

The application never substitutes a fallback rate and never treats a missing rate as free
delivery. This is enforced in `getShippingQuote()` and covered by tests.

### The example flag

The flag is currently `false`: the table holds verified ZR Express rates. Setting it to `true`
makes the interface label every shipping amount as an example (`exemple`), and checkout plus
`/api/order` refuse orders with `409 rates-not-verified`. Use `true` only while testing, or
temporarily if a new grid has not been confirmed yet.

---

## How the quote is resolved

1. Checkout reads the selected wilaya code (`01`–`58`) and method (`home` or `desk`).
2. `getShippingQuote(code, method)` looks up the wilaya, then the matching price.
3. If the price is `null`, not finite, or negative → failure `rate-not-configured`.
   If the code is unknown → failure `unknown-wilaya`.
4. On success the checkout shows `Sous-total`, `Livraison` and `Total`, and the same three
   numbers are written into the order email.
5. Changing wilaya, method or quantity recalculates immediately; the total is never cached.

The delivery page lists every wilaya with both prices, so customers can check before ordering.
A missing rate is displayed as “Non configuré” / “غير محدد” in that cell, never as `0 DA`.

---

## Update the rates

1. Open `src/config/shipping.ts`.
2. Replace `homeDeliveryPrice` and `deskDeliveryPrice` for every wilaya you serve.
   Keep the `code`, `nameFr` and `nameAr` untouched.
3. For wilayas you do not serve, set both prices to `null`.
4. When **all** values are real, change:
   ```ts
   export const SHIPPING_RATES_ARE_EXAMPLES = false;
   ```
5. Verify and deploy:
   ```bash
   npm test
   npm run build
   npm run verify
   ```

Rates are static data: changing them requires a new build and deployment (a few minutes on
Cloudflare Pages). There is no admin panel by design.

### Practical tips

- Ask your courier for a **zone grid** (usually 3–5 zones) rather than 58 individual prices,
  then apply each zone price to its wilayas. It is easier to maintain and to explain.
- Home delivery is normally more expensive than desk/agency pickup; keep that relationship
  unless your courier says otherwise.
- If a courier charges by weight or by item, the current flat-per-order model under-charges
  large orders. In that case, change `calculateTotals()` in `src/lib/order.ts` and the
  corresponding tests — do not hide the difference in the product price.
- Review rates when the courier changes its grid, and after fuel price changes.

---

## Names and translations

- `nameFr` / `nameAr` are the official wilaya names; the checkout select shows the active
  language and keeps the numeric code as the value.
- Delivery method labels live in `src/i18n/translations.ts`
  (`checkout.homeDelivery`, `checkout.deskDelivery`, plus their helper texts).
- Error messages for missing rates and unknown wilayas (`validation.rateMissing`,
  `validation.wilayaInvalid`) are also there, in both languages.

Do not rename wilayas to match a courier's internal labels: customers know the official names.

---

## Tests that protect this behaviour

| Test file | What it covers |
| --- | --- |
| `src/test/shipping.test.ts` | 69 wilayas present, unique codes, home/desk resolution, `null` never becomes `0`, unknown wilaya, free (`0`) delivery |
| `src/test/order.test.ts` | Subtotal/shipping/total arithmetic, quantity validation |
| `src/test/checkout-flow.test.tsx` | Totals update live when wilaya, method and quantity change |
| `src/test/checkout-missing-rate.test.tsx` | Missing rate blocks the order and explains why |
| `src/test/static-build.test.ts` | Delivery page content in the built output |

If you change the shipping model, update these tests first — they are the contract.
