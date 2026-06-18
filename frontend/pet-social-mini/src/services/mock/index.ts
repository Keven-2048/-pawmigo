import type { AppServices } from '@/services/contracts'
import { mockApi } from './api'

export function createMockServices(): AppServices {
  return {
    authService: {
      login: () => mockApi.login(),
      me: () => mockApi.me()
    },
    userService: {
      updatePrivacy: (payload) => mockApi.updatePrivacy(payload),
      blocks: () => mockApi.blocks()
    },
    petService: {
      myPets: () => mockApi.myPets(),
      detail: (id) => mockApi.petDetail(id),
      create: (payload) => mockApi.createPet(payload),
      update: (id, payload) => mockApi.updatePet(id, payload),
      delete: (id) => mockApi.deletePet(id),
      setDefault: (id) => mockApi.setDefaultPet(id)
    },
    locationService: {
      update: (payload) => mockApi.updateLocation(payload)
    },
    nearbyService: {
      pets: (filter, page, pageSize) => mockApi.nearbyPets(filter, page, pageSize)
    },
    inviteService: {
      create: (payload) => mockApi.createInvite(payload),
      list: (box, status) => mockApi.invites(box, status),
      detail: (id) => mockApi.inviteDetail(id),
      accept: (id) => mockApi.updateInviteStatus(id, 'accept'),
      reject: (id) => mockApi.updateInviteStatus(id, 'reject'),
      cancel: (id) => mockApi.updateInviteStatus(id, 'cancel')
    },
    postService: {
      list: (feed, page, pageSize) => mockApi.posts(feed, page, pageSize),
      detail: (id) => mockApi.postDetail(id),
      create: (payload) => mockApi.createPost(payload),
      delete: (id) => mockApi.deletePost(id),
      like: (id) => mockApi.toggleLike(id, true),
      unlike: (id) => mockApi.toggleLike(id, false),
      comments: (postId) => mockApi.comments(postId),
      createComment: (postId, content) => mockApi.createComment(postId, content),
      deleteComment: (id) => mockApi.deleteComment(id)
    },
    reportService: {
      create: (payload) => mockApi.createReport(payload)
    },
    uploadService: {
      uploadImage: async (tempFilePath) => tempFilePath
    },
    blockService: {
      create: (blockedUserId, reason) => mockApi.createBlock(blockedUserId, reason),
      list: () => mockApi.blocks()
    }
  }
}
