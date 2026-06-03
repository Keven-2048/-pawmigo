import Taro from '@tarojs/taro'
import { create } from 'zustand'
import { api, Pet, User } from '../services/api'

interface AuthState {
  user: User | null
  pets: Pet[]
  activePetId: number | null
  login: () => Promise<void>
  refreshMe: () => Promise<void>
  setActivePet: (id: number) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  pets: [],
  activePetId: null,
  login: async () => {
    const { code } = await Taro.login()
    const res = await api.wxLogin(code)
    Taro.setStorageSync('jwt', res.token)
    set({ user: res.user })
    await get().refreshMe()
  },
  refreshMe: async () => {
    const { user, pets } = await api.me()
    set({
      user,
      pets,
      activePetId: get().activePetId ?? pets[0]?.id ?? null,
    })
  },
  setActivePet: (id) => set({ activePetId: id }),
}))
