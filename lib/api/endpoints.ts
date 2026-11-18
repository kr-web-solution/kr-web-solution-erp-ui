export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export const ENDPOINTS = {
  health: `${API_BASE_URL}/api/health`,
  crm: {
    leads: `${API_BASE_URL}/api/crm/leads`,
    lead: (id: string) => `${API_BASE_URL}/api/crm/leads/${id}`,
    convertLead: (id: string) => `${API_BASE_URL}/api/crm/leads/${id}/convert`,
    deals: `${API_BASE_URL}/api/crm/deals`,
  },
  finance: {
    invoices: `${API_BASE_URL}/api/finance/invoices`,
    payment: (id: string) => `${API_BASE_URL}/api/finance/invoices/${id}/payment`,
  },
};

