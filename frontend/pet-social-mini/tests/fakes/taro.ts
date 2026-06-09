type RequestOptions = {
  url: string
  method?: string
  data?: unknown
  header?: Record<string, string>
}

type RequestResponse = {
  statusCode: number
  data: unknown
}

type RequestHandler = (options: RequestOptions) => Promise<RequestResponse> | RequestResponse

const storage = new Map<string, unknown>()
const calls: RequestOptions[] = []

let handler: RequestHandler = () => ({
  statusCode: 200,
  data: {
    code: 0,
    message: 'ok',
    data: {}
  }
})

export function resetTaroFake() {
  storage.clear()
  calls.splice(0, calls.length)
  handler = () => ({
    statusCode: 200,
    data: {
      code: 0,
      message: 'ok',
      data: {}
    }
  })
}

export function setRequestHandler(nextHandler: RequestHandler) {
  handler = nextHandler
}

export function getRequestCalls() {
  return calls.map((call) => ({ ...call, header: { ...call.header } }))
}

export async function request(options: RequestOptions) {
  calls.push({ ...options, header: { ...options.header } })
  return handler(options)
}

export function getStorageSync(key: string) {
  return storage.get(key) || ''
}

export function setStorageSync(key: string, value: unknown) {
  storage.set(key, value)
}

export function removeStorageSync(key: string) {
  storage.delete(key)
}
