/**
 * ALGERIAN WILAYAS + DELIVERY RATES
 * =================================
 *
 * This is the ONLY file you need to edit to change delivery prices.
 *
 * 1. Every one of the 69 wilayas has TWO independently configurable prices:
 *      - homeDeliveryPrice : delivery to the customer's home  (DZD)
 *      - deskDeliveryPrice : pickup at the courier's office      (DZD)
 *
 * 2. Wilayas 01-58 use the shop's Yalidine express fees from Oran (W31), downloaded on
 *    2026-11-06 with `node scripts/yalidine-fees.mjs` (home = express_home, office =
 *    express_desk of the wilaya's seat commune). Bordj Badji Mokhtar has no stop desk.
 *    Ouled Djellal (51) and the new wilayas 59-69 had no Yalidine fee yet: they keep the
 *    shop's flat home price (800) until the script is run again.
 *
 * 3. Yalidine's COD percentage and weight surcharge (parcels over 5 kg) are not
 *    charged by this checkout and are therefore not modelled here.
 *
 * 4. Never put `0` to mean "free" unless delivery is genuinely free for that
 *    wilaya and method. A rate of `null` means "not configured" and blocks the
 *    order; a real free delivery can be entered as `0`.
 *
 * The application never invents a fallback rate. If the selected rate is
 * missing, the customer sees a clear message and cannot place the order.
 */

export interface WilayaShipping {
  /** Official wilaya code, two digits: "01" … "69". */
  code: string;
  nameFr: string;
  nameAr: string;
  homeDeliveryPrice: number | null;
  deskDeliveryPrice: number | null;
}

/** Real Yalidine rates from the shop's account, downloaded on 2026-11-06. */
export const SHIPPING_RATES_ARE_EXAMPLES = false;

export const WILAYAS: WilayaShipping[] = [
  { code: '01', nameFr: 'Adrar', nameAr: 'أدرار', homeDeliveryPrice: 1000, deskDeliveryPrice: 800 },
  { code: '02', nameFr: 'Chlef', nameAr: 'الشلف', homeDeliveryPrice: 850, deskDeliveryPrice: 600 },
  { code: '03', nameFr: 'Laghouat', nameAr: 'الأغواط', homeDeliveryPrice: 900, deskDeliveryPrice: 700 },
  { code: '04', nameFr: 'Oum El Bouaghi', nameAr: 'أم البواقي', homeDeliveryPrice: 850, deskDeliveryPrice: 600 },
  { code: '05', nameFr: 'Batna', nameAr: 'باتنة', homeDeliveryPrice: 850, deskDeliveryPrice: 600 },
  { code: '06', nameFr: 'Béjaïa', nameAr: 'بجاية', homeDeliveryPrice: 850, deskDeliveryPrice: 600 },
  { code: '07', nameFr: 'Biskra', nameAr: 'بسكرة', homeDeliveryPrice: 900, deskDeliveryPrice: 700 },
  { code: '08', nameFr: 'Béchar', nameAr: 'بشار', homeDeliveryPrice: 900, deskDeliveryPrice: 700 },
  { code: '09', nameFr: 'Blida', nameAr: 'البليدة', homeDeliveryPrice: 850, deskDeliveryPrice: 600 },
  { code: '10', nameFr: 'Bouira', nameAr: 'البويرة', homeDeliveryPrice: 850, deskDeliveryPrice: 600 },
  { code: '11', nameFr: 'Tamanrasset', nameAr: 'تمنراست', homeDeliveryPrice: 1550, deskDeliveryPrice: 1350 },
  { code: '12', nameFr: 'Tébessa', nameAr: 'تبسة', homeDeliveryPrice: 900, deskDeliveryPrice: 700 },
  { code: '13', nameFr: 'Tlemcen', nameAr: 'تلمسان', homeDeliveryPrice: 850, deskDeliveryPrice: 600 },
  { code: '14', nameFr: 'Tiaret', nameAr: 'تيارت', homeDeliveryPrice: 850, deskDeliveryPrice: 600 },
  { code: '15', nameFr: 'Tizi Ouzou', nameAr: 'تيزي وزو', homeDeliveryPrice: 850, deskDeliveryPrice: 600 },
  { code: '16', nameFr: 'Alger', nameAr: 'الجزائر', homeDeliveryPrice: 650, deskDeliveryPrice: 500 },
  { code: '17', nameFr: 'Djelfa', nameAr: 'الجلفة', homeDeliveryPrice: 900, deskDeliveryPrice: 700 },
  { code: '18', nameFr: 'Jijel', nameAr: 'جيجل', homeDeliveryPrice: 850, deskDeliveryPrice: 600 },
  { code: '19', nameFr: 'Sétif', nameAr: 'سطيف', homeDeliveryPrice: 850, deskDeliveryPrice: 600 },
  { code: '20', nameFr: 'Saïda', nameAr: 'سعيدة', homeDeliveryPrice: 850, deskDeliveryPrice: 600 },
  { code: '21', nameFr: 'Skikda', nameAr: 'سكيكدة', homeDeliveryPrice: 850, deskDeliveryPrice: 600 },
  { code: '22', nameFr: 'Sidi Bel Abbès', nameAr: 'سيدي بلعباس', homeDeliveryPrice: 650, deskDeliveryPrice: 500 },
  { code: '23', nameFr: 'Annaba', nameAr: 'عنابة', homeDeliveryPrice: 850, deskDeliveryPrice: 600 },
  { code: '24', nameFr: 'Guelma', nameAr: 'قالمة', homeDeliveryPrice: 850, deskDeliveryPrice: 600 },
  { code: '25', nameFr: 'Constantine', nameAr: 'قسنطينة', homeDeliveryPrice: 850, deskDeliveryPrice: 600 },
  { code: '26', nameFr: 'Médéa', nameAr: 'المدية', homeDeliveryPrice: 850, deskDeliveryPrice: 600 },
  { code: '27', nameFr: 'Mostaganem', nameAr: 'مستغانم', homeDeliveryPrice: 650, deskDeliveryPrice: 500 },
  { code: '28', nameFr: "M'Sila", nameAr: 'المسيلة', homeDeliveryPrice: 850, deskDeliveryPrice: 600 },
  { code: '29', nameFr: 'Mascara', nameAr: 'معسكر', homeDeliveryPrice: 650, deskDeliveryPrice: 500 },
  { code: '30', nameFr: 'Ouargla', nameAr: 'ورقلة', homeDeliveryPrice: 900, deskDeliveryPrice: 700 },
  { code: '31', nameFr: 'Oran', nameAr: 'وهران', homeDeliveryPrice: 540, deskDeliveryPrice: 400 },
  { code: '32', nameFr: 'El Bayadh', nameAr: 'البيض', homeDeliveryPrice: 1000, deskDeliveryPrice: 800 },
  { code: '33', nameFr: 'Illizi', nameAr: 'إليزي', homeDeliveryPrice: 1550, deskDeliveryPrice: 1350 },
  { code: '34', nameFr: 'Bordj Bou Arreridj', nameAr: 'برج بوعريريج', homeDeliveryPrice: 850, deskDeliveryPrice: 600 },
  { code: '35', nameFr: 'Boumerdès', nameAr: 'بومرداس', homeDeliveryPrice: 850, deskDeliveryPrice: 600 },
  { code: '36', nameFr: 'El Tarf', nameAr: 'الطارف', homeDeliveryPrice: 850, deskDeliveryPrice: 600 },
  { code: '37', nameFr: 'Tindouf', nameAr: 'تندوف', homeDeliveryPrice: 1550, deskDeliveryPrice: 1350 },
  { code: '38', nameFr: 'Tissemsilt', nameAr: 'تيسمسيلت', homeDeliveryPrice: 850, deskDeliveryPrice: 600 },
  { code: '39', nameFr: 'El Oued', nameAr: 'الوادي', homeDeliveryPrice: 900, deskDeliveryPrice: 700 },
  { code: '40', nameFr: 'Khenchela', nameAr: 'خنشلة', homeDeliveryPrice: 850, deskDeliveryPrice: 600 },
  { code: '41', nameFr: 'Souk Ahras', nameAr: 'سوق أهراس', homeDeliveryPrice: 850, deskDeliveryPrice: 600 },
  { code: '42', nameFr: 'Tipaza', nameAr: 'تيبازة', homeDeliveryPrice: 850, deskDeliveryPrice: 600 },
  { code: '43', nameFr: 'Mila', nameAr: 'ميلة', homeDeliveryPrice: 850, deskDeliveryPrice: 600 },
  { code: '44', nameFr: 'Aïn Defla', nameAr: 'عين الدفلى', homeDeliveryPrice: 850, deskDeliveryPrice: 600 },
  { code: '45', nameFr: 'Naâma', nameAr: 'النعامة', homeDeliveryPrice: 1000, deskDeliveryPrice: 800 },
  { code: '46', nameFr: 'Aïn Témouchent', nameAr: 'عين تموشنت', homeDeliveryPrice: 650, deskDeliveryPrice: 500 },
  { code: '47', nameFr: 'Ghardaïa', nameAr: 'غرداية', homeDeliveryPrice: 900, deskDeliveryPrice: 700 },
  { code: '48', nameFr: 'Relizane', nameAr: 'غليزان', homeDeliveryPrice: 850, deskDeliveryPrice: 600 },
  { code: '49', nameFr: 'Timimoun', nameAr: 'تيميمون', homeDeliveryPrice: 1000, deskDeliveryPrice: 800 },
  { code: '50', nameFr: 'Bordj Badji Mokhtar', nameAr: 'برج باجي مختار', homeDeliveryPrice: 1000, deskDeliveryPrice: null },
  { code: '51', nameFr: 'Ouled Djellal', nameAr: 'أولاد جلال', homeDeliveryPrice: 800, deskDeliveryPrice: null },
  { code: '52', nameFr: 'Béni Abbès', nameAr: 'بني عباس', homeDeliveryPrice: 900, deskDeliveryPrice: 700 },
  { code: '53', nameFr: 'In Salah', nameAr: 'عين صالح', homeDeliveryPrice: 1550, deskDeliveryPrice: 1350 },
  { code: '54', nameFr: 'In Guezzam', nameAr: 'عين قزام', homeDeliveryPrice: 1550, deskDeliveryPrice: 1350 },
  { code: '55', nameFr: 'Touggourt', nameAr: 'تقرت', homeDeliveryPrice: 900, deskDeliveryPrice: 700 },
  { code: '56', nameFr: 'Djanet', nameAr: 'جانت', homeDeliveryPrice: 1550, deskDeliveryPrice: 1350 },
  { code: '57', nameFr: "El M'Ghair", nameAr: 'المغير', homeDeliveryPrice: 900, deskDeliveryPrice: 700 },
  { code: '58', nameFr: 'El Meniaa', nameAr: 'المنيعة', homeDeliveryPrice: 900, deskDeliveryPrice: 700 },
  // Created by law 26-06 (JO n° 25, 2026-04-05). Not yet in Yalidine's fees: flat home price only.
  { code: '59', nameFr: 'Aflou', nameAr: 'أفلو', homeDeliveryPrice: 800, deskDeliveryPrice: null },
  { code: '60', nameFr: 'Barika', nameAr: 'بريكة', homeDeliveryPrice: 800, deskDeliveryPrice: null },
  { code: '61', nameFr: 'El Kantara', nameAr: 'القنطرة', homeDeliveryPrice: 800, deskDeliveryPrice: null },
  { code: '62', nameFr: 'Bir El Ater', nameAr: 'بئر العاتر', homeDeliveryPrice: 800, deskDeliveryPrice: null },
  { code: '63', nameFr: 'El Aricha', nameAr: 'العريشة', homeDeliveryPrice: 800, deskDeliveryPrice: null },
  { code: '64', nameFr: 'Ksar Chellala', nameAr: 'قصر الشلالة', homeDeliveryPrice: 800, deskDeliveryPrice: null },
  { code: '65', nameFr: 'Aïn Oussera', nameAr: 'عين وسارة', homeDeliveryPrice: 800, deskDeliveryPrice: null },
  { code: '66', nameFr: 'Messaad', nameAr: 'مسعد', homeDeliveryPrice: 800, deskDeliveryPrice: null },
  { code: '67', nameFr: 'Ksar El Boukhari', nameAr: 'قصر البخاري', homeDeliveryPrice: 800, deskDeliveryPrice: null },
  { code: '68', nameFr: 'Bou Saâda', nameAr: 'بوسعادة', homeDeliveryPrice: 800, deskDeliveryPrice: null },
  { code: '69', nameFr: 'El Abiodh Sidi Cheikh', nameAr: 'الأبيض سيدي الشيخ', homeDeliveryPrice: 800, deskDeliveryPrice: null },
];
