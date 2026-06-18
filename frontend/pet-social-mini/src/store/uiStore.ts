import { create } from 'zustand'

interface UiState {
  busy: boolean
  setBusy: (busy: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  busy: false,
  setBusy: (busy) => set({ busy })
}))
