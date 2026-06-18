import { createMockServices } from './mock'
import { createRemoteClient } from './remote/client'
import { createRemoteServices } from './remote'
import type { ApiMode, AppServices } from './contracts'

const apiMode = process.env.TARO_APP_API_MODE || 'mock'
const apiBaseUrl = process.env.TARO_APP_API_BASE_URL || 'http://localhost:8080'

export function createServicesForMode(mode: string = apiMode, baseUrl = apiBaseUrl): AppServices {
  if (mode === 'mock') return createMockServices()
  if (mode === 'remote') return createRemoteServices(createRemoteClient(baseUrl))

  throw new Error(`Unsupported TARO_APP_API_MODE: ${mode}`)
}

export type { ApiMode, AppServices }

const services = createServicesForMode(apiMode)

export const {
  authService,
  userService,
  petService,
  locationService,
  nearbyService,
  inviteService,
  postService,
  reportService,
  uploadService,
  blockService
} = services
