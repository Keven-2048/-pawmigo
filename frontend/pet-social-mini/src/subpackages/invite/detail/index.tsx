import { useEffect, useState } from 'react'
import { navigateBack, navigateTo, useRouter } from '@tarojs/taro'
import { Image, Text, View } from '@tarojs/components'
import { Button } from '@/components/NutUI'
import { INVITE_TYPE_LABEL } from '@/constants/options'
import { EmptyState } from '@/components/EmptyState'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { inviteService } from '@/services'
import { useUserStore } from '@/store/userStore'
import type { Invite } from '@/types/domain'
import { shortDateTime } from '@/utils/format'
import { showToast } from '@/utils/navigation'
import { getInvitePerspective } from '@/utils/ownership'
import { parseRouteId } from '@/utils/route'
import './index.scss'

const STATUS_LABEL = {
  pending: '待处理',
  accepted: '已接受',
  rejected: '已拒绝',
  cancelled: '已取消',
  expired: '已过期',
  completed: '已完成',
  reported: '已举报'
}

export default function InviteDetailPage() {
  const ready = useAuthGuard({ requirePet: true })
  const router = useRouter()
  const id = parseRouteId(router.params.id)
  const currentUserId = useUserStore((state) => state.user?.id)
  const [invite, setInvite] = useState<Invite>()
  const [processing, setProcessing] = useState(false)

  const load = async () => {
    if (!id) return
    try {
      setInvite(await inviteService.detail(id))
    } catch (error) {
      showToast(error instanceof Error ? error.message : '邀请详情加载失败')
    }
  }

  useEffect(() => {
    if (ready) load()
  }, [id, ready])

  const update = async (action: 'accept' | 'reject' | 'cancel') => {
    if (processing) return
    if (!id) return
    setProcessing(true)
    try {
      if (action === 'accept') await inviteService.accept(id)
      if (action === 'reject') await inviteService.reject(id)
      if (action === 'cancel') await inviteService.cancel(id)
      showToast('已处理', 'success')
      await load()
    } catch (error) {
      showToast(error instanceof Error ? error.message : '处理失败')
    } finally {
      setProcessing(false)
    }
  }

  if (!ready) {
    return (
      <View className="page invite-detail">
        <EmptyState title="正在进入邀请详情" />
      </View>
    )
  }

  if (!id) {
    return (
      <View className="page invite-detail">
        <EmptyState title="邀请参数无效" description="请返回邀请列表后重新打开详情。" />
      </View>
    )
  }

  if (!invite) {
    return (
      <View className="page">
        <EmptyState title="邀请详情加载中" />
      </View>
    )
  }

  const perspective = getInvitePerspective(invite, currentUserId)
  const isReceived = perspective === 'received'
  const isSent = perspective === 'sent'
  const myPet = isReceived ? invite.toPet : invite.fromPet
  const peerPet = isReceived ? invite.fromPet : invite.toPet

  return (
    <View className="invite-detail">
      <View className="invite-detail__topbar">
        <View className="invite-detail__back ui-icon ui-icon--back" onClick={() => navigateBack()} />
        <Text className="invite-detail__page-title">邀请详情</Text>
        <View className="invite-detail__share">
          <View className="invite-detail__share-dot" />
          <View className="invite-detail__share-dot" />
          <View className="invite-detail__share-dot" />
        </View>
      </View>

      <View className="invite-detail__status-strip">
        <View className="invite-detail__status">
          <View className="invite-detail__status-icon invite-detail__status-icon--time" />
          <Text>{STATUS_LABEL[invite.status]}</Text>
        </View>
        <Text className="invite-detail__status-copy">{invite.status === 'pending' ? 'Ta 正在查看你的邀约，请保持手机畅通哦' : invite.title}</Text>
      </View>

      <View className="invite-detail__match-card">
        <View className="invite-detail__pet-side">
          <Image className="invite-detail__pet-avatar" src={myPet?.avatarUrl || ''} mode="aspectFill" />
          <Text className="invite-detail__pet-name">{myPet?.name || '我的宠物'}</Text>
          <Text className="invite-detail__pet-tag">{isReceived ? '收到邀请' : '我发起的'}</Text>
        </View>
        <View className="invite-detail__match-heart">
          <View className="invite-detail__match-heart-icon ui-icon ui-icon--heart" />
        </View>
        <View className="invite-detail__pet-side">
          <Image className="invite-detail__pet-avatar invite-detail__pet-avatar--peer" src={peerPet?.avatarUrl || ''} mode="aspectFill" />
          <Text className="invite-detail__pet-name">{peerPet?.name || '对方宠物'}</Text>
          <Text className="invite-detail__pet-tag invite-detail__pet-tag--orange">{INVITE_TYPE_LABEL[invite.type]}</Text>
        </View>
        <View className="invite-detail__match-stats">
          <View>
            <Text className="invite-detail__stat-label">状态</Text>
            <Text className="invite-detail__stat-value">{STATUS_LABEL[invite.status]}</Text>
          </View>
          <View>
            <Text className="invite-detail__stat-label">时间</Text>
            <Text className="invite-detail__stat-value">{shortDateTime(invite.meetTime)}</Text>
          </View>
          <View>
            <Text className="invite-detail__stat-label">活动</Text>
            <Text className="invite-detail__stat-value">{INVITE_TYPE_LABEL[invite.type]}</Text>
          </View>
        </View>
      </View>

      <View className="invite-detail__arrangement">
        <Text className="invite-detail__section-title">活动安排</Text>
        <View className="invite-detail__info-card">
          <View className="invite-detail__info-icon invite-detail__info-icon--calendar" />
          <View>
            <Text className="invite-detail__info-label">邀约类型 & 时间</Text>
            <Text className="invite-detail__info-value">{INVITE_TYPE_LABEL[invite.type]} · {shortDateTime(invite.meetTime)}</Text>
          </View>
        </View>
        <View className="invite-detail__info-card">
          <View className="invite-detail__info-icon ui-icon ui-icon--pin" />
          <View className="invite-detail__info-flex">
            <Text className="invite-detail__info-label">地点</Text>
            <Text className="invite-detail__info-value">{invite.locationName}</Text>
            <View className="invite-detail__map-preview">模糊地图预览</View>
          </View>
        </View>
        <View className="invite-detail__info-card">
          <View className="invite-detail__info-icon invite-detail__info-icon--note" />
          <View>
            <Text className="invite-detail__info-label">补充留言</Text>
            <Text className="invite-detail__info-value">{invite.description}</Text>
          </View>
        </View>
      </View>

      <View className="invite-detail__safety-card">
        <View className="invite-detail__shield ui-icon ui-icon--shield" />
        <View>
          <Text className="invite-detail__safety-title">宠友安全提示</Text>
          <Text className="invite-detail__safety-text">在线下见面时，建议选择公共场所并备好牵引绳。</Text>
        </View>
      </View>

      <View className="invite-detail__bottom-actions">
        {invite.status === 'pending' && isReceived ? (
          <>
            <Button className="invite-detail__ghost" disabled={processing} loading={processing} onClick={() => update('reject')}>拒绝</Button>
            <Button className="invite-detail__primary" disabled={processing} loading={processing} onClick={() => update('accept')}>接受邀请</Button>
          </>
        ) : null}
        {invite.status === 'pending' && isSent ? (
          <Button className="invite-detail__ghost" disabled={processing} loading={processing} onClick={() => update('cancel')}>取消邀请</Button>
        ) : null}
        <Button className="invite-detail__report" onClick={() => navigateTo({ url: `/subpackages/settings/report/index?targetType=invite&targetId=${invite.id}` })}>举报</Button>
      </View>
    </View>
  )
}
