import { useEffect, useState } from 'react'
import { Button, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AppIcon } from '../../components/icons'
import { AppBar, IconButton } from '../../components/ui'
import { api, EncounterCandidate } from '../../services/api'
import { useSessionStore } from '../../store/sessionStore'
import { useEncounterStore } from '../../store/encounterStore'
import { backOrHome, getRouterParam, openPage } from '../../utils/navigation'

const quickMessages = ['我到了', '还要5分钟', '你在哪？', '看到你啦']

export default function EncounterOngoingPage() {
  const id = Number(getRouterParam('id')) || 0
  const pets = useSessionStore((s) => s.pets)
  const activePetId = useSessionStore((s) => s.activePetId)
  const myPet = pets.find((p) => p.id === activePetId) ?? pets[0]
  const [candidate, setCandidate] = useState<EncounterCandidate | null>(null)
  const encounter = useEncounterStore((s) => s.current)

  useEffect(() => {
    api.getCandidates('radar').then((list) => {
      setCandidate(list.find((c) => c.id === id) || list[0])
    }).catch(() => {})
  }, [id])

  const sendQuickMsg = (msg: string) => {
    // Quick hellos land in the real chat thread with this partner.
    api.sendMessage(id || candidate?.id || 0, msg)
      .then(() => Taro.showToast({ title: `已发送：${msg}`, icon: 'success' }))
      .catch(() => Taro.showToast({ title: '发送失败，请重试', icon: 'none' }))
  }

  if (!candidate) {
    return (
      <View className='app-screen'>
        <AppBar title='偶遇进行中' left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/meeting-point/index')} />} />
        <View className='app-content text-center' style='padding:40px 20px;'>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='app-screen page-with-action-bar'>
      <AppBar
        title='偶遇进行中'
        left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/meeting-point/index')} />}
        right={<IconButton icon='shield' tone='rose' style='background:var(--danger);color:#fff;' onClick={() => openPage('/pages/safety-center/index')} />}
      />

      <View className='app-content' style='padding:0;'>
        {/* Map placeholder */}
        <View className='ongoing-map'>
          <View className='ongoing-map-bar'>
            <View className='user-pill'>
              <View className='user-pill-avatar' />
              <Text style='font-weight:800;font-size:14px;'>约 3min 到达</Text>
            </View>
          </View>
          <View className='ongoing-path' />
          <View className='marker' style='position:absolute;top:40%;left:25%;background:#facc15;' />
          <View className='marker' style='position:absolute;bottom:30%;right:20%;background:#a855f7;' />
        </View>

        <View style='padding:24px 20px;'>
          {/* Chat bubble */}
          <View className='chat-bubble-cyan'>
            <Text>👋 我们已经快到公园北门啦！</Text>
          </View>

          <View className='card' style='margin:0;padding:20px;'>
            <View className='row-between'>
              <View className='stack'>
                <Text style='font-size:20px;font-weight:900;'>正在前往集合点</Text>
                <Text className='text-sm text-muted'>{encounter?.meetingPoint || candidate.meetup}</Text>
              </View>
              <Button className='secondary-button' style='padding:8px 16px;font-size:12px;min-height:auto;'>
                导航
              </Button>
            </View>

            <View className='safety-actions'>
              <View className='safety-action-btn' onClick={() => Taro.showToast({ title: '行程已分享给紧急联系人', icon: 'success' })}>
                <AppIcon name='info' />
                <Text>分享行程</Text>
              </View>
              <View className='safety-action-btn' onClick={() => openPage(`/pages/encounter-feedback/index?id=${candidate.id}`, { replace: true })}>
                <AppIcon name='check' />
                <Text>确认集合</Text>
              </View>
            </View>
          </View>

          {/* Quick messages */}
          <View style='margin-top:20px;'>
            <Text className='text-xs text-muted' style='display:block;margin-bottom:8px;'>快捷招呼</Text>
            <View className='row' style='gap:8px;flex-wrap:wrap;'>
              {quickMessages.map((msg) => (
                <View className='tag' key={msg} onClick={() => sendQuickMsg(msg)} style='cursor:pointer;'>
                  <Text>{msg}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      <View className='action-bar-fixed action-bar-split'>
        <Button className='secondary-button' onClick={() => openPage(`/pages/chat/index?id=${candidate.id}`)}>
          发消息
        </Button>
        <Button
          className='primary-button'
          type='primary'
          onClick={() => openPage(`/pages/encounter-feedback/index?id=${candidate.id}`, { replace: true })}
        >
          完成偶遇
        </Button>
      </View>
    </View>
  )
}
