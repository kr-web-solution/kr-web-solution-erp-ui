/**
 * Formats paise integer into Indian Rupee string with Lakhs/Crores notation or standard comma grouping.
 * Paise is an integer (1 INR = 100 paise).
 */
export function formatINR(paise: number, compact: boolean = false): string {
  const rupees = Math.round(paise / 100);
  
  if (compact) {
    if (Math.abs(rupees) >= 10000000) {
      return `₹${(rupees / 10000000).toFixed(2)} Cr`;
    }
    if (Math.abs(rupees) >= 100000) {
      return `₹${(rupees / 100000).toFixed(2)} L`;
    }
    if (Math.abs(rupees) >= 1000) {
      return `₹${(rupees / 1000).toFixed(1)} K`;
    }
  }

  // Standard Indian comma grouping
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rupees);
}

/**
 * Format ISO date string into DD MMM YYYY.
 */
export function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Maps Lead/Deal/Invoice statuses to semantic badge styles.
 */
export function getStatusStyle(status: string): { bg: string; text: string; label: string } {
  const normalized = status.toLowerCase();
  
  switch (normalized) {
    case 'won':
    case 'converted':
    case 'paid':
    case 'accepted':
    case 'completed':
      return { bg: 'bg-[#ECFDF3]', text: 'text-[#027A48]', label: capitalize(status) };
    case 'qualified':
    case 'in_progress':
    case 'proposal':
      return { bg: 'bg-[#EFF8FF]', text: 'text-[#175CD3]', label: capitalize(status) };
    case 'contacted':
    case 'negotiation':
    case 'sent':
      return { bg: 'bg-[#FFFAEB]', text: 'text-[#B54708]', label: capitalize(status) };
    case 'new':
    case 'planned':
    case 'draft':
      return { bg: 'bg-[#F2F4F7]', text: 'text-[#344054]', label: capitalize(status) };
    case 'lost':
    case 'cancelled':
    case 'overdue':
    case 'declined':
      return { bg: 'bg-[#FEF3F2]', text: 'text-[#B42318]', label: capitalize(status) };
    default:
      return { bg: 'bg-[#F2F4F7]', text: 'text-[#344054]', label: capitalize(status) };
  }
}

function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}

