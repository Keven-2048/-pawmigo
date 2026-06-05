import Taro from '@tarojs/taro'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { taroStorage } from './taroStorage'
import { resetDb } from '../mock/db'
import { api } from '../services/api'
import { Pet, PetInput, User } from '../services/api'

interface SessionState {
  user: User | null
  pets: Pet[]
  activePetId: number | null
  loading: boolean
  error: string | null
  login: () => Promise<void>
  refreshMe: () => Promise<void>
  createPet: (input: PetInput) => Promise<Pet>
  setActivePet: (id: number) => void
  logout: () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      user: null,
      pets: [],
      activePetId: null,
      loading: false,
      error: null,
      login: async () => {
        set({ loading: true, error: null })
        try {
          const { code } = await Taro.login()
          const res = await api.wxLogin(code)
          Taro.setStorageSync('jwt', res.token)
          set({ user: res.user })
          await get().refreshMe()
        } catch (e) {
          set({ error: (e as Error).message })
          throw e
        } finally {
          set({ loading: false })
        }
      },
      refreshMe: async () => {
        const { user, pets } = await api.me()
        set({ user, pets, activePetId: get().activePetId ?? pets[0]?.id ?? null })
      },
      createPet: async (input) => {
        const pet = await api.createPet(input)
        set((s) => ({ pets: [pet, ...s.pets], activePetId: pet.id }))
        return pet
      },
      setActivePet: (id) => set({ activePetId: id }),
      logout: () => {
        Taro.removeStorageSync('jwt')
        resetDb()
        set({ user: null, pets: [], activePetId: null, error: null })
      },
    }),
    {
      name: 'pawmigo:session',
      storage: createJSONStorage(() => taroStorage),
      partialize: (s) => ({ user: s.user, pets: s.pets, activePetId: s.activePetId }),
    },
  ),
)
