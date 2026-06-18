import type { AdminServices, AdminUser, DashboardStats } from '../contracts'

const mockAdmin: AdminUser = {
  id: 1,
  username: 'admin',
  nickname: '超级管理员',
  role: 'super_admin',
}

const mockStats: DashboardStats = {
  totalUsers: 1286,
  totalPets: 934,
  totalPosts: 3421,
  pendingReports: 18,
}

export function createMockServices(): AdminServices {
  return {
    authService: {
      async login(username, password) {
        if (username === 'admin' && password === 'admin123') {
          return {
            token: 'mock-admin-token',
            admin: mockAdmin,
          }
        }

        throw new Error('用户名或密码错误')
      },
      async me() {
        return mockAdmin
      },
    },
    dashboardService: {
      async stats() {
        return mockStats
      },
    },
  }
}
