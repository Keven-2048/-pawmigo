import { getToken } from '../../auth/token'

interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
}

const API_PREFIX = '/api/v1/admin'

function getBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
}

async function unwrapResponse<T>(response: Response): Promise<T> {
  let payload: ApiEnvelope<T> | undefined

  try {
    payload = (await response.json()) as ApiEnvelope<T>
  } catch {
    payload = undefined
  }

  if (!response.ok) {
    throw new Error(payload?.message || `请求失败：${response.status}`)
  }

  if (!payload) {
    throw new Error('响应格式错误')
  }

  if (payload.code !== 0) {
    throw new Error(payload.message || '请求失败')
  }

  return payload.data
}

export async function adminRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = getToken()
  const headers = new Headers(init.headers)

  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${getBaseUrl()}${API_PREFIX}${path}`, {
    ...init,
    headers,
  })

  return unwrapResponse<T>(response)
}
