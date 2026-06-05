import Taro from '@tarojs/taro'
import { makeSeed, SeedShape } from './seed'

const DB_KEY = 'pawmigo:db'

function load(): SeedShape {
  try {
    const raw = Taro.getStorageSync<string>(DB_KEY)
    if (raw) {
      // Merge over a fresh seed so newly-added collections (e.g. activeEncounter,
      // blockedIds) get defaults when hydrating a db persisted by an older build.
      return { ...makeSeed(), ...(JSON.parse(raw) as Partial<SeedShape>) }
    }
  } catch {
    // fall through to seed
  }
  return makeSeed()
}

export const db: SeedShape = load()

export function persistDb(): void {
  try {
    Taro.setStorageSync(DB_KEY, JSON.stringify(db))
  } catch {
    // best-effort; ignore quota/serialization issues in mock
  }
}

export function resetDb(): void {
  const fresh = makeSeed()
  ;(Object.keys(fresh) as (keyof SeedShape)[]).forEach((k) => {
    // mutate in place so the exported `db` reference stays valid
    ;(db as unknown as Record<string, unknown>)[k as string] = fresh[k]
  })
  persistDb()
}

// Monotonic id generator for new mock records.
let counter = Date.now()
export function nextId(): number {
  counter += 1
  return counter
}
