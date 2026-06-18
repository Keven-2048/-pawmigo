import type { ReportTargetType } from '@/types/domain'

const reportTargetTypes = new Set<ReportTargetType>(['user', 'pet', 'post', 'comment', 'invite'])

export function parseRouteId(value: unknown): number | undefined {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

export function isReportTargetType(value: unknown): value is ReportTargetType {
  return typeof value === 'string' && reportTargetTypes.has(value as ReportTargetType)
}
