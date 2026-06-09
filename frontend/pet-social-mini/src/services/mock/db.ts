import {
  DEFAULT_AVATARS,
  INTEREST_TAGS,
  PERSONALITY_TAGS
} from '@/constants/options'
import { MOCK_IMAGES, MOCK_POST_IMAGES } from '@/constants/assets'
import type { Block, Comment, Invite, Pet, Post, PrivacySettings, Report, User } from '@/types/domain'

const defaultPrivacy: PrivacySettings = {
  allowNearbyVisible: true,
  allowStrangerInvite: true,
  allowComment: true,
  showOwnerName: true,
  showCity: true,
  notificationEnabled: true
}

const ts = (daysAgo = 0, hoursAgo = 0) => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  date.setHours(date.getHours() - hoursAgo)
  return date.toISOString()
}

export interface MockDb {
  sessionUserId: number
  idSeq: number
  token: string
  locationAuthorized: boolean
  users: User[]
  pets: Pet[]
  distances: Record<number, number>
  invites: Invite[]
  posts: Post[]
  comments: Comment[]
  reports: Report[]
  blocks: Block[]
}

export const db: MockDb = {
  sessionUserId: 1,
  idSeq: 2000,
  token: 'mock-token-petcircle',
  locationAuthorized: false,
  users: [
    {
      id: 1,
      openid: 'mock-openid-current',
      nickname: '小松',
      avatarUrl: MOCK_IMAGES.owner,
      city: '上海',
      status: 'normal',
      privacy: { ...defaultPrivacy }
    },
    {
      id: 2,
      nickname: '阿梨',
      avatarUrl: MOCK_IMAGES.owner,
      city: '上海',
      status: 'normal',
      privacy: { ...defaultPrivacy }
    },
    {
      id: 3,
      nickname: '岑岑',
      avatarUrl: MOCK_IMAGES.owner,
      city: '上海',
      status: 'normal',
      privacy: { ...defaultPrivacy, allowStrangerInvite: false }
    },
    {
      id: 4,
      nickname: '南瓜爸',
      avatarUrl: MOCK_IMAGES.owner,
      city: '上海',
      status: 'normal',
      privacy: { ...defaultPrivacy }
    }
  ],
  pets: [
    {
      id: 101,
      userId: 1,
      name: '豆包',
      avatarUrl: DEFAULT_AVATARS.dog,
      type: 'dog',
      breed: '柯基',
      gender: 'male',
      birthday: '2022-01-18',
      weight: 12.4,
      sterilized: true,
      vaccineStatus: 'completed',
      personalityTags: ['活泼', '亲人', '爱玩'],
      interestTags: ['遛弯', '飞盘', '公园'],
      description: '短腿但跑得很认真，最喜欢傍晚去草坪认识新朋友。',
      isDefault: true,
      visible: true,
      status: 'normal',
      createdAt: ts(20),
      updatedAt: ts(1)
    },
    {
      id: 102,
      userId: 2,
      name: '豆豆',
      avatarUrl: DEFAULT_AVATARS.dog,
      type: 'dog',
      breed: '金毛',
      gender: 'female',
      birthday: '2023-05-02',
      weight: 5.8,
      sterilized: false,
      vaccineStatus: 'completed',
      personalityTags: ['友好', '粘人', '慢热'],
      interestTags: ['拍照', '宠物咖啡店', '遛弯'],
      description: '喜欢坐在窗边看人来人往，熟了之后会主动贴贴。',
      isDefault: true,
      visible: true,
      status: 'normal',
      createdAt: ts(40),
      updatedAt: ts(0, 3)
    },
    {
      id: 103,
      userId: 3,
      name: '糯米',
      avatarUrl: DEFAULT_AVATARS.cat,
      type: 'cat',
      breed: '英短',
      gender: 'male',
      birthday: '2021-08-12',
      weight: 6.2,
      sterilized: true,
      vaccineStatus: 'completed',
      personalityTags: ['安静', '胆小', '慢热'],
      interestTags: ['拍照', '宠物市集'],
      description: '只接受远距离欣赏，偶尔愿意在阳光下营业。',
      isDefault: true,
      visible: true,
      status: 'normal',
      createdAt: ts(60),
      updatedAt: ts(0, 12)
    },
    {
      id: 104,
      userId: 4,
      name: '年糕',
      avatarUrl: MOCK_IMAGES.other,
      type: 'dog',
      breed: '法斗',
      gender: 'female',
      birthday: '2020-11-20',
      weight: 9.5,
      sterilized: true,
      vaccineStatus: 'completed',
      personalityTags: ['精力旺盛', '友好', '适合大型犬玩伴'],
      interestTags: ['露营', '同城聚会', '公园'],
      description: '每天都要散步两次，路线越新鲜越开心。',
      isDefault: true,
      visible: true,
      status: 'normal',
      createdAt: ts(80),
      updatedAt: ts(2)
    }
  ],
  distances: {
    102: 780,
    103: 2600,
    104: 4200
  },
  invites: [
    {
      id: 501,
      fromUserId: 2,
      fromPetId: 102,
      toUserId: 1,
      toPetId: 101,
      type: 'walk',
      title: '今晚一起遛弯吗？',
      description: '奶油想找一个温柔玩伴，傍晚在公园外围走一圈。',
      locationName: '世纪公园 2 号门附近',
      meetTime: new Date(Date.now() + 1000 * 60 * 60 * 7).toISOString(),
      status: 'pending',
      createdAt: ts(0, 1),
      updatedAt: ts(0, 1)
    }
  ],
  posts: [
    {
      id: 801,
      userId: 2,
      petId: 102,
      content: '今天的午后阳光真的很舒服，带着小金在公园草坪上打滚了好久！你们家主子也爱晒太阳吗？',
      images: [MOCK_POST_IMAGES[0]],
      locationName: '城市森林公园',
      city: '上海',
      topicTags: ['遛弯', '拍照'],
      visibility: 'public',
      likeCount: 18,
      commentCount: 2,
      liked: false,
      status: 'normal',
      createdAt: ts(0, 4),
      updatedAt: ts(0, 4)
    },
    {
      id: 802,
      userId: 1,
      petId: 101,
      content: '新买的小鱼干到了，它居然不吃！这挑食的小家伙，求推荐好吃的零食～',
      images: [MOCK_POST_IMAGES[1], MOCK_POST_IMAGES[3], MOCK_POST_IMAGES[2]],
      locationName: '社区花园',
      city: '上海',
      topicTags: ['成长记录', '遛弯'],
      visibility: 'nearby',
      likeCount: 9,
      commentCount: 1,
      liked: true,
      status: 'normal',
      createdAt: ts(1),
      updatedAt: ts(1)
    },
    {
      id: 803,
      userId: 4,
      petId: 104,
      content: '明天早上有人去滨江大道遛狗吗？年糕想找个小伙伴一起跑跑！',
      images: [],
      locationName: '滨江大道',
      city: '上海',
      topicTags: ['露营', '寻找玩伴'],
      visibility: 'public',
      likeCount: 31,
      commentCount: 0,
      liked: false,
      status: 'normal',
      createdAt: ts(2),
      updatedAt: ts(2)
    }
  ],
  comments: [
    {
      id: 901,
      postId: 801,
      userId: 1,
      petId: 101,
      content: '豆包也喜欢这条路线，下次可以一起慢慢走。',
      status: 'normal',
      createdAt: ts(0, 2),
      updatedAt: ts(0, 2)
    },
    {
      id: 902,
      postId: 801,
      userId: 4,
      petId: 104,
      content: '奶油看起来好乖！',
      status: 'normal',
      createdAt: ts(0, 1),
      updatedAt: ts(0, 1)
    },
    {
      id: 903,
      postId: 802,
      userId: 2,
      petId: 102,
      content: '这就是成长的代价哈哈。',
      status: 'normal',
      createdAt: ts(0, 20),
      updatedAt: ts(0, 20)
    }
  ],
  reports: [],
  blocks: []
}

export function nextId() {
  db.idSeq += 1
  return db.idSeq
}

export function currentUser() {
  const user = db.users.find((item) => item.id === db.sessionUserId)
  if (!user) throw new Error('当前用户不存在')
  return user
}

export function currentDefaultPet() {
  return db.pets.find((pet) => pet.userId === db.sessionUserId && pet.isDefault && pet.status === 'normal')
}

export function visiblePetById(id: number) {
  return db.pets.find((pet) => pet.id === id && pet.status === 'normal')
}

export function ownerOfPet(pet: Pet) {
  return db.users.find((user) => user.id === pet.userId)
}

export function isBlockedBetween(a: number, b: number) {
  return db.blocks.some(
    (block) =>
      (block.userId === a && block.blockedUserId === b) ||
      (block.userId === b && block.blockedUserId === a)
  )
}

export function enrichPet(pet: Pet): Pet {
  const owner = ownerOfPet(pet)
  return {
    ...pet,
    ownerName: owner?.privacy.showOwnerName === false ? '宠物主人' : owner?.nickname,
    ownerAvatarUrl: owner?.avatarUrl
  }
}

export { INTEREST_TAGS, PERSONALITY_TAGS }
