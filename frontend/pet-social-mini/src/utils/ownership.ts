import type { ID, Invite } from '@/types/domain'

export type InvitePerspective = 'received' | 'sent' | 'unrelated'
export type AuthGuardDestination = 'login' | 'create-pet' | 'ready'
export type PetDetailAction = 'block' | 'invite' | 'edit' | 'publish' | 'none'

interface CommentDeletePermission {
  commentUserId: ID
  postUserId: ID
  currentUserId?: ID
}

interface AuthGuardState {
  hasToken: boolean
  loggedIn: boolean
  requirePet: boolean
  petCount: number
}

interface PetDetailActionState {
  petUserId: ID
  currentUserId?: ID
}

export function isOwnedByCurrentUser(ownerUserId: ID, currentUserId?: ID) {
  return currentUserId !== undefined && ownerUserId === currentUserId
}

export function getInvitePerspective(invite: Invite, currentUserId?: ID): InvitePerspective {
  if (currentUserId === undefined) return 'unrelated'
  if (invite.toUserId === currentUserId) return 'received'
  if (invite.fromUserId === currentUserId) return 'sent'
  return 'unrelated'
}

export function canDeleteComment({
  commentUserId,
  postUserId,
  currentUserId
}: CommentDeletePermission) {
  return isOwnedByCurrentUser(commentUserId, currentUserId) || isOwnedByCurrentUser(postUserId, currentUserId)
}

export function getPetDetailActions(
  { petUserId, currentUserId }: PetDetailActionState
): { secondary: PetDetailAction; primary: PetDetailAction } {
  if (currentUserId === undefined) {
    return {
      secondary: 'none',
      primary: 'none'
    }
  }

  if (isOwnedByCurrentUser(petUserId, currentUserId)) {
    return {
      secondary: 'edit',
      primary: 'publish'
    }
  }

  return {
    secondary: 'block',
    primary: 'invite'
  }
}

export function resolveAuthGuardDestination({
  hasToken,
  loggedIn,
  requirePet,
  petCount
}: AuthGuardState): AuthGuardDestination {
  if (!hasToken && !loggedIn) return 'login'
  if (requirePet && petCount === 0) return 'create-pet'
  return 'ready'
}
