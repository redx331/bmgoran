import type { CategoryId } from './products';

export interface Category {
  id: CategoryId;
  nameFr: string;
  nameAr: string;
  descriptionFr: string;
  descriptionAr: string;
  /** Icon key rendered by the Icon component. */
  icon: 'engine' | 'moto' | 'accessory' | 'fitment';
}

export const CATEGORIES: Category[] = [
  {
    id: 'car-parts',
    nameFr: 'Pièces auto',
    nameAr: 'قطع غيار السيارات',
    descriptionFr: 'Freinage, éclairage, moteur et entretien',
    descriptionAr: 'الفرامل، الإضاءة، المحرك والصيانة',
    icon: 'engine',
  },
  {
    id: 'motorcycle-parts',
    nameFr: 'Pièces & accessoires moto',
    nameAr: 'قطع وإكسسوارات الدراجات',
    descriptionFr: 'Transmission, éclairage, supports',
    descriptionAr: 'نقل الحركة، الإضاءة، الحوامل',
    icon: 'moto',
  },
  {
    id: 'universal-accessories',
    nameFr: 'Accessoires universels',
    nameAr: 'إكسسوارات عامة',
    descriptionFr: 'Tapis, housses et équipement intérieur',
    descriptionAr: 'الدواسات، الأغطية ومستلزمات المقصورة',
    icon: 'accessory',
  },
  {
    id: 'vehicle-specific-parts',
    nameFr: 'Pièces spécifiques',
    nameAr: 'قطع خاصة بالطراز',
    descriptionFr: 'Filtres et pièces liées au moteur',
    descriptionAr: 'الفلاتر والقطع المرتبطة بالمحرك',
    icon: 'fitment',
  },
];

export function getCategory(id: CategoryId): Category {
  const category = CATEGORIES.find((item) => item.id === id);
  if (!category) {
    throw new Error(`Unknown category: ${id}`);
  }
  return category;
}

export function getCategoryName(id: CategoryId, locale: 'fr' | 'ar'): string {
  const category = getCategory(id);
  return locale === 'ar' ? category.nameAr : category.nameFr;
}
