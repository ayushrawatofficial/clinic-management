/** Services with this category appear as repair tariff options on the Repairing module. */
export const REPAIR_SERVICE_CATEGORY = 'Repair';

export function isRepairServiceCategory(cat: string | undefined | null): boolean {
  return String(cat ?? '').trim().toLowerCase() === REPAIR_SERVICE_CATEGORY.toLowerCase();
}
