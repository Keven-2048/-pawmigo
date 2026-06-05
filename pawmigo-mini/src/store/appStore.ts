import { create } from 'zustand'

type EncounterMode = 'quick' | 'lasso' | 'swipe'
type FeedLayout = 'single' | 'waterfall' | 'magazine'

interface AppState {
  activeFilter: string
  isWalking: boolean
  selectedNearbyId: number
  invitedIds: number[]
  encounterMode: EncounterMode
  activeMatchId: number
  feedLayout: FeedLayout
  likedPostIds: number[]
  boneBoosts: Record<number, number>
  joinedTeamIds: number[]
  draftStickers: string[]
  setDraftStickers: (stickers: string[]) => void
  setFilter: (filter: string) => void
  toggleWalking: () => void
  selectNearby: (id: number) => void
  invite: (id: number) => void
  setEncounterMode: (mode: EncounterMode) => void
  chooseMatch: (id: number) => void
  setFeedLayout: (layout: FeedLayout) => void
  likePost: (id: number) => void
  sendBone: (id: number) => void
  joinTeam: (id: number) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeFilter: '全部',
  isWalking: false,
  selectedNearbyId: 201,
  invitedIds: [],
  encounterMode: 'quick',
  activeMatchId: 501,
  feedLayout: 'single',
  likedPostIds: [],
  boneBoosts: {},
  joinedTeamIds: [],
  draftStickers: [],
  setDraftStickers: (stickers) => set({ draftStickers: stickers }),
  setFilter: (filter) => set({ activeFilter: filter }),
  toggleWalking: () => set((state) => ({ isWalking: !state.isWalking })),
  selectNearby: (id) => set({ selectedNearbyId: id }),
  invite: (id) =>
    set((state) => ({
      invitedIds: state.invitedIds.includes(id)
        ? state.invitedIds
        : [...state.invitedIds, id],
    })),
  setEncounterMode: (mode) => set({ encounterMode: mode }),
  chooseMatch: (id) => set({ activeMatchId: id }),
  setFeedLayout: (layout) => set({ feedLayout: layout }),
  likePost: (id) =>
    set((state) => ({
      likedPostIds: state.likedPostIds.includes(id)
        ? state.likedPostIds.filter((postId) => postId !== id)
        : [...state.likedPostIds, id],
    })),
  sendBone: (id) =>
    set((state) => ({
      boneBoosts: {
        ...state.boneBoosts,
        [id]: (state.boneBoosts[id] ?? 0) + 1,
      },
    })),
  joinTeam: (id) =>
    set((state) => ({
      joinedTeamIds: state.joinedTeamIds.includes(id)
        ? state.joinedTeamIds
        : [...state.joinedTeamIds, id],
    })),
}))
