import { request } from './request'

export interface User {
  id: number
  nickname: string
  avatar: string
  boneBalance: number
}

export interface Pet {
  id: number
  ownerId: number
  name: string
  breed: string
  gender: string
  age: number
  personality: string[]
  bio: string
  boneCount: number
}

export interface PetInput {
  name?: string
  breed?: string
  gender?: string
  age?: number
  personality?: string[]
  bio?: string
}

export interface LoginResult {
  token: string
  user: User
}

export const api = {
  wxLogin: (code: string) =>
    request<LoginResult>('POST', '/auth/wx-login', { code }),
  me: () => request<{ user: User; pets: Pet[] }>('GET', '/me'),
  createPet: (input: PetInput) => request<Pet>('POST', '/pets', input),
  updatePet: (id: number, input: PetInput) =>
    request<Pet>('PUT', `/pets/${id}`, input),
}
