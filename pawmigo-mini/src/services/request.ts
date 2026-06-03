import Taro from '@tarojs/taro'

const BASE_URL = 'http://localhost:8080/api/v1'

export async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  data?: object,
): Promise<T> {
  const token = Taro.getStorageSync<string>('jwt')
  const res = await Taro.request<T | { error?: string }>({
    url: BASE_URL + path,
    method,
    data,
    header: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (res.statusCode >= 400) {
    const body = res.data as { error?: string }
    throw new Error(body?.error || `HTTP ${res.statusCode}`)
  }

  return res.data as T
}
