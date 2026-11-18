import { EngagementDetail, UserRole } from '@/lib/types';

export type EnsureProjectPayload = {
  project_name?: string;
  worker_ids?: string[];
  budget_paise?: number;
  development_days?: number;
  advance_paise?: number;
  maintenance_amount_paise?: number;
  maintenance_send_day?: number;
  maintenance_due_after_days?: number;
};

export interface StageScreenProps {
  engagement: EngagementDetail;
  role?: UserRole;
  busy?: boolean;
  onRefresh: () => Promise<void> | void;
  onUpdate: (data: Record<string, unknown>, ok?: string) => Promise<void>;
  onToggleChecklist: (itemId: string) => Promise<void>;
  onAdvance?: () => Promise<void>;
  onEnsureProject?: (payload?: EnsureProjectPayload) => Promise<void>;
  onLinkClient?: () => Promise<void>;
}
