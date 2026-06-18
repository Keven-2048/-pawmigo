import { createMockServices } from './mock'
import { createRemoteServices } from './remote'

const apiMode = import.meta.env.VITE_API_MODE || 'mock'

export const services =
  apiMode === 'remote' ? createRemoteServices() : createMockServices()

export const { authService, dashboardService } = services
