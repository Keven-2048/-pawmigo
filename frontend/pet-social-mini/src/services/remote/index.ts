import type {
  Block,
  Comment,
  Invite,
  LocationPayload,
  LoginResult,
  NearbyPet,
  PageResult,
  Pet,
  Post,
  Report,
  User
} from '@/types/domain'
import type { AppServices } from '@/services/contracts'
import type { RemoteClient } from './client'

export function createRemoteServices(client: RemoteClient): AppServices {
  return {
    authService: {
      login: () => client.post<LoginResult>('/auth/wechat-login', { code: 'dev-login-code' }),
      me: () => client.get<User>('/user/me')
    },
    userService: {
      updatePrivacy: (payload) => client.put<User>('/user/privacy', payload),
      blocks: () => client.get<Block[]>('/blocks')
    },
    petService: {
      myPets: () => client.get<Pet[]>('/pets/my'),
      detail: (id) => client.get<Pet>(`/pets/${id}`),
      create: (payload) => client.post<Pet>('/pets', payload),
      update: (id, payload) => client.put<Pet>(`/pets/${id}`, payload),
      delete: (id) => client.delete<void>(`/pets/${id}`),
      setDefault: (id) => client.post<Pet>(`/pets/${id}/default`)
    },
    locationService: {
      update: (payload) => client.post<LocationPayload>('/location/update', payload)
    },
    nearbyService: {
      pets: (filter, page, pageSize) => client.get<PageResult<NearbyPet>>('/nearby/pets', {
        ...filter,
        page,
        page_size: pageSize
      })
    },
    inviteService: {
      create: (payload) => client.post<Invite>('/invites', payload),
      list: (box, status) => client.get<Invite[]>('/invites', { box, status }),
      detail: (id) => client.get<Invite>(`/invites/${id}`),
      accept: (id) => client.post<Invite>(`/invites/${id}/accept`),
      reject: (id) => client.post<Invite>(`/invites/${id}/reject`),
      cancel: (id) => client.post<Invite>(`/invites/${id}/cancel`)
    },
    postService: {
      list: (feed, page, pageSize) => client.get<PageResult<Post>>('/posts', {
        feed,
        page,
        page_size: pageSize
      }),
      detail: (id) => client.get<Post>(`/posts/${id}`),
      create: (payload) => client.post<Post>('/posts', payload),
      delete: (id) => client.delete<void>(`/posts/${id}`),
      like: (id) => client.post<Post>(`/posts/${id}/like`),
      unlike: (id) => client.delete<Post>(`/posts/${id}/like`),
      comments: (postId) => client.get<Comment[]>(`/posts/${postId}/comments`),
      createComment: (postId, content) => client.post<Comment>(`/posts/${postId}/comments`, { content }),
      deleteComment: (id) => client.delete<void>(`/comments/${id}`)
    },
    reportService: {
      create: (payload) => client.post<Report>('/reports', payload)
    },
    blockService: {
      create: (blockedUserId, reason) => client.post<Block>('/blocks', { blockedUserId, reason }),
      list: () => client.get<Block[]>('/blocks')
    }
  }
}
