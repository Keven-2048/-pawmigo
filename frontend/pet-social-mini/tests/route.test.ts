import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isReportTargetType, parseRouteId } from '../src/utils/route'

test('parses route ids only when they are positive integers', () => {
  assert.equal(parseRouteId('42'), 42)
  assert.equal(parseRouteId(42), 42)
  assert.equal(parseRouteId('0'), undefined)
  assert.equal(parseRouteId('-1'), undefined)
  assert.equal(parseRouteId('1.5'), undefined)
  assert.equal(parseRouteId('abc'), undefined)
  assert.equal(parseRouteId(undefined), undefined)
})

test('accepts only supported report target types', () => {
  assert.equal(isReportTargetType('user'), true)
  assert.equal(isReportTargetType('pet'), true)
  assert.equal(isReportTargetType('post'), true)
  assert.equal(isReportTargetType('comment'), true)
  assert.equal(isReportTargetType('invite'), true)
  assert.equal(isReportTargetType('message'), false)
  assert.equal(isReportTargetType(undefined), false)
})
