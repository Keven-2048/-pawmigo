import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { taroStorage } from './taroStorage'
import { api, Encounter, EncounterCandidate } from '../services/api'
import { useSessionStore } from './sessionStore'

interface EncounterState {
  current: Encounter | null
  candidate: EncounterCandidate | null
  loading: boolean
  error: string | null
  /** Begin a new encounter for the chosen candidate (status: waiting). */
  start: (candidate: EncounterCandidate) => Promise<Encounter>
  /** Partner accepts (status: accepted). */
  accept: () => Promise<Encounter | null>
  /** Lock in a meeting point (status: meeting). */
  confirmPoint: (point: string) => Promise<Encounter | null>
  /** Submit feedback, award bones, clear the journey (status: done). */
  complete: (rating: number, tags: string[]) => Promise<void>
  /** Abandon the in-progress encounter. */
  cancel: () => Promise<void>
  /** Recover any in-progress encounter from the persisted mock db on launch. */
  hydrate: () => Promise<void>
}

export const useEncounterStore = create<EncounterState>()(
  persist(
    (set, get) => ({
      current: null,
      candidate: null,
      loading: false,
      error: null,
      start: async (candidate) => {
        set({ loading: true, error: null, candidate })
        try {
          const enc = await api.createEncounter(candidate.id)
          set({ current: enc })
          return enc
        } catch (e) {
          set({ error: (e as Error).message })
          throw e
        } finally {
          set({ loading: false })
        }
      },
      accept: async () => {
        const cur = get().current
        if (!cur || cur.status !== 'waiting') return cur
        const enc = await api.acceptEncounter(cur.id)
        set({ current: enc })
        return enc
      },
      confirmPoint: async (point) => {
        const cur = get().current
        if (!cur) return null
        const enc = await api.confirmMeetingPoint(cur.id, point)
        set({ current: enc })
        return enc
      },
      complete: async (rating, tags) => {
        const cur = get().current
        if (!cur) return
        await api.submitFeedback(cur.id, rating, tags)
        set({ current: null, candidate: null })
        // Sync the bone reward into the session balance.
        await useSessionStore.getState().refreshMe()
      },
      cancel: async () => {
        const cur = get().current
        if (cur) await api.cancelEncounter(cur.id).catch(() => {})
        set({ current: null, candidate: null })
      },
      hydrate: async () => {
        try {
          const enc = await api.getActiveEncounter()
          set({ current: enc })
        } catch {
          // best-effort recovery; leave persisted snapshot in place
        }
      },
    }),
    {
      name: 'pawmigo:encounter',
      storage: createJSONStorage(() => taroStorage),
      partialize: (s) => ({ current: s.current, candidate: s.candidate }),
    },
  ),
)
