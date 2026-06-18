import type { Pet } from '@/types/domain'

export function nowIso() {
  return new Date().toISOString()
}

export function formatAge(birthday?: string) {
  if (!birthday) return '年龄未知'
  const birth = new Date(birthday)
  if (Number.isNaN(birth.getTime())) return '年龄未知'

  const now = new Date()
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth()
  if (months < 12) return `${Math.max(1, months)}个月`
  const years = Math.floor(months / 12)
  return `${years}岁`
}

export function getPetSummary(pet: Pet) {
  return [pet.breed, formatAge(pet.birthday)].filter(Boolean).join(' · ')
}

export function distanceText(distance: number) {
  if (distance <= 500) return '500m 内'
  if (distance <= 1000) return '1km 内'
  if (distance <= 3000) return '3km 内'
  if (distance <= 5000) return '5km 内'
  return '10km 内'
}

export function shortDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hour = `${date.getHours()}`.padStart(2, '0')
  const minute = `${date.getMinutes()}`.padStart(2, '0')
  return `${month}-${day} ${hour}:${minute}`
}

export function relativeTime(value: string) {
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return '刚刚'
  const diff = Date.now() - time
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}

export function isPast(value: string) {
  return new Date(value).getTime() < Date.now()
}

export function normalizeDateTimeInput(value: string) {
  if (!value) return value
  const date = new Date(value.replace(/-/g, '/'))
  if (Number.isNaN(date.getTime())) return value
  return date.toISOString()
}
