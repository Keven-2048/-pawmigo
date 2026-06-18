import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import './setup-alias'
import type { Block, Invite, Pet, Post, User } from '../src/types/domain'
import { mockApi } from '../src/services/mock/api'
import { db } from '../src/services/mock/db'

type MockSnapshot = {
  sessionUserId: number
  idSeq: number
  token: string
  locationAuthorized: boolean
  users: User[]
  pets: Pet[]
  distances: Record<number, number>
  invites: Invite[]
  posts: Post[]
  comments: typeof db.comments
  reports: typeof db.reports
  blocks: Block[]
}

function snapshotDb(): MockSnapshot {
  return structuredClone({
    sessionUserId: db.sessionUserId,
    idSeq: db.idSeq,
    token: db.token,
    locationAuthorized: db.locationAuthorized,
    users: db.users,
    pets: db.pets,
    distances: db.distances,
    invites: db.invites,
    posts: db.posts,
    comments: db.comments,
    reports: db.reports,
    blocks: db.blocks
  })
}

function restoreDb(snapshot: MockSnapshot) {
  db.sessionUserId = snapshot.sessionUserId
  db.idSeq = snapshot.idSeq
  db.token = snapshot.token
  db.locationAuthorized = snapshot.locationAuthorized
  db.users.splice(0, db.users.length, ...structuredClone(snapshot.users))
  db.pets.splice(0, db.pets.length, ...structuredClone(snapshot.pets))
  Object.keys(db.distances).forEach((key) => delete db.distances[Number(key)])
  Object.assign(db.distances, structuredClone(snapshot.distances))
  db.invites.splice(0, db.invites.length, ...structuredClone(snapshot.invites))
  db.posts.splice(0, db.posts.length, ...structuredClone(snapshot.posts))
  db.comments.splice(0, db.comments.length, ...structuredClone(snapshot.comments))
  db.reports.splice(0, db.reports.length, ...structuredClone(snapshot.reports))
  db.blocks.splice(0, db.blocks.length, ...structuredClone(snapshot.blocks))
}

async function rejectsWithMessage(action: () => Promise<unknown>, message: string) {
  await assert.rejects(action, (error) => error instanceof Error && error.message === message)
}

let baseSnapshot: MockSnapshot

beforeEach(() => {
  baseSnapshot = snapshotDb()
})

afterEach(() => {
  restoreDb(baseSnapshot)
})

test('blocks duplicate pending invites to the same receiving pet within 24 hours', async () => {
  db.invites = db.invites.filter((invite) => invite.id !== 501)

  const payload = {
    fromPetId: 101,
    toPetId: 102,
    type: 'walk' as const,
    title: '一起散步',
    description: '今晚慢慢走一圈',
    locationName: '社区花园',
    meetTime: new Date(Date.now() + 1000 * 60 * 60 * 3).toISOString()
  }

  await mockApi.createInvite(payload)

  await rejectsWithMessage(
    () => mockApi.createInvite(payload),
    '24 小时内已经向这只宠物发过邀请'
  )
})

test('rejects self invites, past invites, empty posts, and posts with too many images', async () => {
  await rejectsWithMessage(
    () =>
      mockApi.createInvite({
        fromPetId: 101,
        toPetId: 101,
        type: 'walk',
        title: '自己约自己',
        description: '',
        locationName: '家门口',
        meetTime: new Date(Date.now() + 1000 * 60 * 60).toISOString()
      }),
    '不能邀请自己的宠物'
  )

  await rejectsWithMessage(
    () =>
      mockApi.createInvite({
        fromPetId: 101,
        toPetId: 102,
        type: 'walk',
        title: '迟到的邀请',
        description: '',
        locationName: '社区花园',
        meetTime: new Date(Date.now() - 1000 * 60).toISOString()
      }),
    '见面时间不能早于当前时间'
  )

  await rejectsWithMessage(
    () =>
      mockApi.createPost({
        petId: 101,
        content: '   ',
        images: [],
        locationName: '',
        topicTags: [],
        visibility: 'public'
      }),
    '请填写文字或选择图片'
  )

  await rejectsWithMessage(
    () =>
      mockApi.createPost({
        petId: 101,
        content: '九宫格之外不收',
        images: Array.from({ length: 10 }, (_, index) => `/assets/mock/${index}.svg`),
        locationName: '',
        topicTags: [],
        visibility: 'public'
      }),
    '图片最多 9 张'
  )
})

test('privacy settings remove pets from nearby and block stranger invites', async () => {
  const owner = db.users.find((user) => user.id === 2)
  assert.ok(owner)

  owner.privacy.allowNearbyVisible = false
  const hiddenNearby = await mockApi.nearbyPets()
  assert.equal(hiddenNearby.list.some((pet) => pet.id === 102), false)

  owner.privacy.allowNearbyVisible = true
  owner.privacy.allowStrangerInvite = false

  await rejectsWithMessage(
    () =>
      mockApi.createInvite({
        fromPetId: 101,
        toPetId: 102,
        type: 'walk',
        title: '一起散步',
        description: '',
        locationName: '社区花园',
        meetTime: new Date(Date.now() + 1000 * 60 * 60).toISOString()
      }),
    '对方暂未开放陌生邀请'
  )
})

test('blocking a user hides their pet and prevents invites, likes, and comments', async () => {
  await mockApi.createBlock(2, '不想互动')

  const nearby = await mockApi.nearbyPets()
  assert.equal(nearby.list.some((pet) => pet.userId === 2), false)

  const receivedInvites = await mockApi.invites('received')
  assert.equal(receivedInvites.some((invite) => invite.fromUserId === 2), false)

  await rejectsWithMessage(
    () =>
      mockApi.createInvite({
        fromPetId: 101,
        toPetId: 102,
        type: 'walk',
        title: '一起散步',
        description: '',
        locationName: '社区花园',
        meetTime: new Date(Date.now() + 1000 * 60 * 60).toISOString()
      }),
    '你们暂时不能互相邀请'
  )

  await rejectsWithMessage(() => mockApi.inviteDetail(501), '该邀请暂不可见')
  await rejectsWithMessage(() => mockApi.toggleLike(801, true), '该动态暂不可见')
  await rejectsWithMessage(() => mockApi.createComment(801, '还可以评论吗'), '该动态暂不可见')
  await rejectsWithMessage(() => mockApi.comments(801), '该动态暂不可见')
})

test('deleting the default pet selects exactly one remaining default pet when available', async () => {
  const secondPet = await mockApi.createPet({
    name: '栗子',
    avatarUrl: '',
    type: 'cat',
    breed: '狸花',
    gender: 'female',
    sterilized: true,
    vaccineStatus: 'completed',
    personalityTags: ['安静'],
    interestTags: ['拍照'],
    description: '喜欢窗边晒太阳',
    visible: true
  })

  await mockApi.deletePet(101)

  const myPets = await mockApi.myPets()
  assert.equal(myPets.some((pet) => pet.id === 101), false)
  assert.deepEqual(
    myPets.filter((pet) => pet.isDefault).map((pet) => pet.id),
    [secondPet.id]
  )
})

test('editing a pet enforces the same validation rules as creating a pet', async () => {
  const validPayload = {
    name: '豆包',
    avatarUrl: '',
    type: 'dog' as const,
    breed: '柯基',
    gender: 'male' as const,
    sterilized: true,
    vaccineStatus: 'completed' as const,
    personalityTags: ['活泼'],
    interestTags: ['遛弯'],
    description: '喜欢认识附近新朋友',
    visible: true
  }

  await rejectsWithMessage(
    () => mockApi.updatePet(101, { ...validPayload, name: '   ' }),
    '请填写宠物昵称'
  )

  await rejectsWithMessage(
    () =>
      mockApi.updatePet(101, {
        ...validPayload,
        personalityTags: Array.from({ length: 11 }, (_, index) => `性格${index}`)
      }),
    '性格标签最多 10 个'
  )

  await rejectsWithMessage(
    () =>
      mockApi.updatePet(101, {
        ...validPayload,
        description: '太长了'.repeat(200)
      }),
    '简介最多 500 字'
  )

  const pet = await mockApi.updatePet(101, { ...validPayload, name: '  小豆包  ' })
  assert.equal(pet.name, '小豆包')
})

test('nearby pets expose fuzzy distance but no raw latitude or longitude', async () => {
  const nearby = await mockApi.nearbyPets()

  assert.ok(nearby.list.length > 0)
  for (const pet of nearby.list) {
    assert.equal('latitude' in pet, false)
    assert.equal('longitude' in pet, false)
    assert.equal(typeof pet.distanceText, 'string')
    assert.equal(typeof pet.distanceValue, 'number')
  }
})

test('reports and blocks persist in mock state and duplicate blocks are idempotent', async () => {
  const report = await mockApi.createReport({
    targetType: 'post',
    targetId: 801,
    reason: 'spam',
    description: '重复营销内容',
    images: []
  })

  assert.equal(report.reporterUserId, db.sessionUserId)
  assert.equal(report.status, 'pending')
  assert.equal(db.reports.some((item) => item.id === report.id), true)

  const firstBlock = await mockApi.createBlock(3, '不想被打扰')
  const secondBlock = await mockApi.createBlock(3, '重复拉黑')
  const blocks = await mockApi.blocks()

  assert.equal(secondBlock.id, firstBlock.id)
  assert.equal(blocks.filter((block) => block.blockedUserId === 3).length, 1)
})

test('reports reject missing or inaccessible targets before persisting', async () => {
  await rejectsWithMessage(
    () =>
      mockApi.createReport({
        targetType: 'post',
        targetId: 999999,
        reason: 'spam',
        description: '',
        images: []
      }),
    '举报目标不存在'
  )

  await rejectsWithMessage(
    () =>
      mockApi.createReport({
        targetType: 'comment',
        targetId: 999999,
        reason: 'spam',
        description: '',
        images: []
      }),
    '举报目标不存在'
  )

  await rejectsWithMessage(
    () =>
      mockApi.createReport({
        targetType: 'invite',
        targetId: 999999,
        reason: 'spam',
        description: '',
        images: []
      }),
    '举报目标不存在'
  )

  await rejectsWithMessage(
    () =>
      mockApi.createReport({
        targetType: 'pet',
        targetId: 999999,
        reason: 'spam',
        description: '',
        images: []
      }),
    '举报目标不存在'
  )

  await rejectsWithMessage(
    () =>
      mockApi.createReport({
        targetType: 'user',
        targetId: 999999,
        reason: 'spam',
        description: '',
        images: []
      }),
    '举报目标不存在'
  )

  assert.equal(db.reports.length, 0)
})

test('post likes are idempotent and comments update visible counts', async () => {
  const postBefore = await mockApi.postDetail(801)

  const likedOnce = await mockApi.toggleLike(801, true)
  const likedTwice = await mockApi.toggleLike(801, true)
  assert.equal(likedOnce.likeCount, postBefore.likeCount + 1)
  assert.equal(likedTwice.likeCount, likedOnce.likeCount)

  const unlikedOnce = await mockApi.toggleLike(801, false)
  const unlikedTwice = await mockApi.toggleLike(801, false)
  assert.equal(unlikedOnce.likeCount, postBefore.likeCount)
  assert.equal(unlikedTwice.likeCount, unlikedOnce.likeCount)

  const comment = await mockApi.createComment(801, '一起慢慢散步')
  const afterCreate = await mockApi.postDetail(801)
  assert.equal(afterCreate.commentCount, postBefore.commentCount + 1)

  await mockApi.deleteComment(comment.id)
  const afterDelete = await mockApi.postDetail(801)
  assert.equal(afterDelete.commentCount, postBefore.commentCount)
})

test('deleting the same comment twice does not decrement post counts twice', async () => {
  const before = await mockApi.postDetail(801)

  await mockApi.deleteComment(901)
  const afterFirstDelete = await mockApi.postDetail(801)
  assert.equal(afterFirstDelete.commentCount, before.commentCount - 1)

  await rejectsWithMessage(() => mockApi.deleteComment(901), '评论不存在')

  const afterDuplicateDelete = await mockApi.postDetail(801)
  assert.equal(afterDuplicateDelete.commentCount, afterFirstDelete.commentCount)
})

test('deleting a post hides its comments and prevents direct reads', async () => {
  assert.equal(db.comments.some((comment) => comment.postId === 802 && comment.status === 'normal'), true)

  await mockApi.deletePost(802)

  const post = db.posts.find((item) => item.id === 802)
  assert.equal(post?.status, 'deleted')
  assert.equal(post?.commentCount, 0)
  assert.deepEqual(
    db.comments
      .filter((comment) => comment.postId === 802)
      .map((comment) => comment.status),
    ['deleted']
  )
  await rejectsWithMessage(() => mockApi.comments(802), '动态不存在')
  await rejectsWithMessage(() => mockApi.postDetail(802), '动态不存在')
})

test('privacy comment setting blocks stranger comments but allows owners to comment on their own posts', async () => {
  const postOwner = db.users.find((user) => user.id === 2)
  assert.ok(postOwner)
  postOwner.privacy.allowComment = false

  await rejectsWithMessage(
    () => mockApi.createComment(801, '现在还能评论吗'),
    '对方暂未开放评论'
  )

  db.sessionUserId = 2
  const ownerComment = await mockApi.createComment(801, '给主人自己的补充')
  assert.equal(ownerComment.userId, 2)
})

test('invite status actions enforce role ownership and daily send limit', async () => {
  await rejectsWithMessage(() => mockApi.updateInviteStatus(501, 'cancel'), '只有发起人可以取消邀请')

  const accepted = await mockApi.updateInviteStatus(501, 'accept')
  assert.equal(accepted.status, 'accepted')
  await rejectsWithMessage(() => mockApi.updateInviteStatus(501, 'reject'), '当前邀请状态不可操作')

  const sentInvite: Invite = {
    id: 2999,
    fromUserId: 1,
    fromPetId: 101,
    toUserId: 4,
    toPetId: 104,
    type: 'walk',
    title: '周末一起散步',
    description: '',
    locationName: '社区花园',
    meetTime: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  db.invites.unshift(sentInvite)

  await rejectsWithMessage(() => mockApi.updateInviteStatus(sentInvite.id, 'accept'), '只有接收人可以处理邀请')
  const cancelled = await mockApi.updateInviteStatus(sentInvite.id, 'cancel')
  assert.equal(cancelled.status, 'cancelled')

  db.invites = db.invites.filter((invite) => invite.fromUserId !== db.sessionUserId)
  for (let index = 0; index < 10; index += 1) {
    db.invites.push({
      ...sentInvite,
      id: 3100 + index,
      toPetId: 9000 + index,
      status: 'accepted',
      createdAt: new Date().toISOString()
    })
  }

  await rejectsWithMessage(
    () =>
      mockApi.createInvite({
        fromPetId: 101,
        toPetId: 102,
        type: 'walk',
        title: '一起散步',
        description: '',
        locationName: '社区花园',
        meetTime: new Date(Date.now() + 1000 * 60 * 60).toISOString()
      }),
    '今天的邀请次数已用完'
  )
})
