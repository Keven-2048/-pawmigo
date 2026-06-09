import { create } from 'zustand'
import { locationService } from '@/services'
import type { LocationPayload } from '@/types/domain'

interface LocationState {
  authorized: boolean
  city: string
  district: string
  loading: boolean
  authorizeMock: () => Promise<void>
  decline: () => void
}

const mockLocation: LocationPayload = {
  latitude: 31.2304,
  longitude: 121.4737,
  city: '上海',
  district: '徐汇区'
}

export const useLocationStore = create<LocationState>((set) => ({
  authorized: false,
  city: '',
  district: '',
  loading: false,

  async authorizeMock() {
    set({ loading: true })
    const result = await locationService.update(mockLocation)
    set({
      authorized: true,
      city: result.city,
      district: result.district,
      loading: false
    })
  },

  decline() {
    set({ authorized: false, city: '', district: '', loading: false })
  }
}))
