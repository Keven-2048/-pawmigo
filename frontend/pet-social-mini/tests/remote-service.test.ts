import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import './setup-alias'
import {
  getLoginCalls,
  getRequestCalls,
  getStorageSync,
  resetTaroFake,
  setLoginResult,
  setRequestHandler,
  setStorageSync
} from './fakes/taro'
import { createRemoteClient } from '../src/services/remote/client'
import { createRemoteServices } from '../src/services/remote'
import { createServicesForMode } from '../src/services'

afterEach(() => {
  resetTaroFake()
})

test('service mode selects mock and remote adapters', () => {
  const mockServices = createServicesForMode('mock')
  const remoteServices = createServicesForMode('remote')

  assert.notEqual(mockServices.authService.login, remoteServices.authService.login)
})

test('service mode rejects unsupported API modes', () => {
  assert.throws(
    () => createServicesForMode('local-dev'),
    /Unsupported TARO_APP_API_MODE: local-dev/
  )
})

test('remote client joins base url, sends auth header, and unwraps data', async () => {
  setStorageSync('token', 'remote-token')
  setRequestHandler(() => ({
    statusCode: 200,
    data: {
      code: 0,
      message: 'ok',
      data: { id: 7, nickname: '小松' }
    }
  }))

  const client = createRemoteClient('http://localhost:8080')
  const result = await client.get('/user/me')

  assert.deepEqual(result, { id: 7, nickname: '小松' })
  assert.deepEqual(getRequestCalls(), [
    {
      url: 'http://localhost:8080/api/v1/user/me',
      method: 'GET',
      data: undefined,
      header: {
        Authorization: 'Bearer remote-token'
      }
    }
  ])
})

test('remote client normalizes business errors', async () => {
  setRequestHandler(() => ({
    statusCode: 200,
    data: {
      code: 40001,
      message: '用户未登录'
    }
  }))

  const client = createRemoteClient('http://localhost:8080')

  await assert.rejects(() => client.get('/user/me'), /用户未登录/)
})

test('remote client removes token on 401 responses', async () => {
  setStorageSync('token', 'expired-token')
  setRequestHandler(() => ({
    statusCode: 401,
    data: {
      code: 401,
      message: '登录已过期'
    }
  }))

  const client = createRemoteClient('http://localhost:8080')

  await assert.rejects(() => client.get('/user/me'), /登录已过期/)
  assert.equal(getStorageSync('token'), '')
})

test('remote auth login sends the WeChat login code to backend', async () => {
  setLoginResult({
    code: 'wx-code-from-taro',
    errMsg: 'login:ok'
  })
  setRequestHandler(() => ({
    statusCode: 200,
    data: {
      code: 0,
      message: 'ok',
      data: {
        token: 'remote-token',
        user: {
          id: 1,
          nickname: '小松',
          avatarUrl: '',
          privacy: {
            allowNearbyVisible: true,
            allowStrangerInvite: true,
            allowComment: true,
            showOwnerName: true,
            showCity: true,
            notificationEnabled: true
          }
        }
      }
    }
  }))

  const services = createRemoteServices(createRemoteClient('http://api.test'))
  const result = await services.authService.login()

  assert.deepEqual(getLoginCalls(), [{}])
  assert.equal(result.token, 'remote-token')
  assert.deepEqual(getRequestCalls(), [
    {
      url: 'http://api.test/api/v1/auth/wechat-login',
      method: 'POST',
      data: {
        code: 'wx-code-from-taro'
      },
      header: {}
    }
  ])
})

test('remote auth login rejects when WeChat login returns no code', async () => {
  setLoginResult({
    code: '',
    errMsg: 'login:ok'
  })

  const services = createRemoteServices(createRemoteClient('http://api.test'))

  await assert.rejects(() => services.authService.login(), /微信登录失败：未获取到 code/)
  assert.deepEqual(getLoginCalls(), [{}])
  assert.deepEqual(getRequestCalls(), [])
})

test('remote upload service requests credential and uploads raw bytes with presigned PUT', async () => {
  const uploadUrl = 'https://cos.example.com/obj?sign=x'
  const fileUrl = 'https://cos.example.com/obj'
  setRequestHandler((options) => {
    if (options.url.includes('/upload/credential')) {
      return {
        statusCode: 200,
        data: {
          code: 0,
          message: 'ok',
          data: {
            uploadUrl,
            fileUrl,
            objectKey: 'k',
            expiresIn: 900
          }
        }
      }
    }

    if (options.url === uploadUrl && options.method === 'PUT') {
      return {
        statusCode: 200,
        data: {}
      }
    }

    throw new Error(`Unexpected request: ${options.method} ${options.url}`)
  })

  const services = createRemoteServices(createRemoteClient('http://api.test'))
  const result = await services.uploadService.uploadImage('wxfile://tmp_a.png')

  assert.equal(result, fileUrl)
  const calls = getRequestCalls()
  assert.equal(calls.length, 2)
  assert.equal(calls[0].url, 'http://api.test/api/v1/upload/credential')
  assert.equal(calls[0].method, 'POST')
  assert.deepEqual(calls[0].data, { ext: 'png' })
  assert.equal(calls[1].url, uploadUrl)
  assert.equal(calls[1].method, 'PUT')
  assert.equal(calls[1].header.Authorization, undefined)
})

test('remote upload service rejects when presigned PUT fails', async () => {
  const uploadUrl = 'https://cos.example.com/obj?sign=x'
  setRequestHandler((options) => {
    if (options.url.includes('/upload/credential')) {
      return {
        statusCode: 200,
        data: {
          code: 0,
          message: 'ok',
          data: {
            uploadUrl,
            fileUrl: 'https://cos.example.com/obj',
            objectKey: 'k',
            expiresIn: 900
          }
        }
      }
    }

    return {
      statusCode: 403,
      data: {}
    }
  })

  const services = createRemoteServices(createRemoteClient('http://api.test'))

  await assert.rejects(() => services.uploadService.uploadImage('wxfile://tmp_a.png'), /图片上传失败/)
})

test('remote service maps P0 methods to backend routes', async () => {
  const seen: Array<{ method?: string; url: string; data?: unknown }> = []
  setRequestHandler((options) => {
    seen.push({
      method: options.method,
      url: options.url,
      data: options.data
    })
    return {
      statusCode: 200,
      data: {
        code: 0,
        message: 'ok',
        data: {}
      }
    }
  })

  const services = createRemoteServices(createRemoteClient('http://api.test'))

  await services.authService.login()
  await services.authService.me()
  await services.userService.updatePrivacy({
    allowNearbyVisible: true,
    allowStrangerInvite: true,
    allowComment: true,
    showOwnerName: true,
    showCity: true,
    notificationEnabled: true
  })
  await services.userService.blocks()
  await services.petService.myPets()
  await services.petService.detail(101)
  await services.petService.create({
    name: '豆包',
    avatarUrl: '',
    type: 'dog',
    breed: '柯基',
    gender: 'male',
    sterilized: true,
    vaccineStatus: 'completed',
    personalityTags: [],
    interestTags: [],
    description: '',
    visible: true
  })
  await services.petService.update(101, {
    name: '豆包',
    avatarUrl: '',
    type: 'dog',
    breed: '柯基',
    gender: 'male',
    sterilized: true,
    vaccineStatus: 'completed',
    personalityTags: [],
    interestTags: [],
    description: '',
    visible: true
  })
  await services.petService.delete(101)
  await services.petService.setDefault(101)
  await services.locationService.update({
    latitude: 31,
    longitude: 121,
    city: '上海',
    district: '徐汇区'
  })
  await services.nearbyService.pets({ type: 'dog', distance: 3000 }, 2, 10)
  await services.inviteService.create({
    fromPetId: 101,
    toPetId: 102,
    type: 'walk',
    title: '一起散步',
    description: '',
    locationName: '社区花园',
    meetTime: '2026-06-10T19:00:00.000Z'
  })
  await services.inviteService.list('received', 'pending')
  await services.inviteService.detail(501)
  await services.inviteService.accept(501)
  await services.inviteService.reject(501)
  await services.inviteService.cancel(501)
  await services.postService.list('nearby', 1, 20)
  await services.postService.detail(801)
  await services.postService.create({
    petId: 101,
    content: '今天很开心',
    images: [],
    locationName: '社区花园',
    topicTags: [],
    visibility: 'public'
  })
  await services.postService.delete(801)
  await services.postService.like(801)
  await services.postService.unlike(801)
  await services.postService.comments(801)
  await services.postService.createComment(801, '太可爱了')
  await services.postService.deleteComment(901)
  await services.reportService.create({
    targetType: 'post',
    targetId: 801,
    reason: '广告营销',
    description: '',
    images: []
  })
  await services.blockService.create(2, '不想互动')
  await services.blockService.list()

  assert.deepEqual(
    seen.map((call) => `${call.method} ${call.url}`),
    [
      'POST http://api.test/api/v1/auth/wechat-login',
      'GET http://api.test/api/v1/user/me',
      'PUT http://api.test/api/v1/user/privacy',
      'GET http://api.test/api/v1/blocks',
      'GET http://api.test/api/v1/pets/my',
      'GET http://api.test/api/v1/pets/101',
      'POST http://api.test/api/v1/pets',
      'PUT http://api.test/api/v1/pets/101',
      'DELETE http://api.test/api/v1/pets/101',
      'POST http://api.test/api/v1/pets/101/default',
      'POST http://api.test/api/v1/location/update',
      'GET http://api.test/api/v1/nearby/pets?type=dog&distance=3000&page=2&page_size=10',
      'POST http://api.test/api/v1/invites',
      'GET http://api.test/api/v1/invites?box=received&status=pending',
      'GET http://api.test/api/v1/invites/501',
      'POST http://api.test/api/v1/invites/501/accept',
      'POST http://api.test/api/v1/invites/501/reject',
      'POST http://api.test/api/v1/invites/501/cancel',
      'GET http://api.test/api/v1/posts?feed=nearby&page=1&page_size=20',
      'GET http://api.test/api/v1/posts/801',
      'POST http://api.test/api/v1/posts',
      'DELETE http://api.test/api/v1/posts/801',
      'POST http://api.test/api/v1/posts/801/like',
      'DELETE http://api.test/api/v1/posts/801/like',
      'GET http://api.test/api/v1/posts/801/comments',
      'POST http://api.test/api/v1/posts/801/comments',
      'DELETE http://api.test/api/v1/comments/901',
      'POST http://api.test/api/v1/reports',
      'POST http://api.test/api/v1/blocks',
      'GET http://api.test/api/v1/blocks'
    ]
  )
})
