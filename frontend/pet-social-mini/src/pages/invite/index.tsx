import { useEffect, useState } from 'react'
import { navigateTo } from '@tarojs/taro'
import { Text, View } from '@tarojs/components'
import { EmptyState } from '@/components/EmptyState'
import { InviteCard } from '@/components/InviteCard'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { inviteService } from '@/services'
import type { Invite, InviteStatus } from '@/types/domain'
import { showToast } from '@/utils/navigation'
import './index.scss'

const statusFilters: Array<'all' | InviteStatus> = ['all', 'pending', 'accepted', 'rejected']
const statusFilterLabel: Record<'all' | InviteStatus, string> = {
  all: '全部',
  pending: '待处理',
  accepted: '已接受',
  rejected: '已拒绝',
  cancelled: '已取消',
  expired: '已过期',
  completed: '已完成',
  reported: '已举报'
}

export default function InvitePage() {
  const ready = useAuthGuard({ requirePet: true })
  const [box, setBox] = useState<'received' | 'sent'>('received')
  const [statusFilter, setStatusFilter] = useState<'all' | InviteStatus>('all')
  const [invites, setInvites] = useState<Invite[]>([])
  const [processingId, setProcessingId] = useState<number | undefined>()

  const load = async (nextBox = box) => {
    try {
      const list = await inviteService.list(nextBox)
      setInvites(list)
    } catch (error) {
      showToast(error instanceof Error ? error.message : '邀请加载失败')
    }
  }

  useEffect(() => {
    if (ready) load()
  }, [box, ready])

  const update = async (action: 'accept' | 'reject' | 'cancel', id: number) => {
    if (processingId) return
    setProcessingId(id)
    try {
      if (action === 'accept') await inviteService.accept(id)
      if (action === 'reject') await inviteService.reject(id)
      if (action === 'cancel') await inviteService.cancel(id)
      showToast('已处理', 'success')
      await load()
    } catch (error) {
      showToast(error instanceof Error ? error.message : '处理失败')
    } finally {
      setProcessingId(undefined)
    }
  }

  if (!ready) {
    return (
      <View className="page page--tab invite-page">
        <EmptyState title="正在进入邀请" />
      </View>
    )
  }

  const displayedInvites = invites.filter((invite) => statusFilter === 'all' || invite.status === statusFilter)

  return (
    <View className="page page--tab invite-page">
      <View className="invite-page__appbar capsule-safe-appbar">
        <View className="invite-page__title-row">
          <View className="invite-page__pin ui-icon ui-icon--pin" />
          <Text className="invite-page__title">邀请</Text>
        </View>
        <View className="invite-page__search capsule-safe-appbar__action ui-icon ui-icon--search" />
      </View>

      <View className="invite-tabs">
        {(['received', 'sent'] as const).map((item) => (
          <View className={`invite-tab ${box === item ? 'invite-tab--active' : ''}`} key={item} onClick={() => setBox(item)}>
            <Text>{item === 'received' ? '收到的' : '发出的'}</Text>
          </View>
        ))}
      </View>

      <View className="invite-filter-chips">
        {statusFilters.map((item) => (
          <View className={`invite-filter-chip ${statusFilter === item ? 'invite-filter-chip--active' : ''}`} key={item} onClick={() => setStatusFilter(item)}>
            {statusFilterLabel[item]}
          </View>
        ))}
      </View>

      {displayedInvites.length ? (
        <View className="invite-list">
          {displayedInvites.map((invite) => (
            <InviteCard
              key={invite.id}
              invite={invite}
              box={box}
              onOpen={() => navigateTo({ url: `/subpackages/invite/detail/index?id=${invite.id}` })}
              onAccept={() => update('accept', invite.id)}
              onReject={() => update('reject', invite.id)}
              onCancel={() => update('cancel', invite.id)}
              processing={processingId === invite.id}
            />
          ))}
        </View>
      ) : (
        <EmptyState title="暂无邀请" description="去附近宠友主页发起一次温柔的见面邀请吧。" />
      )}
    </View>
  )
}
