import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  canDeleteComment,
  getPetDetailActions,
  resolveAuthGuardDestination,
  getInvitePerspective,
  isOwnedByCurrentUser
} from '../src/utils/ownership'
import type { Invite } from '../src/types/domain'

function inviteFor(fromUserId: number, toUserId: number): Invite {
  return {
    id: 1,
    fromUserId,
    fromPetId: 11,
    toUserId,
    toPetId: 22,
    type: 'walk',
    title: '一起散步',
    description: '傍晚见',
    locationName: '社区花园',
    meetTime: '2026-06-08T18:00:00.000Z',
    status: 'pending',
    createdAt: '2026-06-08T09:00:00.000Z',
    updatedAt: '2026-06-08T09:00:00.000Z'
  }
}

test('detects invite perspective from the provided current user id', () => {
  assert.equal(getInvitePerspective(inviteFor(7, 42), 42), 'received')
  assert.equal(getInvitePerspective(inviteFor(7, 42), 7), 'sent')
  assert.equal(getInvitePerspective(inviteFor(7, 42), 99), 'unrelated')
})

test('treats missing current user as not owning content', () => {
  assert.equal(isOwnedByCurrentUser(42, undefined), false)
  assert.equal(isOwnedByCurrentUser(42, 7), false)
  assert.equal(isOwnedByCurrentUser(42, 42), true)
})

test('allows deleting a comment only for the comment owner or post owner', () => {
  assert.equal(canDeleteComment({ commentUserId: 7, postUserId: 42, currentUserId: undefined }), false)
  assert.equal(canDeleteComment({ commentUserId: 7, postUserId: 42, currentUserId: 99 }), false)
  assert.equal(canDeleteComment({ commentUserId: 7, postUserId: 42, currentUserId: 7 }), true)
  assert.equal(canDeleteComment({ commentUserId: 7, postUserId: 42, currentUserId: 42 }), true)
})

test('chooses safe pet-detail actions for own pets and other users pets', () => {
  assert.deepEqual(getPetDetailActions({ petUserId: 42, currentUserId: undefined }), {
    secondary: 'none',
    primary: 'none'
  })
  assert.deepEqual(getPetDetailActions({ petUserId: 42, currentUserId: 42 }), {
    secondary: 'edit',
    primary: 'publish'
  })
  assert.deepEqual(getPetDetailActions({ petUserId: 42, currentUserId: 7 }), {
    secondary: 'block',
    primary: 'invite'
  })
})

test('resolves auth guard destinations for login and first-pet gates', () => {
  assert.equal(resolveAuthGuardDestination({ hasToken: false, loggedIn: false, requirePet: true, petCount: 0 }), 'login')
  assert.equal(resolveAuthGuardDestination({ hasToken: true, loggedIn: true, requirePet: true, petCount: 0 }), 'create-pet')
  assert.equal(resolveAuthGuardDestination({ hasToken: true, loggedIn: true, requirePet: false, petCount: 0 }), 'ready')
  assert.equal(resolveAuthGuardDestination({ hasToken: true, loggedIn: true, requirePet: true, petCount: 1 }), 'ready')
})
