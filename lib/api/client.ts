import {
  User,
  Client,
  Lead,
  Project,
  Invoice,
  InvoiceItem,
  RecurringInvoice,
  LateFeeAction,
  LateFeeDecisionRequest,
  MaintenanceConfig,
  Note,
  CompanySettings,
  EmailTemplate,
  DashboardSummary,
  EngagementDetail,
  EngagementDocument,
  EngagementListItem,
  PipelineSummary,
  ProjectDeliveryDetail,
  ProjectFeature,
  ProjectFeatureDoc,
  ProjectDocument,
  Announcement,
  AttendanceDay,
  CompanyExpense,
  CompanyExpenseList,
  CompanyHoliday,
  ExpenseClaim,
  LeaveRequest,
  Payslip,
  PayslipPreview,
  StaffDocument,
  StaffHome,
  StaffInbox,
  StaffProfile,
  WorkTask,
} from '../types';

export const getApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname || 'localhost';
    return `${protocol}//${hostname}:8000`;
  }
  return 'http://localhost:8000';
};

export const API_BASE_URL = getApiBaseUrl();

let inMemoryToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  inMemoryToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      sessionStorage.setItem('kr_auth_token', token);
    } else {
      sessionStorage.removeItem('kr_auth_token');
    }
  }
};

export const getAuthToken = (): string | null => {
  if (inMemoryToken) return inMemoryToken;
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('kr_auth_token');
  }
  return null;
};

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Dual auth: Send Authorization header if available
  const token = getAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // CRITICAL: enables httpOnly cookie kr_access_token
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    if (response.status === 401) {
      setAuthToken(null);
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/login') &&
        !window.location.pathname.startsWith('/forgot-password') &&
        !window.location.pathname.startsWith('/reset-password')
      ) {
        window.location.href = '/login';
      }
    }
    let errorDetail = response.statusText;
    let errorData = null;
    try {
      errorData = await response.json();
      if (errorData?.detail) {
        errorDetail = typeof errorData.detail === 'string' 
          ? errorData.detail 
          : JSON.stringify(errorData.detail);
      }
    } catch {
      // not JSON
    }
    throw new ApiError(response.status, errorDetail, errorData);
  }

  // Handle empty bodies (204 or delete)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// ------------------- API Modules -------------------

export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const res = await apiClient<{ access_token: string; token_type: string; user: User }>(
      '/api/v1/auth/login',
      { method: 'POST', body: JSON.stringify(credentials) }
    );
    if (res?.access_token) {
      setAuthToken(res.access_token);
    }
    return res;
  },

  logout: async () => {
    setAuthToken(null);
    return apiClient<{ message: string }>('/api/v1/auth/logout', { method: 'POST' });
  },

  me: () =>
    apiClient<User>('/api/v1/auth/me', { method: 'GET', cache: 'no-store' }),

  updateMe: (data: { full_name?: string; password?: string; current_password?: string }) =>
    apiClient<User>('/api/v1/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  forgotPassword: (email: string) =>
    apiClient<{ message: string; dev_reset_link?: string }>(
      '/api/v1/auth/forgot-password',
      { method: 'POST', body: JSON.stringify({ email }) }
    ),

  resetPassword: (payload: { token: string; new_password: string }) =>
    apiClient<{ message: string }>(
      '/api/v1/auth/reset-password',
      { method: 'POST', body: JSON.stringify(payload) }
    ),
};

export const dashboardApi = {
  getSummary: () =>
    apiClient<DashboardSummary>('/api/v1/dashboard', { cache: 'no-store' }),
};

export const clientsApi = {
  list: () =>
    apiClient<Client[]>('/api/v1/clients', { cache: 'no-store' }),

  get: (id: string) =>
    apiClient<Client>(`/api/v1/clients/${id}`, { cache: 'no-store' }),

  create: (data: Partial<Client>) =>
    apiClient<Client>('/api/v1/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Client>) =>
    apiClient<Client>(`/api/v1/clients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiClient<{ message: string }>(`/api/v1/clients/${id}`, {
      method: 'DELETE',
    }),
};

export const leadsApi = {
  list: (status?: string, search?: string) => {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.set('status', status);
    if (search) params.set('search', search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient<Lead[]>(`/api/v1/leads${query}`, { cache: 'no-store' });
  },

  get: (id: string) =>
    apiClient<Lead>(`/api/v1/leads/${id}`, { cache: 'no-store' }),

  create: (data: Partial<Lead>) =>
    apiClient<Lead>('/api/v1/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Lead>) =>
    apiClient<Lead>(`/api/v1/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiClient<{ message: string }>(`/api/v1/leads/${id}`, {
      method: 'DELETE',
    }),

  convert: (id: string, payload: { create_project?: boolean; project_name?: string; budget_paise?: number }) =>
    apiClient<{ client_id: string; project_id?: string; message: string }>(
      `/api/v1/leads/${id}/convert`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),
};

export const projectsApi = {
  list: (status?: string) => {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.set('status', status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient<Project[]>(`/api/v1/projects${query}`, { cache: 'no-store' });
  },

  get: (id: string) =>
    apiClient<Project>(`/api/v1/projects/${id}`, { cache: 'no-store' }),

  money: (id: string) =>
    apiClient<{
      development: {
        agreed_total: number;
        advance_agreed: number;
        advance_invoiced: number;
        advance_paid: number;
        total_invoiced: number;
        total_paid: number;
        gst_invoiced: number;
        remaining_to_invoice: number;
        outstanding: number;
      } | null;
      maintenance: {
        monthly_rate: number;
        total_invoiced: number;
        total_paid: number;
        gst_invoiced: number;
        outstanding: number;
        billed_through: string | null;
        paid_through: string | null;
        paid_from: string | null;
        paid_months: number;
        next_billing_date: string | null;
      } | null;
      variance: { development?: string[] } | null;
    }>(`/api/v1/projects/${id}/money`, { cache: 'no-store' }),

  create: (data: {
    name: string;
    client_id: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    budget_paise?: number;
    development_days?: number;
    status?: string;
    worker_ids?: string[];
    maintenance?: MaintenanceConfig;
  }) =>
    apiClient<Project>('/api/v1/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  start: (id: string) =>
    apiClient<Project>(`/api/v1/projects/${id}/start`, {
      method: 'POST',
    }),

  listDocuments: (id: string) =>
    apiClient<ProjectDocument[]>(`/api/v1/projects/${id}/documents`, { cache: 'no-store' }),

  uploadDocument: (id: string, file: File, title: string, docKind: string) => {
    const body = new FormData();
    body.append('file', file);
    body.append('title', title);
    body.append('doc_kind', docKind);
    return apiClient<ProjectDocument>(`/api/v1/projects/${id}/documents`, {
      method: 'POST',
      body,
    });
  },

  openDocument: async (projectId: string, docId: string) => {
    const headers = new Headers();
    const token = getAuthToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const res = await fetch(`${getApiBaseUrl()}/api/v1/projects/${projectId}/documents/${docId}/file`, {
      headers,
      credentials: 'include',
    });
    if (!res.ok) throw new ApiError(res.status, 'Failed to open document');
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    window.open(objectUrl, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  },

  toggleMaintenance: (id: string) =>
    apiClient<Project>(`/api/v1/projects/${id}/maintenance/toggle`, {
      method: 'POST',
    }),

  goLive: (id: string, go_live_date?: string) =>
    apiClient<{
      created: boolean;
      skipped: boolean;
      emailed?: boolean;
      reason?: string | null;
      invoice_id?: string | null;
      invoice_number?: string | null;
      period_key?: string | null;
      billable_days?: number | null;
      days_in_month?: number | null;
      amount_paise?: number | null;
      next_run_date?: string | null;
      project?: Project;
    }>(`/api/v1/projects/${id}/go-live`, {
      method: 'POST',
      body: JSON.stringify(go_live_date ? { go_live_date } : {}),
    }),

  createAdvanceInvoice: (id: string) =>
    apiClient<{
      invoice_id: string;
      invoice_number: string;
      total_paise: number;
      status: string;
      kind: string;
      project?: Project;
    }>(`/api/v1/projects/${id}/invoices/advance`, { method: 'POST' }),

  createBalanceInvoice: (id: string) =>
    apiClient<{
      invoice_id: string;
      invoice_number: string;
      total_paise: number;
      status: string;
      kind: string;
      project?: Project;
    }>(`/api/v1/projects/${id}/invoices/balance`, { method: 'POST' }),

  update: (id: string, data: Partial<Project> & { worker_ids?: string[] }) =>
    apiClient<Project>(`/api/v1/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiClient<{ message: string }>(`/api/v1/projects/${id}`, {
      method: 'DELETE',
    }),

  getDelivery: (id: string) =>
    apiClient<ProjectDeliveryDetail>(`/api/v1/projects/${id}/delivery`, { cache: 'no-store' }),

  toggleChecklist: (id: string, itemId: string) =>
    apiClient<ProjectDeliveryDetail>(`/api/v1/projects/${id}/checklist/${itemId}/toggle`, {
      method: 'POST',
    }),

  advanceDelivery: (id: string, closeWithoutAmc = false) =>
    apiClient<ProjectDeliveryDetail>(
      `/api/v1/projects/${id}/delivery/advance${closeWithoutAmc ? '?close_without_amc=true' : ''}`,
      { method: 'POST' }
    ),

  regressDelivery: (id: string) =>
    apiClient<ProjectDeliveryDetail>(`/api/v1/projects/${id}/delivery/regress`, { method: 'POST' }),

  listFeatures: (id: string) =>
    apiClient<ProjectFeature[]>(`/api/v1/projects/${id}/features`, { cache: 'no-store' }),

  createFeature: (
    id: string,
    data: { title: string; description?: string; status?: string; quoted_paise?: number }
  ) =>
    apiClient<ProjectFeature>(`/api/v1/projects/${id}/features`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateFeature: (
    id: string,
    featureId: string,
    data: Partial<{ title: string; description: string; status: string; quoted_paise: number }>
  ) =>
    apiClient<ProjectFeature>(`/api/v1/projects/${id}/features/${featureId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteFeature: (id: string, featureId: string) =>
    apiClient<{ message: string }>(`/api/v1/projects/${id}/features/${featureId}`, {
      method: 'DELETE',
    }),

  addFeatureDoc: (
    id: string,
    featureId: string,
    data: { title: string; body_or_url: string; doc_type?: string }
  ) =>
    apiClient<ProjectFeatureDoc>(`/api/v1/projects/${id}/features/${featureId}/docs`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteFeatureDoc: (id: string, featureId: string, docId: string) =>
    apiClient<{ message: string }>(`/api/v1/projects/${id}/features/${featureId}/docs/${docId}`, {
      method: 'DELETE',
    }),
};

export const invoicesApi = {
  list: (status?: string, type?: string) => {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.set('status', status);
    if (type && type !== 'all') params.set('type', type);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient<Invoice[]>(`/api/v1/invoices${query}`, { cache: 'no-store' });
  },

  get: (id: string) =>
    apiClient<Invoice>(`/api/v1/invoices/${id}`, { cache: 'no-store' }),

  create: (data: {
    invoice_type: string;
    client_id: string;
    project_id?: string | null;
    issue_date: string;
    due_date: string;
    tax_rate_percent?: number;
    notes?: string;
    items: { description: string; quantity: number; unit_rate_paise: number }[];
    period_months?: number;
    covers_from?: string | null;
    covers_to?: string | null;
    monthly_rate_paise?: number | null;
  }) =>
    apiClient<Invoice>('/api/v1/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (
    id: string,
    data: Partial<Invoice> & {
      items?: { description: string; quantity: number; unit_rate_paise: number }[];
      project_id?: string | null;
    }
  ) =>
    apiClient<Invoice>(`/api/v1/invoices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiClient<{ message: string }>(`/api/v1/invoices/${id}`, {
      method: 'DELETE',
    }),

  sendEmail: (id: string) =>
    apiClient<{ message: string }>(`/api/v1/invoices/${id}/send`, {
      method: 'POST',
    }),

  markPaid: (id: string) =>
    apiClient<Invoice>(`/api/v1/invoices/${id}/pay`, {
      method: 'POST',
    }),

  cancel: (id: string) =>
    apiClient<Invoice>(`/api/v1/invoices/${id}/cancel`, {
      method: 'POST',
    }),

  creditNote: (id: string, data?: { reason?: string; amount_paise?: number }) =>
    apiClient<Invoice>(`/api/v1/invoices/${id}/credit-note`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }),

  downloadPdfUrl: (id: string) =>
    `${API_BASE_URL}/api/v1/invoices/${id}/pdf`,

  // Recurring schedules
  listRecurring: () =>
    apiClient<RecurringInvoice[]>('/api/v1/invoices/recurring', { cache: 'no-store' }),

  createRecurring: (data: any) =>
    apiClient<RecurringInvoice>('/api/v1/invoices/recurring', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateRecurring: (id: string, data: any) =>
    apiClient<RecurringInvoice>(`/api/v1/invoices/recurring/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteRecurring: (id: string) =>
    apiClient<{ message: string }>(`/api/v1/invoices/recurring/${id}`, {
      method: 'DELETE',
    }),
};

export const lateFeeApi = {
  listPending: () =>
    apiClient<LateFeeAction[]>('/api/v1/invoices/late-fee-actions/pending', { cache: 'no-store' }),

  decide: (actionId: string, payload: LateFeeDecisionRequest) =>
    apiClient<LateFeeAction>(`/api/v1/invoices/late-fee-actions/${actionId}/decide`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  decideForInvoice: (invoiceId: string, payload: LateFeeDecisionRequest) =>
    apiClient<LateFeeAction>(`/api/v1/invoices/${invoiceId}/late-fee-action`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export const notesApi = {
  list: (entityType: 'client' | 'lead', entityId: string) =>
    apiClient<Note[]>(`/api/v1/notes?entity_type=${entityType}&entity_id=${entityId}`, {
      cache: 'no-store',
    }),

  create: (data: { entity_type: 'client' | 'lead'; entity_id: string; body: string }) =>
    apiClient<Note>('/api/v1/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiClient<{ message: string }>(`/api/v1/notes/${id}`, {
      method: 'DELETE',
    }),
};

export const settingsApi = {
  get: () =>
    apiClient<CompanySettings>('/api/v1/settings', { cache: 'no-store' }),

  update: (data: Partial<CompanySettings>) =>
    apiClient<CompanySettings>('/api/v1/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateSmtp: (data: any) =>
    apiClient<CompanySettings>('/api/v1/settings/smtp', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  uploadUpiQr: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient<CompanySettings>('/api/v1/settings/upi-qr', {
      method: 'POST',
      body: form,
    });
  },

  testEmail: (toEmail: string) =>
    apiClient<{ message: string }>('/api/v1/settings/test-email', {
      method: 'POST',
      body: JSON.stringify({ to_email: toEmail }),
    }),

  listTemplates: () =>
    apiClient<EmailTemplate[]>('/api/v1/settings/email-templates', { cache: 'no-store' }),

  updateTemplate: (id: string, data: { subject: string; body: string }) =>
    apiClient<EmailTemplate>(`/api/v1/settings/email-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

export const engagementsApi = {
  list: (params?: {
    stage?: number;
    status?: string;
    kind?: string;
    search?: string;
    project_id?: string;
    include_lost?: boolean;
  }) => {
    const q = new URLSearchParams();
    if (params?.stage != null) q.set('stage', String(params.stage));
    if (params?.status) q.set('status', params.status);
    if (params?.kind) q.set('kind', params.kind);
    if (params?.search) q.set('search', params.search);
    if (params?.project_id) q.set('project_id', params.project_id);
    if (params?.include_lost) q.set('include_lost', 'true');
    const query = q.toString() ? `?${q.toString()}` : '';
    return apiClient<EngagementListItem[]>(`/api/v1/engagements${query}`, { cache: 'no-store' });
  },

  pipeline: () =>
    apiClient<PipelineSummary>('/api/v1/engagements/pipeline', { cache: 'no-store' }),

  get: (id: string) =>
    apiClient<EngagementDetail>(`/api/v1/engagements/${id}`, { cache: 'no-store' }),

  create: (data: Record<string, unknown>) =>
    apiClient<EngagementDetail>('/api/v1/engagements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  uploadDocument: async (
    id: string,
    file: File,
    opts?: { title?: string; doc_kind?: string }
  ) => {
    const body = new FormData();
    body.append('file', file);
    if (opts?.title) body.append('title', opts.title);
    body.append('doc_kind', opts?.doc_kind || 'enquiry');
    return apiClient<EngagementDocument>(`/api/v1/engagements/${id}/documents`, {
      method: 'POST',
      body,
    });
  },

  openDocument: async (engagementId: string, docId: string, download = false) => {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/v1/engagements/${engagementId}/documents/${docId}/file${
      download ? '?download=true' : ''
    }`;
    const headers = new Headers();
    const token = getAuthToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const res = await fetch(url, { headers, credentials: 'include' });
    if (!res.ok) {
      throw new ApiError(res.status, 'Failed to open document');
    }
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    window.open(objectUrl, '_blank', 'noopener,noreferrer');
    // Revoke after browser has a chance to load
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  },

  deleteDocument: (engagementId: string, docId: string) =>
    apiClient<{ message: string }>(`/api/v1/engagements/${engagementId}/documents/${docId}`, {
      method: 'DELETE',
    }),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient<EngagementDetail>(`/api/v1/engagements/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  toggleChecklist: (id: string, itemId: string) =>
    apiClient<EngagementDetail>(`/api/v1/engagements/${id}/checklist/${itemId}/toggle`, {
      method: 'POST',
    }),

  advance: (id: string, closeWithoutAmc = false) =>
    apiClient<EngagementDetail>(
      `/api/v1/engagements/${id}/advance${closeWithoutAmc ? '?close_without_amc=true' : ''}`,
      { method: 'POST' }
    ),

  regress: (id: string) =>
    apiClient<EngagementDetail>(`/api/v1/engagements/${id}/regress`, { method: 'POST' }),

  jump: (id: string, target_stage: number) =>
    apiClient<EngagementDetail>(`/api/v1/engagements/${id}/jump`, {
      method: 'POST',
      body: JSON.stringify({ target_stage }),
    }),

  markLost: (id: string, lost_reason: string, lost_note?: string) =>
    apiClient<EngagementDetail>(`/api/v1/engagements/${id}/mark-lost`, {
      method: 'POST',
      body: JSON.stringify({ lost_reason, lost_note }),
    }),

  hold: (id: string) =>
    apiClient<EngagementDetail>(`/api/v1/engagements/${id}/hold`, { method: 'POST' }),

  resume: (id: string) =>
    apiClient<EngagementDetail>(`/api/v1/engagements/${id}/resume`, { method: 'POST' }),

  linkClient: (id: string, payload: { client_id?: string; create_client?: boolean }) =>
    apiClient<EngagementDetail>(`/api/v1/engagements/${id}/link-client`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  ensureProject: (
    id: string,
    payload: {
      project_name?: string;
      worker_ids?: string[];
      budget_paise?: number;
      development_days?: number;
      advance_paise?: number;
      maintenance_amount_paise?: number;
      maintenance_send_day?: number;
      maintenance_due_after_days?: number;
    }
  ) =>
    apiClient<EngagementDetail>(`/api/v1/engagements/${id}/ensure-project`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  linkInvoice: (id: string, invoice_id: string, role: 'advance' | 'final') =>
    apiClient<EngagementDetail>(`/api/v1/engagements/${id}/link-invoice`, {
      method: 'POST',
      body: JSON.stringify({ invoice_id, role }),
    }),

  createAdvanceInvoice: (id: string) =>
    apiClient<{
      invoice_id: string;
      invoice_number: string;
      total_paise: number;
      status: string;
      engagement: EngagementDetail;
    }>(`/api/v1/engagements/${id}/advance-invoice`, { method: 'POST' }),

  enableMaintenance: (
    id: string,
    payload: {
      amount_paise: number;
      send_day?: number;
      due_after_days?: number;
      reminder_every_days?: number;
      description?: string;
      jump_to_amc_stage?: boolean;
    }
  ) =>
    apiClient<EngagementDetail>(`/api/v1/engagements/${id}/maintenance/enable`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  pauseMaintenance: (id: string, complete = false) =>
    apiClient<EngagementDetail>(
      `/api/v1/engagements/${id}/maintenance/pause${complete ? '?complete=true' : ''}`,
      { method: 'POST' }
    ),

  resumeMaintenance: (id: string) =>
    apiClient<EngagementDetail>(`/api/v1/engagements/${id}/maintenance/resume`, {
      method: 'POST',
    }),
};

export const usersApi = {
  list: () =>
    apiClient<User[]>('/api/v1/users', { cache: 'no-store' }),

  create: (data: { email: string; password: string; full_name: string; role: string; client_id?: string | null }) =>
    apiClient<User>('/api/v1/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<User> & { password?: string }) =>
    apiClient<User>(`/api/v1/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiClient<{ message: string }>(`/api/v1/users/${id}`, {
      method: 'DELETE',
    }),
};

async function openStaffBinary(path: string) {
  const headers = new Headers();
  const token = getAuthToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    headers,
    credentials: 'include',
  });
  if (!res.ok) throw new ApiError(res.status, 'Failed to open file');
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  window.open(objectUrl, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

export const staffApi = {
  home: () => apiClient<StaffHome>('/api/v1/staff/me', { cache: 'no-store' }),

  list: () => apiClient<StaffProfile[]>('/api/v1/staff', { cache: 'no-store' }),

  updateMe: (data: Partial<StaffProfile>) =>
    apiClient<StaffProfile>('/api/v1/staff/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  updateProfile: (userId: string, data: Partial<StaffProfile>) =>
    apiClient<StaffProfile>(`/api/v1/staff/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  approveBank: (userId: string) =>
    apiClient<StaffProfile>(`/api/v1/staff/${userId}/bank/approve`, { method: 'POST' }),

  rejectBank: (userId: string) =>
    apiClient<StaffProfile>(`/api/v1/staff/${userId}/bank/reject`, { method: 'POST' }),

  listTasks: (workDate?: string, mine = false) => {
    const params = new URLSearchParams();
    if (workDate) params.set('work_date', workDate);
    if (mine) params.set('mine', 'true');
    const q = params.toString();
    return apiClient<WorkTask[]>(`/api/v1/staff/tasks${q ? `?${q}` : ''}`, { cache: 'no-store' });
  },

  createTask: (data: { work_date: string; title: string; project_id?: string; assignee_user_id?: string; status?: string }) =>
    apiClient<WorkTask>('/api/v1/staff/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateTask: (id: string, data: { title?: string; status?: string; project_id?: string | null }) =>
    apiClient<WorkTask>(`/api/v1/staff/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  checkIn: () => apiClient<AttendanceDay>('/api/v1/staff/attendance/check-in', { method: 'POST' }),

  checkOut: () => apiClient<AttendanceDay>('/api/v1/staff/attendance/check-out', { method: 'POST' }),

  listAttendance: (year: number, month: number, userId?: string) => {
    const params = new URLSearchParams({ year: String(year), month: String(month) });
    if (userId) params.set('user_id', userId);
    return apiClient<AttendanceDay[]>(`/api/v1/staff/attendance?${params}`, { cache: 'no-store' });
  },

  requestCorrection: (data: {
    work_date: string;
    reason: string;
    note?: string;
    check_in_at?: string;
    check_out_at?: string;
  }) =>
    apiClient<AttendanceDay>('/api/v1/staff/attendance/corrections', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  decideCorrection: (id: string, decision: 'approved' | 'rejected') =>
    apiClient<AttendanceDay>(`/api/v1/staff/attendance/corrections/${id}/${decision}`, {
      method: 'POST',
    }),

  listHolidays: (year?: number) =>
    apiClient<CompanyHoliday[]>(
      `/api/v1/staff/holidays${year ? `?year=${year}` : ''}`,
      { cache: 'no-store' }
    ),

  createHoliday: (data: { holiday_date: string; name: string }) =>
    apiClient<CompanyHoliday>('/api/v1/staff/holidays', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteHoliday: (id: string) =>
    apiClient<{ message: string }>(`/api/v1/staff/holidays/${id}`, { method: 'DELETE' }),

  applyLeave: (data: {
    leave_type: string;
    start_date: string;
    end_date: string;
    half_day?: boolean;
    reason?: string;
  }) =>
    apiClient<LeaveRequest>('/api/v1/staff/leave', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listLeave: (scope: 'mine' | 'team' | 'all' = 'mine', status?: string) => {
    const params = new URLSearchParams({ scope });
    if (status) params.set('status', status);
    return apiClient<LeaveRequest[]>(`/api/v1/staff/leave?${params}`, { cache: 'no-store' });
  },

  leaveCalendar: (start: string, end: string) =>
    apiClient<LeaveRequest[]>(
      `/api/v1/staff/leave/calendar?start=${start}&end=${end}`,
      { cache: 'no-store' }
    ),

  decideLeave: (id: string, decision: 'approved' | 'rejected') =>
    apiClient<LeaveRequest>(`/api/v1/staff/leave/${id}/${decision}`, { method: 'POST' }),

  submitExpense: (data: {
    expense_date: string;
    category: string;
    amount_paise: number;
    note?: string;
    receipt?: File | null;
  }) => {
    const body = new FormData();
    body.append('expense_date', data.expense_date);
    body.append('category', data.category);
    body.append('amount_paise', String(data.amount_paise));
    if (data.note) body.append('note', data.note);
    if (data.receipt) body.append('receipt', data.receipt);
    return apiClient<ExpenseClaim>('/api/v1/staff/expenses', { method: 'POST', body });
  },

  listExpenses: (scope: 'mine' | 'team' | 'all' = 'mine', status?: string) => {
    const params = new URLSearchParams({ scope });
    if (status) params.set('status', status);
    return apiClient<ExpenseClaim[]>(`/api/v1/staff/expenses?${params}`, { cache: 'no-store' });
  },

  decideExpense: (id: string, decision: 'approved' | 'rejected' | 'paid') =>
    apiClient<ExpenseClaim>(`/api/v1/staff/expenses/${id}/${decision}`, { method: 'POST' }),

  openExpenseReceipt: (id: string) => openStaffBinary(`/api/v1/staff/expenses/${id}/receipt`),

  listDocuments: (userId?: string) =>
    apiClient<StaffDocument[]>(
      `/api/v1/staff/documents${userId ? `?user_id=${userId}` : ''}`,
      { cache: 'no-store' }
    ),

  uploadDocument: (userId: string, file: File, title: string, kind: string) => {
    const body = new FormData();
    body.append('user_id', userId);
    body.append('title', title);
    body.append('kind', kind);
    body.append('file', file);
    return apiClient<StaffDocument>('/api/v1/staff/documents', { method: 'POST', body });
  },

  openDocument: (docId: string) => openStaffBinary(`/api/v1/staff/documents/${docId}/download`),

  listAnnouncements: (limit = 20) =>
    apiClient<Announcement[]>(`/api/v1/staff/announcements?limit=${limit}`, { cache: 'no-store' }),

  createAnnouncement: (data: { title: string; body: string }) =>
    apiClient<Announcement>('/api/v1/staff/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listPayslips: (userId?: string) =>
    apiClient<Payslip[]>(
      `/api/v1/staff/payslips${userId ? `?user_id=${userId}` : ''}`,
      { cache: 'no-store' }
    ),

  previewPayslip: (userId: string, monthKey: string) =>
    apiClient<PayslipPreview>(
      `/api/v1/staff/payslips/preview?user_id=${encodeURIComponent(userId)}&month_key=${encodeURIComponent(monthKey)}`,
      { cache: 'no-store' }
    ),

  publishPayslip: (data: {
    user_id: string;
    month_key: string;
    deductions_paise?: number;
    note?: string;
    gross_paise?: number;
  }) =>
    apiClient<Payslip>('/api/v1/staff/payslips', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  openPayslipPdf: (id: string) => openStaffBinary(`/api/v1/staff/payslips/${id}/pdf`),

  inbox: () => apiClient<StaffInbox>('/api/v1/staff/inbox', { cache: 'no-store' }),
};

export const companyExpensesApi = {
  list: (params?: { section?: string; month?: string }) => {
    const q = new URLSearchParams();
    if (params?.section) q.set('section', params.section);
    if (params?.month) q.set('month', params.month);
    const qs = q.toString();
    return apiClient<CompanyExpenseList>(
      `/api/v1/company-expenses${qs ? `?${qs}` : ''}`,
      { cache: 'no-store' }
    );
  },

  create: (data: {
    expense_date: string;
    section: string;
    category: string;
    title: string;
    amount_paise: number;
    vendor?: string;
    note?: string;
    next_renewal_on?: string;
    renewal_interval_months?: number;
    receipt?: File | null;
  }) => {
    const body = new FormData();
    body.append('expense_date', data.expense_date);
    body.append('section', data.section);
    body.append('category', data.category);
    body.append('title', data.title);
    body.append('amount_paise', String(data.amount_paise));
    if (data.vendor) body.append('vendor', data.vendor);
    if (data.note) body.append('note', data.note);
    if (data.next_renewal_on) body.append('next_renewal_on', data.next_renewal_on);
    if (data.renewal_interval_months != null) {
      body.append('renewal_interval_months', String(data.renewal_interval_months));
    }
    if (data.receipt) body.append('receipt', data.receipt);
    return apiClient<CompanyExpense>('/api/v1/company-expenses', { method: 'POST', body });
  },

  update: (
    id: string,
    data: {
      expense_date?: string;
      section?: string;
      category?: string;
      title?: string;
      amount_paise?: number;
      vendor?: string;
      note?: string;
      next_renewal_on?: string;
      renewal_interval_months?: number;
      clear_renewal?: boolean;
      receipt?: File | null;
    }
  ) => {
    const body = new FormData();
    if (data.expense_date) body.append('expense_date', data.expense_date);
    if (data.section) body.append('section', data.section);
    if (data.category) body.append('category', data.category);
    if (data.title) body.append('title', data.title);
    if (data.amount_paise != null) body.append('amount_paise', String(data.amount_paise));
    if (data.vendor != null) body.append('vendor', data.vendor);
    if (data.note != null) body.append('note', data.note);
    if (data.next_renewal_on) body.append('next_renewal_on', data.next_renewal_on);
    if (data.renewal_interval_months != null) {
      body.append('renewal_interval_months', String(data.renewal_interval_months));
    }
    if (data.clear_renewal) body.append('clear_renewal', 'true');
    if (data.receipt) body.append('receipt', data.receipt);
    return apiClient<CompanyExpense>(`/api/v1/company-expenses/${id}`, {
      method: 'PATCH',
      body,
    });
  },

  renew: (
    id: string,
    data: {
      next_renewal_on: string;
      receipt: File;
      amount_paise?: number;
      payment_date?: string;
    }
  ) => {
    const body = new FormData();
    body.append('next_renewal_on', data.next_renewal_on);
    body.append('receipt', data.receipt);
    if (data.amount_paise != null) body.append('amount_paise', String(data.amount_paise));
    if (data.payment_date) body.append('payment_date', data.payment_date);
    return apiClient<CompanyExpense>(`/api/v1/company-expenses/${id}/renew`, {
      method: 'POST',
      body,
    });
  },

  delete: (id: string) =>
    apiClient<{ message: string }>(`/api/v1/company-expenses/${id}`, { method: 'DELETE' }),

  openReceipt: (id: string) => openStaffBinary(`/api/v1/company-expenses/${id}/receipt`),
};
