import { useEffect } from 'react'
import Taro from '@tarojs/taro'
import { useSessionStore } from '../store/sessionStore'
import { openPage } from './navigation'

/**
 * Redirects to splash if the user is not authenticated.
 * Call this in every tab/page that requires a logged-in user.
 *
 * Returns the current auth state so pages can show a loading skeleton
 * while the persisted session hydrates.
 */
export function useRequireAuth() {
  const user = useSessionStore((s) => s.user)
  const loading = useSessionStore((s) => s.loading)
  // Zustand persist middleware sets a flag after rehydration.
  // In Taro the storage is sync so hydration is instant, but we
  // still guard against the empty initial render.
  const hasHydrated = useSessionStore((s) => s.user !== undefined)

  useEffect(() => {
    // Only redirect once we know the persisted state has loaded.
    if (!loading && hasHydrated && !user) {
      // Avoid redirect loop: don't redirect if already on a public page.
      const pages = Taro.getCurrentPages()
      const current = pages[pages.length - 1]?.route ?? ''
      const publicPages = ['pages/splash/index', 'pages/login/index', 'pages/profile/pet-form', 'pages/permissions/index']
      if (!publicPages.includes(current)) {
        openPage('/pages/splash/index', { reset: true })
      }
    }
  }, [loading, hasHydrated, user])

  return { user, loading, isAuthenticated: !!user }
}
