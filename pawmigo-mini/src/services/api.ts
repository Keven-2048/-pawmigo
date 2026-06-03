import { request } from './request'

export interface User {
  id: number
  nickname: string
  avatar: string
  boneBalance: number
}

export interface Pet {
  id: number
  ownerId: number
  name: string
  breed: string
  gender: string
  age: number
  personality: string[]
  bio: string
  boneCount: number
}

export interface PetInput {
  name?: string
  breed?: string
  gender?: string
  age?: number
  personality?: string[]
  bio?: string
}

export interface LoginResult {
  token: string
  user: User
}

export type DogSize = '小型' | '中型' | '大型'
export type MediaTone = 'park' | 'sunset' | 'river' | 'studio'
export type TeamType = '品种团' | '性格团' | '地点团'

export interface NearbyPet {
  id: number
  name: string
  breed: string
  avatar: string
  owner: string
  distance: string
  minutes: number
  size: DogSize
  personality: string[]
  route: string
  lng: number
  lat: number
}

export interface MapFilter {
  size?: DogSize | '全部'
  personality?: string | '全部'
}

export interface Comment {
  id: number
  postId: number
  author: string
  text: string
  time: string
}

export interface FeedPost {
  id: number
  petName: string
  breed: string
  location: string
  caption: string
  mediaTone: MediaTone
  stickers: string[]
  likes: number
  bones: number
  comments: number
  liked: boolean
}

export interface PostInput {
  caption: string
  location: string
  mediaTone: MediaTone
  stickers: string[]
}

export interface Team {
  id: number
  name: string
  type: TeamType
  tag: string
  members: number
  activity: string
  schedule: string
  vibe: string
  joined: boolean
}

export interface TeamInput {
  name: string
  type: TeamType
  tag: string
  schedule: string
}

export interface EncounterCandidate {
  id: number
  name: string
  breed: string
  distance: string
  score: number
  reason: string
  meetup: string
  window: string
}

export type EncounterStatus = 'waiting' | 'accepted' | 'meeting' | 'ongoing' | 'done'
export type EncounterMode = 'radar' | 'lasso' | 'swipe'

export interface Encounter {
  id: number
  targetId: number
  targetName: string
  status: EncounterStatus
  meetingPoint: string
  distanceLeft: number
  createdAt: number
}

export interface WalletTxn {
  id: number
  title: string
  amount: number // +earn / -spend
  time: string
}

export interface WalletTask {
  id: number
  title: string
  reward: number
  done: boolean
}

export interface ShopItem {
  id: number
  name: string
  cost: number
  tag: string
}

export interface ChatMessage {
  id: number
  peerId: number
  side: 'left' | 'right'
  name: string
  text: string
  time: string
}

export interface Trophy {
  id: number
  name: string
  desc: string
  unlocked: boolean
}

export interface SafetyItem {
  title: string
  meta: string
  ok: boolean
}

export interface AppNotification {
  id: number
  kind: 'encounter' | 'team' | 'bone' | 'system'
  text: string
  time: string
  read: boolean
}

export interface Settings {
  notifications: boolean
  preciseLocation: boolean
  camera: boolean
}

export const api = {
  wxLogin: (code: string) =>
    request<LoginResult>('POST', '/auth/wx-login', { code }),
  me: () => request<{ user: User; pets: Pet[] }>('GET', '/me'),
  createPet: (input: PetInput) => request<Pet>('POST', '/pets', input),
  updatePet: (id: number, input: PetInput) =>
    request<Pet>('PUT', `/pets/${id}`, input),
}
