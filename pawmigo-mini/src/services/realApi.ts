import { request } from './request'
import { LoginResult, Pet, PetInput, User } from './types'
import { MockApi } from './mockApi'
import { mockApi } from './mockApi'

// Only these endpoints exist on the Go backend today. Everything else falls
// back to the mock implementation so the app still runs end-to-end.
const realImpl = {
  wxLogin: (code: string) => request<LoginResult>('POST', '/auth/wx-login', { code }),
  me: () => request<{ user: User; pets: Pet[] }>('GET', '/me'),
  createPet: (input: PetInput) => request<Pet>('POST', '/pets', input),
  updatePet: (id: number, input: PetInput) => request<Pet>('PUT', `/pets/${id}`, input),
}

// Compose: real where implemented, mock for the rest. Keeps a single api shape.
export const realApi: MockApi = { ...mockApi, ...realImpl }
