import type { PetType } from '@/types/domain'

export const MOCK_IMAGES = {
  dog: '/assets/mock/pet-dog-golden.jpg',
  cat: '/assets/mock/pet-cat-window.jpg',
  rabbit: '/assets/mock/pet-dog-home.jpg',
  bird: '/assets/mock/pet-dog-frenchie.jpg',
  other: '/assets/mock/pet-dog-frenchie.jpg',
  hero: '/assets/mock/empty-puppy.jpg',
  owner: '/assets/mock/pet-owner.jpg',
  postWalk: '/assets/mock/post-golden-lawn.jpg',
  postPark: '/assets/mock/post-cat-table.jpg',
  postFriends: '/assets/mock/post-cat-play.jpg',
  postTreats: '/assets/mock/post-cat-treats.jpg'
}

export const DEFAULT_AVATARS: Record<PetType, string> = {
  dog: MOCK_IMAGES.dog,
  cat: MOCK_IMAGES.cat,
  rabbit: MOCK_IMAGES.rabbit,
  bird: MOCK_IMAGES.bird,
  other: MOCK_IMAGES.other
}

export const MOCK_POST_IMAGES = [
  MOCK_IMAGES.postWalk,
  MOCK_IMAGES.postPark,
  MOCK_IMAGES.postFriends,
  MOCK_IMAGES.postTreats
]

export const tabbarSemantics = {
  nearby: 'pin',
  feed: 'pets',
  invite: 'mail',
  mine: 'person'
} as const
