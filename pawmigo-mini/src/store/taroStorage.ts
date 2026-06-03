import Taro from '@tarojs/taro'
import { StateStorage } from 'zustand/middleware'

export const taroStorage: StateStorage = {
  getItem: (name) => {
    try {
      return Taro.getStorageSync<string>(name) || null
    } catch {
      return null
    }
  },
  setItem: (name, value) => {
    try {
      Taro.setStorageSync(name, value)
    } catch {
      // ignore
    }
  },
  removeItem: (name) => {
    try {
      Taro.removeStorageSync(name)
    } catch {
      // ignore
    }
  },
}
