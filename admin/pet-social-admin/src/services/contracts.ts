export type AdminRole = 'super_admin' | 'admin' | 'auditor'

export interface AdminUser {
  id: number
  username: string
  nickname: string
  role: AdminRole
}

export interface DashboardStats {
  totalUsers: number
  totalPets: number
  totalPosts: number
  pendingReports: number
}

export interface AdminAuthService {
  login(
    username: string,
    password: string,
  ): Promise<{ token: string; admin: AdminUser }>
  me(): Promise<AdminUser>
}

export interface DashboardService {
  stats(): Promise<DashboardStats>
}

export interface AdminServices {
  authService: AdminAuthService
  dashboardService: DashboardService
}
