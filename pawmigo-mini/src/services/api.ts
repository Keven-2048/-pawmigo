import { mockApi } from './mockApi'
import { realApi } from './realApi'

export * from './types'
export type { MockApi } from './mockApi'

// Flip to false to use the real backend (where endpoints are implemented).
export const USE_MOCK = true
export const api = USE_MOCK ? mockApi : realApi
