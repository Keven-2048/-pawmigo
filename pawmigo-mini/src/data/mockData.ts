/**
 * Deprecated — prefer using `api` (from services/api) and `useSessionStore` (from store/sessionStore).
 * This file is kept for type re-exports only; data should be fetched via the API layer.
 */
export type {
  NearbyPet, FeedPost, Team, EncounterCandidate,
} from '../services/api'

export { demoUser, demoPets, nearbyPets, feedPosts, teams, encounterCandidates } from './legacyData'
export { stickerPacks } from './legacyData'
