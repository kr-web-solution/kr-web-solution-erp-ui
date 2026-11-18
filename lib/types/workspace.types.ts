export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Task {
  id: string;
  projectId: string;
  sprintId?: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeUserId: string;
  dueOn: string;
  estimatedHours: number;
  actualHours: number;
  description?: string;
  projectTitle?: string;
  assigneeName?: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  status: 'pending' | 'achieved' | 'overdue';
  dueOn: string;
  billableAmountPaise: number;
  projectTitle?: string;
}

export interface RenewalEvent {
  id: string;
  serviceId: string;
  eventType: string;
  scheduledFor: string;
  sentAt?: string | null;
  status: 'scheduled' | 'sent' | 'completed' | 'cancelled';
  channel: string;
  clientName?: string;
  serviceTitle?: string;
}

export interface Meeting {
  id: string;
  title: string;
  projectId?: string;
  startAt: string;
  durationMinutes: number;
  organizerUserId: string;
  minutes?: string;
  projectTitle?: string;
  organizerName?: string;
  location?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  entityType: string;
  entityId: string;
  read: boolean;
  createdAt: string;
  description?: string;
  category?: 'project' | 'invoice' | 'deal' | 'system';
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: 'casual' | 'sick' | 'earned' | 'unpaid';
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  employeeName?: string;
}

export interface TimesheetRow {
  id: string;
  projectId: string;
  projectTitle: string;
  taskId: string;
  taskTitle: string;
  mon: number;
  tue: number;
  wed: number;
  thu: number;
  fri: number;
  sat: number;
  sun: number;
  isBillable: boolean;
}

export interface ApprovalRequest {
  id: string;
  type: 'expense' | 'leave' | 'invoice' | 'contract' | 'purchase_order';
  title: string;
  referenceId: string;
  requestedByUserId: string;
  requesterName: string;
  assignedToUserId: string;
  approverName: string;
  amountPaise?: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reason?: string;
  decisionNote?: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  companyId: string;
  companyName?: string;
  projectId?: string;
  projectTitle?: string;
  subject: string;
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  assignedUserId: string;
  assignedUserName?: string;
  createdAt: string;
}

export interface UserSession {
  id: string;
  device: string;
  browser: string;
  ipAddress: string;
  location: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

export interface KnowledgeArticle {
  id: string;
  category: 'hr_policies' | 'onboarding' | 'delivery_sop' | 'finance_gst' | 'infrastructure_security';
  categoryLabel: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  visibility: 'Company Internal' | 'Confidential HQ' | 'Department Specific';
  updatedAt: string;
  readMinutes: number;
  tags: string[];
}

export interface ActivityTimelineItem {
  id: string;
  actorName: string;
  actorRole: string;
  action: 'created' | 'updated' | 'approved' | 'submitted' | 'closed' | 'converted';
  actionLabel: string;
  entityType: 'lead' | 'deal' | 'project' | 'invoice' | 'timesheet' | 'approval';
  entityTitle: string;
  entityHref: string;
  timestamp: string;
  details?: string;
}

export interface WorkspacePreferences {
  locale: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  tableDensity: 'comfortable' | 'compact' | 'dense';
  notifyEmailDaily: boolean;
  notifyBrowserPush: boolean;
  notifyApprovalsImmediate: boolean;
  reducedMotion: boolean;
  highContrastBorder: boolean;
}
