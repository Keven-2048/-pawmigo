import { getStorageSync, removeStorageSync, setStorageSync } from '@tarojs/taro'
import { create } from 'zustand'
import { authService, userService } from '@/services'
import type { PrivacySettings, User } from '@/types/domain'

interface UserState {
  token: string
  user?: User
  loggedIn: boolean
  loading: boolean
  login: () => Promise<boolean>
  hydrate: () => Promise<void>
  updatePrivacy: (payload: PrivacySettings) => Promise<void>
  logout: () => void
}

export const useUserStore = create<UserState>((set) => ({
  token: getStorageSync('token') || '',
  user: undefined,
  loggedIn: !!getStorageSync('token'),
  loading: false,

  async login() {
    set({ loading: true })
    try {
      const result = await authService.login()
      setStorageSync('token', result.token)
      set({
        token: result.token,
        user: result.user,
        loggedIn: true,
        loading: false
      })
      return result.hasPet
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  async hydrate() {
    const token = getStorageSync('token')
    if (!token) return
    const user = await authService.me()
    set({ token, user, loggedIn: true })
  },

  async updatePrivacy(payload) {
    const user = await userService.updatePrivacy(payload)
    set({ user })
  },

  logout() {
    removeStorageSync('token')
    set({ token: '', user: undefined, loggedIn: false })
  }
}))
