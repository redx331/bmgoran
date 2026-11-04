/**
 * ALGERIAN WILAYAS + DELIVERY RATES
 * =================================
 *
 * This is the ONLY file you need to edit to change delivery prices.
 *
 * 1. Every one of the 58 wilayas has TWO independently configurable prices:
 *      - homeDeliveryPrice : delivery to the customer's home  (DZD)
 *      - deskDeliveryPrice : pickup at the courier's office      (DZD)
 *
 * 2. The values below are the ZR Express grid supplied by the shop on
 *    2026-11-02, departing from Oran (W31):
 *      - homeDeliveryPrice = ZR "TARIF" (delivery to the customer's home);
 *      - deskDeliveryPrice = the shop's flat office price by region (2026-11-04):
 *        north 500, middle (Hauts Plateaux) 550, south 600. Only wilayas where
 *        the ZR sheet lists a STOP DESK have one; the others stay `null`.
 *    A "/" in the ZR sheet means that mode is not offered: the value is `null`.
 *
 * 3. The grid is matched to wilayas BY NAME, not by the sheet's row number:
 *    from row 49 the sheet numbering differs from the official codes
 *    (sheet 54 = Timimoun = official 49). Names are authoritative.
 *
 * 4. ZR "ANNULE RETOUR" (return fee) is not charged by this checkout and is
 *    therefore not modelled here.
 *
 * 5. ZR's sheet does not list Illizi (33), Tindouf (37), Bordj Badji Mokhtar
 *    (50) or Djanet (56). They are `null` (not served): checkout refuses them
 *    instead of inventing a price.
 *
 * 6. Never put `0` to mean "free" unless delivery is genuinely free for that
 *    wilaya and method. A rate of `null` means "not configured" and blocks the
 *    order; a real free delivery can be entered as `0`.
 *
 * The application never invents a fallback rate. If the selected rate is
 * missing, the customer sees a clear message and cannot place the order.
 */

export interface WilayaShipping {
  /** Official wilaya code, two digits: "01" … "58". */
  code: string;
  nameFr: string;
  nameAr: string;
  homeDeliveryPrice: number | null;
  deskDeliveryPrice: number | null;
}

/** Real ZR Express rates, verified with the shop on 2026-11-02. */
export const SHIPPING_RATES_ARE_EXAMPLES = false;

export const WILAYAS: WilayaShipping[] = [
  { code: '01', nameFr: 'Adrar', nameAr: 'أدرار', homeDeliveryPrice: 1300, deskDeliveryPrice: 600 },
  { code: '02', nameFr: 'Chlef', nameAr: 'الشلف', homeDeliveryPrice: 850, deskDeliveryPrice: 500 },
  { code: '03', nameFr: 'Laghouat', nameAr: 'الأغواط', homeDeliveryPrice: 950, deskDeliveryPrice: 550 },
  { code: '04', nameFr: 'Oum El Bouaghi', nameAr: 'أم البواقي', homeDeliveryPrice: 850, deskDeliveryPrice: 550 },
  { code: '05', nameFr: 'Batna', nameAr: 'باتنة', homeDeliveryPrice: 900, deskDeliveryPrice: 550 },
  { code: '06', nameFr: 'Béjaïa', nameAr: 'بجاية', homeDeliveryPrice: 800, deskDeliveryPrice: null },
  { code: '07', nameFr: 'Biskra', nameAr: 'بسكرة', homeDeliveryPrice: 950, deskDeliveryPrice: 600 },
  { code: '08', nameFr: 'Béchar', nameAr: 'بشار', homeDeliveryPrice: 1000, deskDeliveryPrice: 600 },
  { code: '09', nameFr: 'Blida', nameAr: 'البليدة', homeDeliveryPrice: 600, deskDeliveryPrice: 500 },
  { code: '10', nameFr: 'Bouira', nameAr: 'البويرة', homeDeliveryPrice: 700, deskDeliveryPrice: null },
  { code: '11', nameFr: 'Tamanrasset', nameAr: 'تمنراست', homeDeliveryPrice: 1500, deskDeliveryPrice: 600 },
  { code: '12', nameFr: 'Tébessa', nameAr: 'تبسة', homeDeliveryPrice: 900, deskDeliveryPrice: null },
  { code: '13', nameFr: 'Tlemcen', nameAr: 'تلمسان', homeDeliveryPrice: 900, deskDeliveryPrice: 500 },
  { code: '14', nameFr: 'Tiaret', nameAr: 'تيارت', homeDeliveryPrice: 850, deskDeliveryPrice: null },
  { code: '15', nameFr: 'Tizi Ouzou', nameAr: 'تيزي وزو', homeDeliveryPrice: 750, deskDeliveryPrice: 500 },
  { code: '16', nameFr: 'Alger', nameAr: 'الجزائر', homeDeliveryPrice: 400, deskDeliveryPrice: 500 },
  { code: '17', nameFr: 'Djelfa', nameAr: 'الجلفة', homeDeliveryPrice: 950, deskDeliveryPrice: 550 },
  { code: '18', nameFr: 'Jijel', nameAr: 'جيجل', homeDeliveryPrice: 900, deskDeliveryPrice: null },
  { code: '19', nameFr: 'Sétif', nameAr: 'سطيف', homeDeliveryPrice: 800, deskDeliveryPrice: 550 },
  { code: '20', nameFr: 'Saïda', nameAr: 'سعيدة', homeDeliveryPrice: 900, deskDeliveryPrice: null },
  { code: '21', nameFr: 'Skikda', nameAr: 'سكيكدة', homeDeliveryPrice: 900, deskDeliveryPrice: 500 },
  { code: '22', nameFr: 'Sidi Bel Abbès', nameAr: 'سيدي بلعباس', homeDeliveryPrice: 900, deskDeliveryPrice: null },
  { code: '23', nameFr: 'Annaba', nameAr: 'عنابة', homeDeliveryPrice: 850, deskDeliveryPrice: 500 },
  { code: '24', nameFr: 'Guelma', nameAr: 'قالمة', homeDeliveryPrice: 900, deskDeliveryPrice: 500 },
  { code: '25', nameFr: 'Constantine', nameAr: 'قسنطينة', homeDeliveryPrice: 800, deskDeliveryPrice: 500 },
  { code: '26', nameFr: 'Médéa', nameAr: 'المدية', homeDeliveryPrice: 800, deskDeliveryPrice: null },
  { code: '27', nameFr: 'Mostaganem', nameAr: 'مستغانم', homeDeliveryPrice: 900, deskDeliveryPrice: null },
  { code: '28', nameFr: "M'Sila", nameAr: 'المسيلة', homeDeliveryPrice: 850, deskDeliveryPrice: 550 },
  { code: '29', nameFr: 'Mascara', nameAr: 'معسكر', homeDeliveryPrice: 900, deskDeliveryPrice: null },
  { code: '30', nameFr: 'Ouargla', nameAr: 'ورقلة', homeDeliveryPrice: 950, deskDeliveryPrice: 600 },
  { code: '31', nameFr: 'Oran', nameAr: 'وهران', homeDeliveryPrice: 800, deskDeliveryPrice: 500 },
  { code: '32', nameFr: 'El Bayadh', nameAr: 'البيض', homeDeliveryPrice: 1000, deskDeliveryPrice: null },
  { code: '33', nameFr: 'Illizi', nameAr: 'إليزي', homeDeliveryPrice: null, deskDeliveryPrice: null },
  { code: '34', nameFr: 'Bordj Bou Arreridj', nameAr: 'برج بوعريريج', homeDeliveryPrice: 800, deskDeliveryPrice: null },
  { code: '35', nameFr: 'Boumerdès', nameAr: 'بومرداس', homeDeliveryPrice: 700, deskDeliveryPrice: null },
  { code: '36', nameFr: 'El Tarf', nameAr: 'الطارف', homeDeliveryPrice: 850, deskDeliveryPrice: null },
  { code: '37', nameFr: 'Tindouf', nameAr: 'تندوف', homeDeliveryPrice: null, deskDeliveryPrice: null },
  { code: '38', nameFr: 'Tissemsilt', nameAr: 'تيسمسيلت', homeDeliveryPrice: 900, deskDeliveryPrice: null },
  { code: '39', nameFr: 'El Oued', nameAr: 'الوادي', homeDeliveryPrice: 950, deskDeliveryPrice: 600 },
  { code: '40', nameFr: 'Khenchela', nameAr: 'خنشلة', homeDeliveryPrice: 900, deskDeliveryPrice: null },
  { code: '41', nameFr: 'Souk Ahras', nameAr: 'سوق أهراس', homeDeliveryPrice: 900, deskDeliveryPrice: 500 },
  { code: '42', nameFr: 'Tipaza', nameAr: 'تيبازة', homeDeliveryPrice: 700, deskDeliveryPrice: 500 },
  { code: '43', nameFr: 'Mila', nameAr: 'ميلة', homeDeliveryPrice: 900, deskDeliveryPrice: 500 },
  { code: '44', nameFr: 'Aïn Defla', nameAr: 'عين الدفلى', homeDeliveryPrice: 900, deskDeliveryPrice: null },
  { code: '45', nameFr: 'Naâma', nameAr: 'النعامة', homeDeliveryPrice: 1000, deskDeliveryPrice: null },
  { code: '46', nameFr: 'Aïn Témouchent', nameAr: 'عين تموشنت', homeDeliveryPrice: 900, deskDeliveryPrice: null },
  { code: '47', nameFr: 'Ghardaïa', nameAr: 'غرداية', homeDeliveryPrice: 950, deskDeliveryPrice: null },
  { code: '48', nameFr: 'Relizane', nameAr: 'غليزان', homeDeliveryPrice: 900, deskDeliveryPrice: null },
  { code: '49', nameFr: 'Timimoun', nameAr: 'تيميمون', homeDeliveryPrice: 1300, deskDeliveryPrice: null },
  { code: '50', nameFr: 'Bordj Badji Mokhtar', nameAr: 'برج باجي مختار', homeDeliveryPrice: null, deskDeliveryPrice: null },
  { code: '51', nameFr: 'Ouled Djellal', nameAr: 'أولاد جلال', homeDeliveryPrice: 950, deskDeliveryPrice: null },
  { code: '52', nameFr: 'Béni Abbès', nameAr: 'بني عباس', homeDeliveryPrice: 1000, deskDeliveryPrice: null },
  { code: '53', nameFr: 'In Salah', nameAr: 'عين صالح', homeDeliveryPrice: 1500, deskDeliveryPrice: null },
  { code: '54', nameFr: 'In Guezzam', nameAr: 'عين قزام', homeDeliveryPrice: 1500, deskDeliveryPrice: null },
  { code: '55', nameFr: 'Touggourt', nameAr: 'تقرت', homeDeliveryPrice: 950, deskDeliveryPrice: null },
  { code: '56', nameFr: 'Djanet', nameAr: 'جانت', homeDeliveryPrice: null, deskDeliveryPrice: null },
  { code: '57', nameFr: "El M'Ghair", nameAr: 'المغير', homeDeliveryPrice: 950, deskDeliveryPrice: null },
  { code: '58', nameFr: 'El Meniaa', nameAr: 'المنيعة', homeDeliveryPrice: 1000, deskDeliveryPrice: null },
];
