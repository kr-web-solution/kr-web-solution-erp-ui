import type { CompanyExpenseSection } from '@/lib/types';

export type ExpenseSectionSlug = 'recurring' | 'daily' | 'upgrades' | 'other';

export const EXPENSE_SECTIONS: {
  id: CompanyExpenseSection;
  slug: ExpenseSectionSlug;
  label: string;
  hint: string;
}[] = [
  {
    id: 'recurring',
    slug: 'recurring',
    label: 'Recurring',
    hint: 'Server, domain, hosting, software, email',
  },
  {
    id: 'daily',
    slug: 'daily',
    label: 'Daily',
    hint: 'Food, travel, supplies, fuel, petty cash',
  },
  {
    id: 'upgrade',
    slug: 'upgrades',
    label: 'Upgrades',
    hint: 'Furniture, equipment, investments',
  },
  {
    id: 'other',
    slug: 'other',
    label: 'Other',
    hint: 'Anything that does not fit',
  },
];

export const EXPENSE_CATEGORIES: Record<
  CompanyExpenseSection,
  { value: string; label: string }[]
> = {
  recurring: [
    { value: 'server', label: 'Server' },
    { value: 'domain', label: 'Domain' },
    { value: 'hosting', label: 'Hosting' },
    { value: 'software', label: 'Software' },
    { value: 'email', label: 'Email' },
  ],
  daily: [
    { value: 'food', label: 'Food' },
    { value: 'travel', label: 'Travel' },
    { value: 'supplies', label: 'Supplies' },
    { value: 'fuel', label: 'Fuel' },
    { value: 'petty_cash', label: 'Petty cash' },
  ],
  upgrade: [
    { value: 'furniture', label: 'Furniture' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'investment', label: 'Investment' },
  ],
  other: [{ value: 'other', label: 'Other' }],
};

export function monthKeyNow() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function sectionBySlug(slug: string) {
  return EXPENSE_SECTIONS.find((s) => s.slug === slug);
}

export function sectionById(id: string) {
  return EXPENSE_SECTIONS.find((s) => s.id === id);
}

export function categoryLabel(section: string, category: string) {
  const list = EXPENSE_CATEGORIES[section as CompanyExpenseSection] || [];
  return list.find((c) => c.value === category)?.label || category.replace(/_/g, ' ');
}

export function sectionLabel(section: string) {
  return sectionById(section)?.label || section;
}

export const RENEWAL_INTERVALS: { value: number; label: string }[] = [
  { value: 1, label: 'Monthly' },
  { value: 3, label: 'Every 3 months' },
  { value: 6, label: 'Every 6 months' },
  { value: 12, label: 'Yearly' },
];

export function cadenceLabel(months?: number | null): string {
  if (!months) return 'Monthly';
  return RENEWAL_INTERVALS.find((i) => i.value === months)?.label || `Every ${months} months`;
}

export function dueStatusLabel(status?: string | null): string {
  if (status === 'overdue') return 'Overdue';
  if (status === 'due_soon') return 'Due soon';
  if (status === 'upcoming') return 'Upcoming';
  return '';
}
