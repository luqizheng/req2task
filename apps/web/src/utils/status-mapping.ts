import type { RequirementStatus } from '@req2task/dto'
import { REQUIREMENT_STATUS_CONFIG, getEnumLabel } from '@/utils/enum-config'

export interface StatusOption {
  to: string
  label: string
  color: string
}

/**
 * @deprecated Use REQUIREMENT_STATUS_CONFIG from '@/utils/enum-config' instead.
 * Kept for backward-compat with transition options that need hex colors.
 */
export const getStatusLabel = (status: string): string => {
  return getEnumLabel(REQUIREMENT_STATUS_CONFIG, status as RequirementStatus)
}

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    draft: '#94a3b8',
    reviewed: '#8b5cf6',
    approved: '#2563eb',
    rejected: '#dc2626',
    processing: '#f59e0b',
    completed: '#16a34a',
    cancelled: '#6b7280',
  }
  return colors[status] || '#6b7280'
}

export const mapStatusesToOptions = (statuses: string[]): StatusOption[] => {
  return statuses.map((status) => ({
    to: status,
    label: getEnumLabel(REQUIREMENT_STATUS_CONFIG, status as RequirementStatus),
    color: getStatusColor(status),
  }))
}

/**
 * @deprecated Use toSelectOptions(REQUIREMENT_STATUS_CONFIG) instead.
 */
export const getRequirementStatusOptions = (): StatusOption[] => {
  return (Object.keys(REQUIREMENT_STATUS_CONFIG) as RequirementStatus[]).map((status) => ({
    to: status,
    label: getEnumLabel(REQUIREMENT_STATUS_CONFIG, status),
    color: getStatusColor(status),
  }))
}
