import type { PageResult } from '@/types/domain'

export async function mockDelay<T>(value: T, ms = 180): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, ms))
  return value
}

export function pageList<T>(list: T[], page = 1, pageSize = 20): PageResult<T> {
  const start = (page - 1) * pageSize
  return {
    list: list.slice(start, start + pageSize),
    page,
    pageSize,
    total: list.length
  }
}

export function assertRule(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}
