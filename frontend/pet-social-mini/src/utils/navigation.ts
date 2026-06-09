import { navigateTo, reLaunch, showToast as taroShowToast, switchTab } from '@tarojs/taro'

export function toLogin() {
  return reLaunch({ url: '/pages/login/index' })
}

export function toNearby() {
  return switchTab({ url: '/pages/nearby/index' })
}

export function toCreatePet() {
  return navigateTo({ url: '/subpackages/pet/create/index' })
}

export function toPetDetail(id: number) {
  return navigateTo({ url: `/subpackages/pet/detail/index?id=${id}` })
}

export function toPostDetail(id: number) {
  return navigateTo({ url: `/subpackages/post/detail/index?id=${id}` })
}

export function showToast(title: string, icon: 'none' | 'success' | 'error' = 'none') {
  return taroShowToast({ title, icon, duration: 1800 })
}
