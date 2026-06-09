import { create } from 'zustand'
import { petService } from '@/services'
import type { CreatePetPayload, ID, Pet } from '@/types/domain'

interface PetState {
  pets: Pet[]
  currentPet?: Pet
  loading: boolean
  loadPets: () => Promise<Pet[]>
  createPet: (payload: CreatePetPayload) => Promise<Pet>
  updatePet: (id: ID, payload: CreatePetPayload) => Promise<Pet>
  deletePet: (id: ID) => Promise<void>
  setDefaultPet: (id: ID) => Promise<void>
  pickCurrentPet: (id: ID) => void
}

function selectDefault(pets: Pet[]) {
  return pets.find((pet) => pet.isDefault) ?? pets[0]
}

export const usePetStore = create<PetState>((set, get) => ({
  pets: [],
  currentPet: undefined,
  loading: false,

  async loadPets() {
    set({ loading: true })
    const pets = await petService.myPets()
    const current = get().currentPet
    const currentPet = current ? pets.find((pet) => pet.id === current.id) ?? selectDefault(pets) : selectDefault(pets)
    set({ pets, currentPet, loading: false })
    return pets
  },

  async createPet(payload) {
    const pet = await petService.create(payload)
    await get().loadPets()
    return pet
  },

  async updatePet(id, payload) {
    const pet = await petService.update(id, payload)
    await get().loadPets()
    return pet
  },

  async deletePet(id) {
    await petService.delete(id)
    await get().loadPets()
  },

  async setDefaultPet(id) {
    await petService.setDefault(id)
    await get().loadPets()
  },

  pickCurrentPet(id) {
    const pet = get().pets.find((item) => item.id === id)
    if (pet) set({ currentPet: pet })
  }
}))
