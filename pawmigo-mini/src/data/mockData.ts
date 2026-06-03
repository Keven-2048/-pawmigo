import { Pet, User } from '../services/api'

export interface NearbyPet {
  id: number
  name: string
  breed: string
  avatar: string
  owner: string
  distance: string
  minutes: number
  size: '小型' | '中型' | '大型'
  personality: string[]
  route: string
  lng: number
  lat: number
}

export interface FeedPost {
  id: number
  petName: string
  breed: string
  location: string
  caption: string
  mediaTone: 'park' | 'sunset' | 'river' | 'studio'
  stickers: string[]
  likes: number
  bones: number
  comments: number
}

export interface Team {
  id: number
  name: string
  type: '品种团' | '性格团' | '地点团'
  tag: string
  members: number
  activity: string
  schedule: string
  vibe: string
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

export const demoUser: User = {
  id: 1,
  nickname: '毛孩子主人',
  avatar: '',
  boneBalance: 128,
}

export const demoPets: Pet[] = [
  {
    id: 101,
    ownerId: 1,
    name: '豆豆',
    breed: '柯基',
    gender: '男',
    age: 3,
    personality: ['社牛', '短腿飞毛腿'],
    bio: '喜欢草坪、飞盘和所有路过的朋友。',
    boneCount: 86,
  },
  {
    id: 102,
    ownerId: 1,
    name: '雪球',
    breed: '萨摩耶',
    gender: '女',
    age: 2,
    personality: ['运动健将', '亲人'],
    bio: '微笑天使，傍晚固定滨江路线。',
    boneCount: 64,
  },
]

export const nearbyPets: NearbyPet[] = [
  {
    id: 201,
    name: '阿黄',
    breed: '柴犬',
    avatar: '柴',
    owner: '林同学',
    distance: '260m',
    minutes: 18,
    size: '中型',
    personality: ['慢热', '爱闻草'],
    route: '梧桐道北段',
    lng: 121.478,
    lat: 31.232,
  },
  {
    id: 202,
    name: '奶盖',
    breed: '比熊',
    avatar: '比',
    owner: '小周',
    distance: '410m',
    minutes: 9,
    size: '小型',
    personality: ['社牛', '贴贴怪'],
    route: '口袋公园环线',
    lng: 121.481,
    lat: 31.229,
  },
  {
    id: 203,
    name: '黑糖',
    breed: '拉布拉多',
    avatar: '拉',
    owner: 'Mia',
    distance: '680m',
    minutes: 31,
    size: '大型',
    personality: ['运动健将', '球控'],
    route: '滨江慢跑道',
    lng: 121.474,
    lat: 31.226,
  },
  {
    id: 204,
    name: '饼干',
    breed: '柯基',
    avatar: '柯',
    owner: '许先生',
    distance: '820m',
    minutes: 12,
    size: '小型',
    personality: ['社牛', '短腿飞毛腿'],
    route: '社区花园',
    lng: 121.485,
    lat: 31.234,
  },
]

export const feedPosts: FeedPost[] = [
  {
    id: 301,
    petName: '奶盖',
    breed: '比熊',
    location: '口袋公园',
    caption: '今天主动学会把球叼回来了，奖励一整圈草坪巡逻。',
    mediaTone: 'park',
    stickers: ['比熊专属', '今日上墙'],
    likes: 48,
    bones: 19,
    comments: 7,
  },
  {
    id: 302,
    petName: '黑糖',
    breed: '拉布拉多',
    location: '滨江慢跑道',
    caption: '5 公里陪跑结束，回家前还想再找朋友玩十分钟。',
    mediaTone: 'river',
    stickers: ['运动健将', '骨头补给'],
    likes: 73,
    bones: 34,
    comments: 12,
  },
  {
    id: 303,
    petName: '饼干',
    breed: '柯基',
    location: '社区花园',
    caption: '短腿天团集合成功，今日队形：三角形。',
    mediaTone: 'sunset',
    stickers: ['短腿天团', '社牛'],
    likes: 62,
    bones: 27,
    comments: 9,
  },
]

export const teams: Team[] = [
  {
    id: 401,
    name: '短腿天团',
    type: '品种团',
    tag: '柯基',
    members: 128,
    activity: '周三草坪短跑赛',
    schedule: '19:00 · 口袋公园',
    vibe: '低重心，高能量',
  },
  {
    id: 402,
    name: '社牛飞盘队',
    type: '性格团',
    tag: '社牛',
    members: 92,
    activity: '飞盘接力和新朋友破冰',
    schedule: '周六 16:30 · 滨江慢跑道',
    vibe: '见面三秒就开玩',
  },
  {
    id: 403,
    name: '滨江晚风团',
    type: '地点团',
    tag: '滨江',
    members: 214,
    activity: '日落路线打卡',
    schedule: '每天 18:40 · 亲水平台',
    vibe: '路线稳定，节奏轻松',
  },
]

export const encounterCandidates: EncounterCandidate[] = [
  {
    id: 501,
    name: '奶盖',
    breed: '比熊',
    distance: '410m',
    score: 96,
    reason: '同样社牛，体型接近，最近路线重叠 3 次',
    meetup: '口袋公园东门',
    window: '18:45-19:10',
  },
  {
    id: 502,
    name: '饼干',
    breed: '柯基',
    distance: '820m',
    score: 91,
    reason: '同品种，短跑偏好一致',
    meetup: '社区花园喷泉旁',
    window: '19:00-19:20',
  },
]

export const stickerPacks = [
  { name: '短腿天团', status: '已解锁', count: 12 },
  { name: '微笑天使', status: '待解锁', count: 9 },
  { name: '飞盘火花', status: '活动兑换', count: 6 },
]
