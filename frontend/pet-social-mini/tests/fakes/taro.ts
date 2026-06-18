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
type ChooseImageResult = {
  tempFilePaths: string[]
  tempFiles?: unknown[]
}
type ReadFileOptions = {
  filePath: string
  success: (res: { data: ArrayBuffer }) => void
  fail?: (error: Error) => void
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
let chooseImageResult: ChooseImageResult = {
  tempFilePaths: ['wxfile://tmp_a.png']
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
  chooseImageResult = {
    tempFilePaths: ['wxfile://tmp_a.png']
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

export function setChooseImageResult(nextResult: ChooseImageResult) {
  chooseImageResult = nextResult
}

export async function login() {
  loginCalls.push({})
  return loginResult
}

export async function chooseImage() {
  return chooseImageResult
}

export function getFileSystemManager() {
  const data = new Uint8Array([1, 2, 3]).buffer
  return {
    readFile: ({ success }: ReadFileOptions) => success({ data }),
    readFileSync: () => data
  }
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
