import { DEFAULT_AVATARS } from './assets'
import type { Gender, InviteType, NearbyFilter, PetType, PostVisibility, VaccineStatus } from '@/types/domain'

export const PET_TYPE_LABEL: Record<PetType, string> = {
  dog: '狗狗',
  cat: '猫咪',
  rabbit: '兔子',
  bird: '鸟类',
  other: '其他'
}

export const GENDER_LABEL: Record<Gender, string> = {
  unknown: '未知',
  male: '男孩',
  female: '女孩'
}

export const VACCINE_LABEL: Record<VaccineStatus, string> = {
  unknown: '未知',
  partial: '部分完成',
  completed: '已完成'
}

export const INVITE_TYPE_LABEL: Record<InviteType, string> = {
  walk: '一起遛弯',
  play: '宠物玩耍',
  park: '公园见面',
  coffee: '宠物咖啡店',
  photo: '一起拍照',
  event: '宠物活动',
  custom: '自定义'
}

export const VISIBILITY_LABEL: Record<PostVisibility, string> = {
  public: '公开',
  nearby: '附近',
  followers: '粉丝',
  private: '私密'
}

export const PERSONALITY_TAGS = [
  '活泼',
  '安静',
  '亲人',
  '胆小',
  '友好',
  '慢热',
  '粘人',
  '爱玩',
  '精力旺盛',
  '适合小型犬玩伴',
  '适合大型犬玩伴'
]

export const INTEREST_TAGS = [
  '遛弯',
  '飞盘',
  '公园',
  '拍照',
  '宠物咖啡店',
  '游泳',
  '露营',
  '宠物市集',
  '同城聚会',
  '寻找玩伴'
]

export const REPORT_REASONS = [
  '虚假信息',
  '骚扰侮辱',
  '营销广告',
  '低俗色情',
  '违法违规',
  '虐待动物',
  '冒充他人',
  '不友善行为',
  '其他'
]

export { DEFAULT_AVATARS }

export const DEFAULT_FILTER: NearbyFilter = {
  type: 'all',
  distance: 3000,
  gender: 'all',
  age: 'all',
  personalityTags: [],
  interestTags: [],
  canInviteOnly: false,
  activeOnly: false
}
