import {
  getStorageSync,
  removeStorageSync,
  request
} from '@tarojs/taro'
import { messageFromResponse, unwrapApiData } from './mapper'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface RequestResult {
  statusCode: number
  data: unknown
}

export interface RemoteClient {
  get: <T>(path: string, query?: Record<string, unknown>) => Promise<T>
  post: <T>(path: string, data?: unknown) => Promise<T>
  put: <T>(path: string, data?: unknown) => Promise<T>
  delete: <T>(path: string) => Promise<T>
}

function trimRightSlash(value: string) {
  return value.replace(/\/+$/, '')
}

function normalizePath(path: string) {
  return path.startsWith('/') ? path : `/${path}`
}

function buildQuery(query?: Record<string, unknown>) {
  if (!query) return ''

  const entries = Object.entries(query).filter(([, value]) => value !== undefined && value !== '')
  if (entries.length === 0) return ''

  return `?${entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')}`
}

function buildUrl(baseUrl: string, path: string, query?: Record<string, unknown>) {
  return `${trimRightSlash(baseUrl)}/api/v1${normalizePath(path)}${buildQuery(query)}`
}

async function call<T>(baseUrl: string, method: HttpMethod, path: string, data?: unknown, query?: Record<string, unknown>) {
  const token = getStorageSync('token')
  const header: Record<string, string> = {}
  if (token) header.Authorization = `Bearer ${token}`

  const response = await request({
    url: buildUrl(baseUrl, path, query),
    method,
    data,
    header
  }) as RequestResult

  if (response.statusCode === 401) {
    removeStorageSync('token')
    throw new Error(messageFromResponse(response.data, '登录已过期'))
  }

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(messageFromResponse(response.data, '请求失败'))
  }

  return unwrapApiData<T>(response.data)
}

export function createRemoteClient(baseUrl = 'http://localhost:8080'): RemoteClient {
  return {
    get: (path, query) => call(baseUrl, 'GET', path, undefined, query),
    post: (path, data) => call(baseUrl, 'POST', path, data),
    put: (path, data) => call(baseUrl, 'PUT', path, data),
    delete: (path) => call(baseUrl, 'DELETE', path)
  }
}
