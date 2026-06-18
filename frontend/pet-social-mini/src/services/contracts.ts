import type {
  Block,
  Comment,
  CreateInvitePayload,
  CreatePetPayload,
  CreatePostPayload,
  CreateReportPayload,
  FeedType,
  ID,
  Invite,
  InviteStatus,
  LocationPayload,
  LoginResult,
  NearbyFilter,
  NearbyPet,
  PageResult,
  Pet,
  Post,
  PrivacySettings,
  Report,
  User
} from '@/types/domain'

export type ApiMode = 'mock' | 'remote'

export interface AuthService {
  login: () => Promise<LoginResult>
  me: () => Promise<User>
}

export interface UserService {
  updatePrivacy: (payload: PrivacySettings) => Promise<User>
  blocks: () => Promise<Block[]>
}

export interface PetService {
  myPets: () => Promise<Pet[]>
  detail: (id: ID) => Promise<Pet>
  create: (payload: CreatePetPayload) => Promise<Pet>
  update: (id: ID, payload: CreatePetPayload) => Promise<Pet>
  delete: (id: ID) => Promise<void>
  setDefault: (id: ID) => Promise<Pet>
}

export interface LocationService {
  update: (payload: LocationPayload) => Promise<LocationPayload>
}

export interface NearbyService {
  pets: (filter?: Partial<NearbyFilter>, page?: number, pageSize?: number) => Promise<PageResult<NearbyPet>>
}

export interface InviteService {
  create: (payload: CreateInvitePayload) => Promise<Invite>
  list: (box: 'received' | 'sent', status?: InviteStatus) => Promise<Invite[]>
  detail: (id: ID) => Promise<Invite>
  accept: (id: ID) => Promise<Invite>
  reject: (id: ID) => Promise<Invite>
  cancel: (id: ID) => Promise<Invite>
}

export interface PostService {
  list: (feed?: FeedType, page?: number, pageSize?: number) => Promise<PageResult<Post>>
  detail: (id: ID) => Promise<Post>
  create: (payload: CreatePostPayload) => Promise<Post>
  delete: (id: ID) => Promise<void>
  like: (id: ID) => Promise<Post>
  unlike: (id: ID) => Promise<Post>
  comments: (postId: ID) => Promise<Comment[]>
  createComment: (postId: ID, content: string) => Promise<Comment>
  deleteComment: (id: ID) => Promise<void>
}

export interface ReportService {
  create: (payload: CreateReportPayload) => Promise<Report>
}

export interface UploadService {
  uploadImage: (tempFilePath: string) => Promise<string>
}

export interface BlockService {
  create: (blockedUserId: ID, reason?: string) => Promise<Block>
  list: () => Promise<Block[]>
}

export interface AppServices {
  authService: AuthService
  userService: UserService
  petService: PetService
  locationService: LocationService
  nearbyService: NearbyService
  inviteService: InviteService
  postService: PostService
  reportService: ReportService
  uploadService: UploadService
  blockService: BlockService
}
