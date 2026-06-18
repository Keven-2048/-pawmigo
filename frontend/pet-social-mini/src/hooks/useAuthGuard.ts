import { useEffect, useState } from 'react'
import { getStorageSync } from '@tarojs/taro'
import { usePetStore } from '@/store/petStore'
import { useUserStore } from '@/store/userStore'
import { toCreatePet, toLogin } from '@/utils/navigation'
import { resolveAuthGuardDestination } from '@/utils/ownership'

interface GuardOptions {
  requirePet?: boolean
}

export function useAuthGuard(options: GuardOptions = {}) {
  const [ready, setReady] = useState(false)
  const loggedIn = useUserStore((state) => state.loggedIn)
  const hydrate = useUserStore((state) => state.hydrate)
  const loadPets = usePetStore((state) => state.loadPets)

  useEffect(() => {
    let active = true

    async function guard() {
      const token = getStorageSync('token')
      const tokenDestination = resolveAuthGuardDestination({
        hasToken: !!token,
        loggedIn,
        requirePet: false,
        petCount: 0
      })

      if (tokenDestination === 'login') {
        await toLogin()
        return
      }

      try {
        await hydrate()
        if (options.requirePet) {
          const pets = await loadPets()
          const destination = resolveAuthGuardDestination({
            hasToken: !!token,
            loggedIn: true,
            requirePet: true,
            petCount: pets.length
          })

          if (destination === 'create-pet') {
            await toCreatePet()
            return
          }
        }
        if (active) setReady(true)
      } catch {
        await toLogin()
      }
    }

    guard()

    return () => {
      active = false
    }
  }, [hydrate, loadPets, loggedIn, options.requirePet])

  return ready
}
