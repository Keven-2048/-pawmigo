import { Image, Text, View } from '@tarojs/components'
import type { Invite } from '@/types/domain'
import { shortDateTime } from '@/utils/format'

interface InviteCardProps {
  invite: Invite
  box: 'received' | 'sent'
  onOpen?: () => void
  onAccept?: () => void
  onReject?: () => void
  onCancel?: () => void
  processing?: boolean
}

const STATUS_LABEL = {
  pending: '待处理',
  accepted: '已接受',
  rejected: '已拒绝',
  cancelled: '已取消',
  expired: '已过期',
  completed: '已完成',
  reported: '已举报'
}

export function InviteCard({ invite, box, onOpen, onAccept, onReject, onCancel, processing = false }: InviteCardProps) {
  const peerPet = box === 'received' ? invite.fromPet : invite.toPet
  const myPet = box === 'received' ? invite.toPet : invite.fromPet

  return (
    <View className="invite-card" onClick={onOpen}>
      <View className="invite-card__top">
        <View className="invite-card__avatars">
          <Image className="invite-card__avatar" src={myPet?.avatarUrl || ''} mode="aspectFill" />
          <View className="invite-card__avatar invite-card__avatar--peer">
            <Image className="invite-card__avatar-image" src={peerPet?.avatarUrl || ''} mode="aspectFill" />
            <View className="invite-card__heart ui-icon ui-icon--heart" />
          </View>
        </View>
        <Text className={`invite-card__status invite-card__status--${invite.status}`}>
          {STATUS_LABEL[invite.status]}
        </Text>
      </View>
      <Text className="invite-card__title">{invite.title}</Text>
      <View className="invite-card__schedule">
        <View className="invite-card__line">
          <View className="invite-card__line-icon invite-card__line-icon--time" />
          <Text>{shortDateTime(invite.meetTime)}</Text>
        </View>
        <View className="invite-card__line">
          <View className="invite-card__line-icon ui-icon ui-icon--pin" />
          <Text>{invite.locationName}</Text>
        </View>
      </View>
      {invite.status === 'pending' ? (
        <View className="invite-card__actions">
          {box === 'received' ? (
            <>
              <View className={`invite-card__button ui-button ui-button--primary ${processing ? 'ui-button--disabled' : ''}`} onClick={(event) => {
                event.stopPropagation()
                if (!processing) onAccept?.()
              }}>{processing ? '处理中' : '接受邀请'}</View>
              <View className={`invite-card__button ui-button ui-button--secondary ${processing ? 'ui-button--disabled' : ''}`} onClick={(event) => {
                event.stopPropagation()
                if (!processing) onReject?.()
              }}>拒绝</View>
            </>
          ) : (
            <View className={`invite-card__button ui-button ui-button--secondary ${processing ? 'ui-button--disabled' : ''}`} onClick={(event) => {
              event.stopPropagation()
              if (!processing) onCancel?.()
            }}>取消邀请</View>
          )}
        </View>
      ) : null}
      {invite.status !== 'pending' ? (
        <View className="invite-card__detail-button ui-button ui-button--secondary" onClick={(event) => {
          event.stopPropagation()
          onOpen?.()
        }}>查看详情</View>
      ) : null}
    </View>
  )
}
