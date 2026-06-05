import { useEffect, useState } from 'react'
import { Button, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AppIcon } from '../../components/icons'
import { AppBar, IconButton } from '../../components/ui'
import { api, EncounterCandidate } from '../../services/api'
import { useEncounterStore } from '../../store/encounterStore'
import { getRouterParam, openPage } from '../../utils/navigation'

export default function EncounterWaitingPage() {
  const id = Number(getRouterParam('id')) || 0
  const [candidate, setCandidate] = useState<EncounterCandidate | null>(null)
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState(179)

  useEffect(() => {
    api.getCandidates('radar').then((list) => {
      const found = list.find((c) => c.id === id) || list[0]
      setCandidate(found)
      if (found) {
        // Start the persisted encounter journey (status: waiting).
        useEncounterStore.getState().start(found).catch(() => {})
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  // Real countdown timer — auto-redirect when timeout
  useEffect(() => {
    if (loading || !candidate) return
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          // Auto-transition: partner accepts (status: waiting -> accepted).
          useEncounterStore.getState().accept().catch(() => {})
          Taro.showToast({ title: `${candidate.name} 接受了你的邀约！`, icon: 'success' })
          setTimeout(() => {
            openPage(`/pages/encounter-success/index?id=${candidate.id}`, { replace: true })
          }, 1500)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [loading, candidate])

  const mins = Math.floor(countdown / 60)
  const secs = countdown % 60
  const timerDisplay = `0${mins}:${secs < 10 ? '0' : ''}${secs}`

  const handleCancel = () => {
    Taro.showModal({
      title: '确定取消吗？',
      content: `取消后 ${candidate?.name ?? '对方'} 将不再收到你的邀请提醒。`,
      confirmText: '确认取消',
      cancelText: '再等等',
      success: (res) => {
        if (res.confirm) {
          useEncounterStore.getState().cancel().catch(() => {})
          openPage('/pages/map/index', { replace: true })
        }
      },
    })
  }

  if (loading) {
    return (
      <View className='app-screen'>
        <View className='app-content text-center' style='padding:40px 20px;'>
          <Text>发送邀请中...</Text>
        </View>
      </View>
    )
  }

  if (!candidate) {
    return (
      <View className='app-screen'>
        <AppBar title='邀请已发送' left={<IconButton icon='arrow-left' tone='yellow' onClick={() => openPage('/pages/match-results/index', { replace: true })} />} />
        <View className='app-content text-center' style='padding:40px 20px;'>
          <Text>未找到匹配信息</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='app-screen'>
      <View className='app-content text-center' style='padding:40px 20px;'>
        <View className='eyebrow'>邀请已发送</View>
        <Text style='display:block;font-size:32px;font-weight:900;margin-top:12px;'>正在等待 {candidate.name} 回应</Text>

        {countdown > 0 ? (
          <>
            <View className='loading-pulse'>
              <AppIcon name='dog' color='#ffffff' className='pulse-icon' />
            </View>
            <Text className='countdown'>{timerDisplay}</Text>
            <Text className='text-muted' style='display:block;font-weight:700;'>若超时未回应，建议换一只毛孩子试试</Text>
          </>
        ) : (
          <>
            <View className='loading-pulse' style='background:#f87171;'>
              <AppIcon name='x' color='#ffffff' className='pulse-icon' />
            </View>
            <Text className='countdown' style='font-size:24px;'>邀请已过期</Text>
            <Text className='text-muted' style='display:block;font-weight:700;'>对方未在 3 分钟内回应</Text>
          </>
        )}

        <View className='card' style='background:#F8FAFC;text-align:left;margin-top:40px;'>
          <Text style='display:block;font-size:16px;font-weight:900;margin-bottom:12px;'>💡 遛遛贴士</Text>
          <Text className='text-sm text-muted' style='font-weight:700;line-height:1.8;'>
            对方接受后，你们将进入"集合点确认"环节。系统会优先推荐附近的开放广场和公园。
          </Text>
        </View>
      </View>

      <View style='position:fixed;bottom:40px;left:20px;right:20px;'>
        <Button className='secondary-button' style='background:#f87171;color:#fff;' onClick={handleCancel}>
          取消邀约
        </Button>
      </View>
    </View>
  )
}
