export type ID = number

export type UserStatus = 'normal' | 'disabled' | 'banned' | 'deleted'
export type PetType = 'dog' | 'cat' | 'rabbit' | 'bird' | 'other'
export type Gender = 'unknown' | 'male' | 'female'
export type VaccineStatus = 'unknown' | 'partial' | 'completed'
export type InviteType = 'walk' | 'play' | 'park' | 'coffee' | 'photo' | 'event' | 'custom'
export type InviteStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'expired'
  | 'completed'
  | 'reported'
export type FeedType = 'recommend' | 'nearby' | 'following' | 'mine'
export type PostVisibility = 'public' | 'nearby' | 'followers' | 'private'
export type ReportTargetType = 'user' | 'pet' | 'post' | 'comment' | 'invite'

export interface PrivacySettings {
  allowNearbyVisible: boolean
  allowStrangerInvite: boolean
  allowComment: boolean
  showOwnerName: boolean
  showCity: boolean
  notificationEnabled: boolean
}

export interface User {
  id: ID
  openid?: string
  nickname: string
  avatarUrl: string
  city: string
  status: UserStatus
  phone?: string
  gender?: Gender
  lastLoginAt?: string
  privacy: PrivacySettings
}

export interface Pet {
  id: ID
  userId: ID
  name: string
  avatarUrl: string
  type: PetType
  breed: string
  gender: Gender
  birthday?: string
  weight?: number
  sterilized: boolean
  vaccineStatus: VaccineStatus
  personalityTags: string[]
  interestTags: string[]
  description: string
  isDefault: boolean
  visible: boolean
  status: 'normal' | 'hidden' | 'deleted'
  createdAt: string
  updatedAt: string
  ownerName?: string
  ownerAvatarUrl?: string
  distanceText?: string
  activeText?: string
  isFollowed?: boolean
}

export interface NearbyFilter {
  type: 'all' | PetType
  distance: 1000 | 3000 | 5000 | 10000
  gender: 'all' | 'male' | 'female'
  age: 'all' | 'lt1' | '1to3' | 'gt3'
  personalityTags: string[]
  interestTags: string[]
  canInviteOnly: boolean
  activeOnly: boolean
}

export interface NearbyPet extends Pet {
  distanceValue: number
  distanceText: string
  activeText: string
  canInvite: boolean
  commonInterestCount: number
}

export interface Invite {
  id: ID
  fromUserId: ID
  fromPetId: ID
  toUserId: ID
  toPetId: ID
  type: InviteType
  title: string
  description: string
  locationName: string
  meetTime: string
  status: InviteStatus
  createdAt: string
  updatedAt: string
  fromPet?: Pet
  toPet?: Pet
}

export interface Post {
  id: ID
  userId: ID
  petId: ID
  pet?: Pet
  content: string
  images: string[]
  locationName: string
  city: string
  topicTags: string[]
  visibility: PostVisibility
  likeCount: number
  commentCount: number
  liked: boolean
  status: 'normal' | 'hidden' | 'deleted'
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: ID
  postId: ID
  userId: ID
  petId?: ID
  pet?: Pet
  content: string
  status: 'normal' | 'hidden' | 'deleted'
  createdAt: string
  updatedAt: string
}

export interface Report {
  id: ID
  reporterUserId: ID
  targetType: ReportTargetType
  targetId: ID
  reason: string
  description: string
  images: string[]
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
}

export interface Block {
  id: ID
  userId: ID
  blockedUserId: ID
  reason: string
  createdAt: string
}

export interface PageResult<T> {
  list: T[]
  page: number
  pageSize: number
  total: number
}

export interface LoginResult {
  token: string
  user: User
  hasPet: boolean
}

export interface LocationPayload {
  latitude: number
  longitude: number
  city: string
  district: string
}

export interface CreatePetPayload {
  name: string
  avatarUrl: string
  type: PetType
  breed: string
  gender: Gender
  birthday?: string
  weight?: number
  sterilized: boolean
  vaccineStatus: VaccineStatus
  personalityTags: string[]
  interestTags: string[]
  description: string
  visible?: boolean
}

export interface CreateInvitePayload {
  fromPetId: ID
  toPetId: ID
  type: InviteType
  title: string
  description: string
  locationName: string
  meetTime: string
}

export interface CreatePostPayload {
  petId: ID
  content: string
  images: string[]
  locationName: string
  topicTags: string[]
  visibility: PostVisibility
}

export interface CreateReportPayload {
  targetType: ReportTargetType
  targetId: ID
  reason: string
  description: string
  images: string[]
}
