import Module from 'node:module'
import { resolve } from 'node:path'

type ModuleResolver = (
  request: string,
  parent: NodeModule | undefined,
  isMain: boolean,
  options?: unknown
) => string

const aliasFlag = '__PETCIRCLE_TEST_ALIAS_REGISTERED__'
const moduleWithResolver = Module as unknown as {
  _resolveFilename: ModuleResolver
}
const globalWithAlias = globalThis as typeof globalThis & Record<typeof aliasFlag, boolean>

if (!globalWithAlias[aliasFlag]) {
  const originalResolveFilename = moduleWithResolver._resolveFilename
  const compiledSrcRoot = resolve(__dirname, '../src')

  moduleWithResolver._resolveFilename = function resolveAlias(request, parent, isMain, options) {
    if (request === '@tarojs/taro') {
      return originalResolveFilename.call(
        this,
        resolve(__dirname, 'fakes/taro'),
        parent,
        isMain,
        options
      )
    }

    if (request.startsWith('@/')) {
      return originalResolveFilename.call(
        this,
        resolve(compiledSrcRoot, request.slice(2)),
        parent,
        isMain,
        options
      )
    }

    return originalResolveFilename.call(this, request, parent, isMain, options)
  }

  globalWithAlias[aliasFlag] = true
}
