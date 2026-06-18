export interface ApiEnvelope<T> {
  code?: number
  message?: string
  data?: T
}

export function unwrapApiData<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'code' in payload) {
    const envelope = payload as ApiEnvelope<T>
    if (envelope.code !== 0) {
      throw new Error(envelope.message || '请求失败')
    }
    return envelope.data as T
  }

  return payload as T
}

export function messageFromResponse(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const message = (payload as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) return message
  }

  return fallback
}
