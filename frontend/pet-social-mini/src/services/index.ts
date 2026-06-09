import type {
  CreateInvitePayload,
  CreatePetPayload,
  CreatePostPayload,
  CreateReportPayload,
  FeedType,
  ID,
  InviteStatus,
  LocationPayload,
  NearbyFilter,
  PrivacySettings
} from '@/types/domain'
import { mockApi } from './mock/api'

const apiMode = process.env.TARO_APP_API_MODE || 'mock'

function ensureMockMode() {
  if (apiMode !== 'mock') {
    throw new Error('Remote API mode is reserved for the later Go backend phase')
  }
}

function useMock<TArgs extends unknown[], TResult>(handler: (...args: TArgs) => Promise<TResult>) {
  return (...args: TArgs) => {
    ensureMockMode()
    return handler(...args)
  }
}

export const authService = {
  login: useMock(() => mockApi.login()),
  me: useMock(() => mockApi.me())
}

export const userService = {
  updatePrivacy: useMock((payload: PrivacySettings) => mockApi.updatePrivacy(payload)),
  blocks: useMock(() => mockApi.blocks())
}

export const petService = {
  myPets: useMock(() => mockApi.myPets()),
  detail: useMock((id: ID) => mockApi.petDetail(id)),
  create: useMock((payload: CreatePetPayload) => mockApi.createPet(payload)),
  update: useMock((id: ID, payload: CreatePetPayload) => mockApi.updatePet(id, payload)),
  delete: useMock((id: ID) => mockApi.deletePet(id)),
  setDefault: useMock((id: ID) => mockApi.setDefaultPet(id))
}

export const locationService = {
  update: useMock((payload: LocationPayload) => mockApi.updateLocation(payload))
}

export const nearbyService = {
  pets: useMock((filter?: Partial<NearbyFilter>, page?: number, pageSize?: number) =>
    mockApi.nearbyPets(filter, page, pageSize))
}

export const inviteService = {
  create: useMock((payload: CreateInvitePayload) => mockApi.createInvite(payload)),
  list: useMock((box: 'received' | 'sent', status?: InviteStatus) => mockApi.invites(box, status)),
  detail: useMock((id: ID) => mockApi.inviteDetail(id)),
  accept: useMock((id: ID) => mockApi.updateInviteStatus(id, 'accept')),
  reject: useMock((id: ID) => mockApi.updateInviteStatus(id, 'reject')),
  cancel: useMock((id: ID) => mockApi.updateInviteStatus(id, 'cancel'))
}

export const postService = {
  list: useMock((feed?: FeedType, page?: number, pageSize?: number) => mockApi.posts(feed, page, pageSize)),
  detail: useMock((id: ID) => mockApi.postDetail(id)),
  create: useMock((payload: CreatePostPayload) => mockApi.createPost(payload)),
  delete: useMock((id: ID) => mockApi.deletePost(id)),
  like: useMock((id: ID) => mockApi.toggleLike(id, true)),
  unlike: useMock((id: ID) => mockApi.toggleLike(id, false)),
  comments: useMock((postId: ID) => mockApi.comments(postId)),
  createComment: useMock((postId: ID, content: string) => mockApi.createComment(postId, content)),
  deleteComment: useMock((id: ID) => mockApi.deleteComment(id))
}

export const reportService = {
  create: useMock((payload: CreateReportPayload) => mockApi.createReport(payload))
}

export const blockService = {
  create: useMock((blockedUserId: ID, reason?: string) => mockApi.createBlock(blockedUserId, reason)),
  list: useMock(() => mockApi.blocks())
}
