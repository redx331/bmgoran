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
 * 2. The values below are EXAMPLES ONLY. They are not real courier rates and
 *    must not be charged to customers. They exist so that the interface and
 *    totals can be tested.
 *
 * 3. Before launch:
 *      - replace every price with your real negotiated rate;
 *      - set `homeDeliveryPrice` / `deskDeliveryPrice` to `null` for a wilaya
 *        you do not serve (checkout will refuse to order and explain why);
 *      - set SHIPPING_RATES_ARE_EXAMPLES to `false` once all rates are real.
 *
 * 4. Never put `0` to mean "free" unless delivery is genuinely free for that
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

/** Set to false only after every price below has been replaced with a real rate. */
export const SHIPPING_RATES_ARE_EXAMPLES = true;

export const WILAYAS: WilayaShipping[] = [
  { code: '01', nameFr: 'Adrar', nameAr: 'أدرار', homeDeliveryPrice: 1500, deskDeliveryPrice: 1000 },
  { code: '02', nameFr: 'Chlef', nameAr: 'الشلف', homeDeliveryPrice: 800, deskDeliveryPrice: 500 },
  { code: '03', nameFr: 'Laghouat', nameAr: 'الأغواط', homeDeliveryPrice: 1100, deskDeliveryPrice: 750 },
  { code: '04', nameFr: 'Oum El Bouaghi', nameAr: 'أم البواقي', homeDeliveryPrice: 950, deskDeliveryPrice: 600 },
  { code: '05', nameFr: 'Batna', nameAr: 'باتنة', homeDeliveryPrice: 950, deskDeliveryPrice: 600 },
  { code: '06', nameFr: 'Béjaïa', nameAr: 'بجاية', homeDeliveryPrice: 900, deskDeliveryPrice: 550 },
  { code: '07', nameFr: 'Biskra', nameAr: 'بسكرة', homeDeliveryPrice: 1000, deskDeliveryPrice: 650 },
  { code: '08', nameFr: 'Béchar', nameAr: 'بشار', homeDeliveryPrice: 1500, deskDeliveryPrice: 1000 },
  { code: '09', nameFr: 'Blida', nameAr: 'البليدة', homeDeliveryPrice: 700, deskDeliveryPrice: 450 },
  { code: '10', nameFr: 'Bouira', nameAr: 'البويرة', homeDeliveryPrice: 800, deskDeliveryPrice: 500 },
  { code: '11', nameFr: 'Tamanrasset', nameAr: 'تمنراست', homeDeliveryPrice: 1600, deskDeliveryPrice: 1100 },
  { code: '12', nameFr: 'Tébessa', nameAr: 'تبسة', homeDeliveryPrice: 1000, deskDeliveryPrice: 650 },
  { code: '13', nameFr: 'Tlemcen', nameAr: 'تلمسان', homeDeliveryPrice: 900, deskDeliveryPrice: 550 },
  { code: '14', nameFr: 'Tiaret', nameAr: 'تيارت', homeDeliveryPrice: 950, deskDeliveryPrice: 600 },
  { code: '15', nameFr: 'Tizi Ouzou', nameAr: 'تيزي وزو', homeDeliveryPrice: 800, deskDeliveryPrice: 500 },
  { code: '16', nameFr: 'Alger', nameAr: 'الجزائر', homeDeliveryPrice: 700, deskDeliveryPrice: 450 },
  { code: '17', nameFr: 'Djelfa', nameAr: 'الجلفة', homeDeliveryPrice: 1000, deskDeliveryPrice: 650 },
  { code: '18', nameFr: 'Jijel', nameAr: 'جيجل', homeDeliveryPrice: 900, deskDeliveryPrice: 550 },
  { code: '19', nameFr: 'Sétif', nameAr: 'سطيف', homeDeliveryPrice: 900, deskDeliveryPrice: 550 },
  { code: '20', nameFr: 'Saïda', nameAr: 'سعيدة', homeDeliveryPrice: 950, deskDeliveryPrice: 600 },
  { code: '21', nameFr: 'Skikda', nameAr: 'سكيكدة', homeDeliveryPrice: 900, deskDeliveryPrice: 550 },
  { code: '22', nameFr: 'Sidi Bel Abbès', nameAr: 'سيدي بلعباس', homeDeliveryPrice: 900, deskDeliveryPrice: 550 },
  { code: '23', nameFr: 'Annaba', nameAr: 'عنابة', homeDeliveryPrice: 900, deskDeliveryPrice: 550 },
  { code: '24', nameFr: 'Guelma', nameAr: 'قالمة', homeDeliveryPrice: 900, deskDeliveryPrice: 550 },
  { code: '25', nameFr: 'Constantine', nameAr: 'قسنطينة', homeDeliveryPrice: 900, deskDeliveryPrice: 550 },
  { code: '26', nameFr: 'Médéa', nameAr: 'المدية', homeDeliveryPrice: 800, deskDeliveryPrice: 500 },
  { code: '27', nameFr: 'Mostaganem', nameAr: 'مستغانم', homeDeliveryPrice: 850, deskDeliveryPrice: 500 },
  { code: '28', nameFr: "M'Sila", nameAr: 'المسيلة', homeDeliveryPrice: 950, deskDeliveryPrice: 600 },
  { code: '29', nameFr: 'Mascara', nameAr: 'معسكر', homeDeliveryPrice: 900, deskDeliveryPrice: 550 },
  { code: '30', nameFr: 'Ouargla', nameAr: 'ورقلة', homeDeliveryPrice: 1100, deskDeliveryPrice: 750 },
  { code: '31', nameFr: 'Oran', nameAr: 'وهران', homeDeliveryPrice: 850, deskDeliveryPrice: 500 },
  { code: '32', nameFr: 'El Bayadh', nameAr: 'البيض', homeDeliveryPrice: 1100, deskDeliveryPrice: 750 },
  { code: '33', nameFr: 'Illizi', nameAr: 'إليزي', homeDeliveryPrice: 1600, deskDeliveryPrice: 1100 },
  { code: '34', nameFr: 'Bordj Bou Arreridj', nameAr: 'برج بوعريريج', homeDeliveryPrice: 900, deskDeliveryPrice: 550 },
  { code: '35', nameFr: 'Boumerdès', nameAr: 'بومرداس', homeDeliveryPrice: 700, deskDeliveryPrice: 450 },
  { code: '36', nameFr: 'El Tarf', nameAr: 'الطارف', homeDeliveryPrice: 950, deskDeliveryPrice: 600 },
  { code: '37', nameFr: 'Tindouf', nameAr: 'تندوف', homeDeliveryPrice: 1600, deskDeliveryPrice: 1100 },
  { code: '38', nameFr: 'Tissemsilt', nameAr: 'تيسمسيلت', homeDeliveryPrice: 950, deskDeliveryPrice: 600 },
  { code: '39', nameFr: 'El Oued', nameAr: 'الوادي', homeDeliveryPrice: 1100, deskDeliveryPrice: 750 },
  { code: '40', nameFr: 'Khenchela', nameAr: 'خنشلة', homeDeliveryPrice: 1000, deskDeliveryPrice: 650 },
  { code: '41', nameFr: 'Souk Ahras', nameAr: 'سوق أهراس', homeDeliveryPrice: 1000, deskDeliveryPrice: 650 },
  { code: '42', nameFr: 'Tipaza', nameAr: 'تيبازة', homeDeliveryPrice: 700, deskDeliveryPrice: 450 },
  { code: '43', nameFr: 'Mila', nameAr: 'ميلة', homeDeliveryPrice: 900, deskDeliveryPrice: 550 },
  { code: '44', nameFr: 'Aïn Defla', nameAr: 'عين الدفلى', homeDeliveryPrice: 800, deskDeliveryPrice: 500 },
  { code: '45', nameFr: 'Naâma', nameAr: 'النعامة', homeDeliveryPrice: 1100, deskDeliveryPrice: 750 },
  { code: '46', nameFr: 'Aïn Témouchent', nameAr: 'عين تموشنت', homeDeliveryPrice: 900, deskDeliveryPrice: 550 },
  { code: '47', nameFr: 'Ghardaïa', nameAr: 'غرداية', homeDeliveryPrice: 1100, deskDeliveryPrice: 750 },
  { code: '48', nameFr: 'Relizane', nameAr: 'غليزان', homeDeliveryPrice: 850, deskDeliveryPrice: 500 },
  { code: '49', nameFr: 'Timimoun', nameAr: 'تيميمون', homeDeliveryPrice: 1500, deskDeliveryPrice: 1000 },
  { code: '50', nameFr: 'Bordj Badji Mokhtar', nameAr: 'برج باجي مختار', homeDeliveryPrice: 1600, deskDeliveryPrice: 1100 },
  { code: '51', nameFr: 'Ouled Djellal', nameAr: 'أولاد جلال', homeDeliveryPrice: 1100, deskDeliveryPrice: 750 },
  { code: '52', nameFr: 'Béni Abbès', nameAr: 'بني عباس', homeDeliveryPrice: 1500, deskDeliveryPrice: 1000 },
  { code: '53', nameFr: 'In Salah', nameAr: 'عين صالح', homeDeliveryPrice: 1600, deskDeliveryPrice: 1100 },
  { code: '54', nameFr: 'In Guezzam', nameAr: 'عين قزام', homeDeliveryPrice: 1700, deskDeliveryPrice: 1200 },
  { code: '55', nameFr: 'Touggourt', nameAr: 'تقرت', homeDeliveryPrice: 1100, deskDeliveryPrice: 750 },
  { code: '56', nameFr: 'Djanet', nameAr: 'جانت', homeDeliveryPrice: 1600, deskDeliveryPrice: 1100 },
  { code: '57', nameFr: "El M'Ghair", nameAr: 'المغير', homeDeliveryPrice: 1100, deskDeliveryPrice: 750 },
  { code: '58', nameFr: 'El Meniaa', nameAr: 'المنيعة', homeDeliveryPrice: 1100, deskDeliveryPrice: 750 },
];
