import Taro from '@tarojs/taro'

const MAIN_PAGES = new Set([
  '/pages/map/index',
  '/pages/feed/index',
  '/pages/encounter/index',
  '/pages/team/index',
  '/pages/profile/index',
])

function normalizeUrl(url: string) {
  return url.startsWith('/') ? url : `/${url}`
}

function currentUrl() {
  const pages = Taro.getCurrentPages()
  const current = pages[pages.length - 1]
  return current?.route ? normalizeUrl(current.route) : ''
}

export function openPage(url: string, options: { replace?: boolean; reset?: boolean } = {}) {
  const target = normalizeUrl(url)

  if (currentUrl() === target) {
    return
  }

  if (options.reset) {
    Taro.reLaunch({ url: target })
    return
  }

  const depth = Taro.getCurrentPages().length
  const shouldReplace = options.replace || MAIN_PAGES.has(target) || depth >= 8

  if (shouldReplace) {
    Taro.redirectTo({ url: target })
    return
  }

  Taro.navigateTo({ url: target })
}

export function backOrHome(fallback = '/pages/map/index') {
  if (Taro.getCurrentPages().length > 1) {
    Taro.navigateBack()
    return
  }

  openPage(fallback, { replace: true })
}
