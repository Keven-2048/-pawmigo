import type { AdminServices } from '../contracts'
import { adminRequest } from './client'

export function createRemoteServices(): AdminServices {
  return {
    authService: {
      login(username, password) {
        return adminRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username, password }),
        })
      },
      me() {
        return adminRequest('/me')
      },
    },
    dashboardService: {
      stats() {
        return adminRequest('/dashboard/stats')
      },
    },
  }
}
