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
type LoginResult = {
  code: string
  errMsg: string
}

const storage = new Map<string, unknown>()
const calls: RequestOptions[] = []
const loginCalls: Array<Record<string, never>> = []

let handler: RequestHandler = () => ({
  statusCode: 200,
  data: {
    code: 0,
    message: 'ok',
    data: {}
  }
})
let loginResult: LoginResult = {
  code: 'test-code',
  errMsg: 'login:ok'
}

export function resetTaroFake() {
  storage.clear()
  calls.splice(0, calls.length)
  loginCalls.splice(0, loginCalls.length)
  handler = () => ({
    statusCode: 200,
    data: {
      code: 0,
      message: 'ok',
      data: {}
    }
  })
  loginResult = {
    code: 'test-code',
    errMsg: 'login:ok'
  }
}

export function setRequestHandler(nextHandler: RequestHandler) {
  handler = nextHandler
}

export function getRequestCalls() {
  return calls.map((call) => ({ ...call, header: { ...call.header } }))
}

export function setLoginResult(nextResult: LoginResult) {
  loginResult = nextResult
}

export function getLoginCalls() {
  return [...loginCalls]
}

export async function login() {
  loginCalls.push({})
  return loginResult
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
