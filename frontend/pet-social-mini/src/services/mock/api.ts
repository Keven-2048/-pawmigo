import { DEFAULT_AVATARS, DEFAULT_FILTER } from '@/constants/options'
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
import { distanceText, isPast, nowIso } from '@/utils/format'
import {
  currentDefaultPet,
  currentUser,
  db,
  enrichPet,
  isBlockedBetween,
  nextId,
  ownerOfPet,
  visiblePetById
} from './db'
import { assertRule, mockDelay, pageList } from './helpers'

function currentUserPets() {
  return db.pets
    .filter((pet) => pet.userId === db.sessionUserId && pet.status === 'normal')
    .map(enrichPet)
}

function ensurePetOwner(petId: ID) {
  const pet = visiblePetById(petId)
  assertRule(pet, '宠物不存在')
  assertRule(pet.userId === db.sessionUserId, '只能操作自己的宠物')
  return pet
}

function assertPetPayload(payload: CreatePetPayload) {
  assertRule(payload.name.trim(), '请填写宠物昵称')
  assertRule(payload.personalityTags.length <= 10, '性格标签最多 10 个')
  assertRule(payload.interestTags.length <= 10, '兴趣标签最多 10 个')
  assertRule(payload.description.length <= 500, '简介最多 500 字')
}

function hydrateInvite(invite: Invite): Invite {
  const fromPet = visiblePetById(invite.fromPetId)
  const toPet = visiblePetById(invite.toPetId)
  return {
    ...invite,
    fromPet: fromPet ? enrichPet(fromPet) : undefined,
    toPet: toPet ? enrichPet(toPet) : undefined
  }
}

function canCurrentUserSeeInvite(invite: Invite) {
  const related = invite.fromUserId === db.sessionUserId || invite.toUserId === db.sessionUserId
  const peerUserId = invite.fromUserId === db.sessionUserId ? invite.toUserId : invite.fromUserId
  return related && !isBlockedBetween(db.sessionUserId, peerUserId)
}

function hydratePost(post: Post): Post {
  const pet = visiblePetById(post.petId)
  return {
    ...post,
    pet: pet ? enrichPet(pet) : undefined
  }
}

function visiblePostById(id: ID): Post {
  const post = db.posts.find((item) => item.id === id && item.status === 'normal')
  assertRule(post, '动态不存在')
  assertRule(post.visibility !== 'private' || post.userId === db.sessionUserId, '无权查看该动态')
  assertRule(!isBlockedBetween(db.sessionUserId, post.userId), '该动态暂不可见')
  return post
}

function hydrateComment(comment: Comment): Comment {
  const pet = comment.petId ? visiblePetById(comment.petId) : undefined
  return {
    ...comment,
    pet: pet ? enrichPet(pet) : undefined
  }
}

function canCurrentUserSeePet(pet: Pet) {
  const owner = ownerOfPet(pet)
  if (!owner || owner.status !== 'normal') return false
  if (pet.userId === db.sessionUserId) return true
  if (isBlockedBetween(db.sessionUserId, pet.userId)) return false
  if (!owner.privacy.allowNearbyVisible || !pet.visible) return false
  return pet.status === 'normal'
}

function canInvitePet(pet: Pet) {
  const owner = ownerOfPet(pet)
  if (!owner || pet.userId === db.sessionUserId) return false
  if (isBlockedBetween(db.sessionUserId, pet.userId)) return false
  return owner.privacy.allowStrangerInvite
}

function ensureReportTargetVisible(payload: CreateReportPayload) {
  if (payload.targetType === 'user') {
    const user = db.users.find((item) => item.id === payload.targetId && item.status === 'normal')
    assertRule(user && user.id !== db.sessionUserId && !isBlockedBetween(db.sessionUserId, user.id), '举报目标不存在')
    return
  }

  if (payload.targetType === 'pet') {
    const pet = visiblePetById(payload.targetId)
    assertRule(pet && canCurrentUserSeePet(pet), '举报目标不存在')
    return
  }

  if (payload.targetType === 'post') {
    try {
      visiblePostById(payload.targetId)
    } catch {
      assertRule(false, '举报目标不存在')
    }
    return
  }

  if (payload.targetType === 'comment') {
    const comment = db.comments.find((item) => item.id === payload.targetId && item.status === 'normal')
    assertRule(comment, '举报目标不存在')
    try {
      visiblePostById(comment.postId)
    } catch {
      assertRule(false, '举报目标不存在')
    }
    return
  }

  if (payload.targetType === 'invite') {
    const invite = db.invites.find((item) => item.id === payload.targetId)
    assertRule(invite && canCurrentUserSeeInvite(invite), '举报目标不存在')
  }
}

function getAgeGroup(pet: Pet) {
  if (!pet.birthday) return 'all'
  const birth = new Date(pet.birthday)
  const years = (Date.now() - birth.getTime()) / (365 * 24 * 60 * 60 * 1000)
  if (years < 1) return 'lt1'
  if (years <= 3) return '1to3'
  return 'gt3'
}

export const mockApi = {
  async login(): Promise<LoginResult> {
    const user = currentUser()
    return mockDelay({
      token: db.token,
      user,
      hasPet: currentUserPets().length > 0
    })
  },

  async me(): Promise<User> {
    return mockDelay(currentUser())
  },

  async updatePrivacy(payload: PrivacySettings): Promise<User> {
    const user = currentUser()
    user.privacy = { ...payload }
    return mockDelay({ ...user })
  },

  async myPets(): Promise<Pet[]> {
    return mockDelay(currentUserPets())
  },

  async petDetail(id: ID): Promise<Pet> {
    const pet = visiblePetById(id)
    assertRule(pet, '宠物不存在')
    assertRule(canCurrentUserSeePet(pet), '该宠物暂不可见')
    return mockDelay(enrichPet(pet))
  },

  async createPet(payload: CreatePetPayload): Promise<Pet> {
    assertPetPayload(payload)

    const hasPet = currentUserPets().length > 0
    const time = nowIso()
    const pet: Pet = {
      id: nextId(),
      userId: db.sessionUserId,
      name: payload.name.trim(),
      avatarUrl: payload.avatarUrl || DEFAULT_AVATARS[payload.type],
      type: payload.type,
      breed: payload.breed,
      gender: payload.gender,
      birthday: payload.birthday,
      weight: payload.weight,
      sterilized: payload.sterilized,
      vaccineStatus: payload.vaccineStatus,
      personalityTags: payload.personalityTags,
      interestTags: payload.interestTags,
      description: payload.description,
      isDefault: !hasPet,
      visible: payload.visible ?? true,
      status: 'normal',
      createdAt: time,
      updatedAt: time
    }
    db.pets.unshift(pet)
    return mockDelay(enrichPet(pet))
  },

  async updatePet(id: ID, payload: CreatePetPayload): Promise<Pet> {
    assertPetPayload(payload)
    const pet = ensurePetOwner(id)
    Object.assign(pet, {
      ...payload,
      name: payload.name.trim(),
      avatarUrl: payload.avatarUrl || DEFAULT_AVATARS[payload.type],
      updatedAt: nowIso()
    })
    return mockDelay(enrichPet(pet))
  },

  async deletePet(id: ID): Promise<void> {
    const pet = ensurePetOwner(id)
    pet.status = 'deleted'
    pet.updatedAt = nowIso()
    if (pet.isDefault) {
      const nextDefault = db.pets.find((item) => item.userId === db.sessionUserId && item.status === 'normal')
      if (nextDefault) nextDefault.isDefault = true
    }
    return mockDelay(undefined)
  },

  async setDefaultPet(id: ID): Promise<Pet> {
    const pet = ensurePetOwner(id)
    db.pets.forEach((item) => {
      if (item.userId === db.sessionUserId) item.isDefault = item.id === id
    })
    return mockDelay(enrichPet(pet))
  },

  async updateLocation(payload: LocationPayload): Promise<LocationPayload> {
    db.locationAuthorized = true
    const user = currentUser()
    user.city = payload.city
    return mockDelay(payload)
  },

  async nearbyPets(
    filter: Partial<NearbyFilter> = {},
    page = 1,
    pageSize = 20
  ): Promise<PageResult<NearbyPet>> {
    const merged = { ...DEFAULT_FILTER, ...filter } as NearbyFilter
    const myPet = currentDefaultPet()
    const myInterests = new Set(myPet?.interestTags ?? [])
    const list = db.pets
      .filter((pet) => pet.userId !== db.sessionUserId)
      .filter(canCurrentUserSeePet)
      .map((pet) => {
        const distanceValue = db.distances[pet.id] ?? 9000
        const commonInterestCount = pet.interestTags.filter((tag) => myInterests.has(tag)).length
        return {
          ...enrichPet(pet),
          distanceValue,
          distanceText: distanceText(distanceValue),
          activeText: pet.updatedAt.includes(nowIso().slice(0, 10)) ? '今天在线' : '最近活跃',
          canInvite: canInvitePet(pet),
          commonInterestCount
        }
      })
      .filter((pet) => merged.type === 'all' || pet.type === merged.type)
      .filter((pet) => merged.gender === 'all' || pet.gender === merged.gender)
      .filter((pet) => merged.age === 'all' || getAgeGroup(pet) === merged.age)
      .filter((pet) => pet.distanceValue <= merged.distance)
      .filter((pet) => !merged.canInviteOnly || pet.canInvite)
      .filter((pet) => !merged.activeOnly || pet.activeText.includes('今天'))
      .filter((pet) =>
        merged.personalityTags.length === 0 ||
        merged.personalityTags.some((tag) => pet.personalityTags.includes(tag))
      )
      .filter((pet) =>
        merged.interestTags.length === 0 ||
        merged.interestTags.some((tag) => pet.interestTags.includes(tag))
      )
      .sort(
        (a, b) =>
          a.distanceValue - b.distanceValue ||
          b.commonInterestCount - a.commonInterestCount ||
          b.updatedAt.localeCompare(a.updatedAt)
      )

    return mockDelay(pageList(list, page, pageSize))
  },

  async createInvite(payload: CreateInvitePayload): Promise<Invite> {
    const fromPet = ensurePetOwner(payload.fromPetId)
    const toPet = visiblePetById(payload.toPetId)
    assertRule(toPet, '接收宠物不存在')
    assertRule(toPet.userId !== db.sessionUserId, '不能邀请自己的宠物')
    assertRule(!isBlockedBetween(db.sessionUserId, toPet.userId), '你们暂时不能互相邀请')
    const owner = ownerOfPet(toPet)
    assertRule(owner?.privacy.allowStrangerInvite, '对方暂未开放陌生邀请')
    assertRule(!isPast(payload.meetTime), '见面时间不能早于当前时间')
    const dayStart = new Date()
    dayStart.setHours(0, 0, 0, 0)
    const todayCount = db.invites.filter(
      (invite) =>
        invite.fromUserId === db.sessionUserId &&
        new Date(invite.createdAt).getTime() >= dayStart.getTime()
    ).length
    assertRule(todayCount < 10, '今天的邀请次数已用完')
    const duplicated = db.invites.some(
      (invite) =>
        invite.fromUserId === db.sessionUserId &&
        invite.toPetId === payload.toPetId &&
        invite.status === 'pending' &&
        Date.now() - new Date(invite.createdAt).getTime() < 24 * 60 * 60 * 1000
    )
    assertRule(!duplicated, '24 小时内已经向这只宠物发过邀请')

    const time = nowIso()
    const invite: Invite = {
      id: nextId(),
      fromUserId: db.sessionUserId,
      fromPetId: fromPet.id,
      toUserId: toPet.userId,
      toPetId: toPet.id,
      type: payload.type,
      title: payload.title,
      description: payload.description,
      locationName: payload.locationName,
      meetTime: payload.meetTime,
      status: 'pending',
      createdAt: time,
      updatedAt: time
    }
    db.invites.unshift(invite)
    return mockDelay(hydrateInvite(invite))
  },

  async invites(box: 'received' | 'sent', status?: InviteStatus): Promise<Invite[]> {
    const list = db.invites
      .filter((invite) => (box === 'received' ? invite.toUserId === db.sessionUserId : invite.fromUserId === db.sessionUserId))
      .filter(canCurrentUserSeeInvite)
      .filter((invite) => !status || invite.status === status)
      .map((invite) => {
        if (invite.status === 'pending' && isPast(invite.meetTime)) {
          invite.status = 'expired'
        }
        return hydrateInvite(invite)
      })
    return mockDelay(list)
  },

  async inviteDetail(id: ID): Promise<Invite> {
    const invite = db.invites.find((item) => item.id === id)
    assertRule(invite, '邀请不存在')
    assertRule(invite.fromUserId === db.sessionUserId || invite.toUserId === db.sessionUserId, '无权查看该邀请')
    assertRule(canCurrentUserSeeInvite(invite), '该邀请暂不可见')
    return mockDelay(hydrateInvite(invite))
  },

  async updateInviteStatus(id: ID, action: 'accept' | 'reject' | 'cancel'): Promise<Invite> {
    const invite = db.invites.find((item) => item.id === id)
    assertRule(invite, '邀请不存在')
    assertRule(canCurrentUserSeeInvite(invite), '该邀请暂不可见')
    assertRule(invite.status === 'pending', '当前邀请状态不可操作')
    assertRule(!isPast(invite.meetTime), '邀请已过期')

    if (action === 'cancel') {
      assertRule(invite.fromUserId === db.sessionUserId, '只有发起人可以取消邀请')
      invite.status = 'cancelled'
    } else {
      assertRule(invite.toUserId === db.sessionUserId, '只有接收人可以处理邀请')
      invite.status = action === 'accept' ? 'accepted' : 'rejected'
    }
    invite.updatedAt = nowIso()
    return mockDelay(hydrateInvite(invite))
  },

  async posts(feed: FeedType = 'recommend', page = 1, pageSize = 20): Promise<PageResult<Post>> {
    const visible = db.posts
      .filter((post) => post.status === 'normal')
      .filter((post) => {
        if (post.visibility === 'private') return post.userId === db.sessionUserId
        if (feed === 'mine') return post.userId === db.sessionUserId
        const pet = visiblePetById(post.petId)
        return !!pet && !isBlockedBetween(db.sessionUserId, post.userId)
      })
      .filter((post) => feed !== 'nearby' || post.visibility === 'nearby' || post.city === currentUser().city)
      .filter((post) => feed !== 'following' || post.liked)
      .map(hydratePost)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return mockDelay(pageList(visible, page, pageSize))
  },

  async postDetail(id: ID): Promise<Post> {
    const post = visiblePostById(id)
    return mockDelay(hydratePost(post))
  },

  async createPost(payload: CreatePostPayload): Promise<Post> {
    ensurePetOwner(payload.petId)
    assertRule(payload.content.trim() || payload.images.length > 0, '请填写文字或选择图片')
    assertRule(payload.content.length <= 1000, '动态文字最多 1000 字')
    assertRule(payload.images.length <= 9, '图片最多 9 张')
    const time = nowIso()
    const post: Post = {
      id: nextId(),
      userId: db.sessionUserId,
      petId: payload.petId,
      content: payload.content.trim(),
      images: payload.images,
      locationName: payload.locationName,
      city: currentUser().city,
      topicTags: payload.topicTags,
      visibility: payload.visibility,
      likeCount: 0,
      commentCount: 0,
      liked: false,
      status: 'normal',
      createdAt: time,
      updatedAt: time
    }
    db.posts.unshift(post)
    return mockDelay(hydratePost(post))
  },

  async deletePost(id: ID): Promise<void> {
    const post = db.posts.find((item) => item.id === id)
    assertRule(post, '动态不存在')
    assertRule(post.userId === db.sessionUserId, '只能删除自己的动态')
    post.status = 'deleted'
    post.commentCount = 0
    db.comments.forEach((comment) => {
      if (comment.postId === post.id && comment.status === 'normal') {
        comment.status = 'deleted'
        comment.updatedAt = nowIso()
      }
    })
    return mockDelay(undefined)
  },

  async toggleLike(id: ID, liked: boolean): Promise<Post> {
    const post = visiblePostById(id)
    if (liked && !post.liked) post.likeCount += 1
    if (!liked && post.liked) post.likeCount = Math.max(0, post.likeCount - 1)
    post.liked = liked
    return mockDelay(hydratePost(post))
  },

  async comments(postId: ID): Promise<Comment[]> {
    visiblePostById(postId)
    const list = db.comments
      .filter((comment) => comment.postId === postId && comment.status === 'normal')
      .map(hydrateComment)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    return mockDelay(list)
  },

  async createComment(postId: ID, content: string): Promise<Comment> {
    assertRule(content.trim(), '请填写评论内容')
    assertRule(content.length <= 500, '评论最多 500 字')
    const post = visiblePostById(postId)
    const owner = db.users.find((user) => user.id === post.userId)
    assertRule(owner?.privacy.allowComment || post.userId === db.sessionUserId, '对方暂未开放评论')
    const pet = currentDefaultPet()
    const time = nowIso()
    const comment: Comment = {
      id: nextId(),
      postId,
      userId: db.sessionUserId,
      petId: pet?.id,
      content: content.trim(),
      status: 'normal',
      createdAt: time,
      updatedAt: time
    }
    db.comments.push(comment)
    post.commentCount += 1
    return mockDelay(hydrateComment(comment))
  },

  async deleteComment(id: ID): Promise<void> {
    const comment = db.comments.find((item) => item.id === id && item.status === 'normal')
    assertRule(comment, '评论不存在')
    const post = db.posts.find((item) => item.id === comment.postId)
    assertRule(comment.userId === db.sessionUserId || post?.userId === db.sessionUserId, '无权删除该评论')
    comment.status = 'deleted'
    if (post) post.commentCount = Math.max(0, post.commentCount - 1)
    return mockDelay(undefined)
  },

  async createReport(payload: CreateReportPayload): Promise<Report> {
    assertRule(payload.reason, '请选择举报原因')
    ensureReportTargetVisible(payload)
    const report: Report = {
      id: nextId(),
      reporterUserId: db.sessionUserId,
      targetType: payload.targetType,
      targetId: payload.targetId,
      reason: payload.reason,
      description: payload.description,
      images: payload.images,
      status: 'pending',
      createdAt: nowIso()
    }
    db.reports.unshift(report)
    return mockDelay(report)
  },

  async createBlock(blockedUserId: ID, reason = ''): Promise<Block> {
    assertRule(blockedUserId !== db.sessionUserId, '不能拉黑自己')
    const existed = db.blocks.find(
      (item) => item.userId === db.sessionUserId && item.blockedUserId === blockedUserId
    )
    if (existed) return mockDelay(existed)
    const block: Block = {
      id: nextId(),
      userId: db.sessionUserId,
      blockedUserId,
      reason,
      createdAt: nowIso()
    }
    db.blocks.unshift(block)
    return mockDelay(block)
  },

  async blocks(): Promise<Block[]> {
    return mockDelay(db.blocks.filter((item) => item.userId === db.sessionUserId))
  }
}
