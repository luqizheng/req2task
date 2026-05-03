import { RequirementStatus } from '@req2task/dto';

export interface StatusOption {
  to: string;
  label: string;
  color: string;
}

const STATUS_LABELS: Record<string, string> = {
  [RequirementStatus.DRAFT]: '草稿',
  [RequirementStatus.REVIEWED]: '已评审',
  [RequirementStatus.APPROVED]: '已批准',
  [RequirementStatus.REJECTED]: '已拒绝',
  [RequirementStatus.PROCESSING]: '处理中',
  [RequirementStatus.COMPLETED]: '已完成',
  [RequirementStatus.CANCELLED]: '已取消',
};

const STATUS_COLORS: Record<string, string> = {
  [RequirementStatus.DRAFT]: '#94a3b8',
  [RequirementStatus.REVIEWED]: '#8b5cf6',
  [RequirementStatus.APPROVED]: '#2563eb',
  [RequirementStatus.REJECTED]: '#dc2626',
  [RequirementStatus.PROCESSING]: '#f59e0b',
  [RequirementStatus.COMPLETED]: '#16a34a',
  [RequirementStatus.CANCELLED]: '#6b7280',
};

export const getStatusLabel = (status: string): string => {
  return STATUS_LABELS[status] || status;
};

export const getStatusColor = (status: string): string => {
  return STATUS_COLORS[status] || '#6b7280';
};

export const mapStatusesToOptions = (statuses: string[]): StatusOption[] => {
  debugger;
  return statuses.map((status) => ({
    to: status,
    label: STATUS_LABELS[status] || status,
    color: STATUS_COLORS[status] || '#6b7280',
  }));
};

export const getRequirementStatusOptions = (): StatusOption[] => {
  return Object.values(RequirementStatus).map((status) => ({
    to: status,
    label: STATUS_LABELS[status],
    color: STATUS_COLORS[status],
  }));
};