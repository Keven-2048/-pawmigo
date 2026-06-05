import { PropsWithChildren } from 'react'
import Taro, { useLaunch } from '@tarojs/taro'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useSessionStore } from './store/sessionStore'
import { useEncounterStore } from './store/encounterStore'
import './app.scss'

function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    // Hydrate session from persisted storage and refresh if we have a token.
    const token = Taro.getStorageSync('jwt')
    if (token) {
      // We have a stored JWT — refresh user/pet data silently.
      // Don't block the UI; let pages show a loading state if needed.
      useSessionStore.getState().refreshMe().catch(() => {
        // Token expired or invalid — clear it so the user lands on splash.
        Taro.removeStorageSync('jwt')
      })
    }
    // Recover any in-progress encounter journey from the persisted mock db.
    useEncounterStore.getState().hydrate().catch(() => {})
  })

  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  )
}

export default App
