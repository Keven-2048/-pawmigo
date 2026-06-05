import { useEffect, useState } from 'react'
import { Button, Text, View } from '@tarojs/components'
import { AppIcon } from '../../components/icons'
import { AppBar, IconButton } from '../../components/ui'
import { api, EncounterCandidate } from '../../services/api'
import { useSessionStore } from '../../store/sessionStore'
import { useEncounterStore } from '../../store/encounterStore'
import { backOrHome, getRouterParam, openPage } from '../../utils/navigation'

export default function EncounterSuccessPage() {
  const id = Number(getRouterParam('id')) || 0
  const [candidate, setCandidate] = useState<EncounterCandidate | null>(null)
  const pets = useSessionStore((s) => s.pets)
  const myPet = pets[0]

  useEffect(() => {
    // Confirm acceptance (no-op if already accepted) so the journey state advances.
    useEncounterStore.getState().accept().catch(() => {})
    api.getCandidates('radar').then((list) => {
      setCandidate(list.find((c) => c.id === id) || list[0])
    }).catch(() => {})
  }, [id])

  if (!candidate) {
    return (
      <View className='app-screen' style='background:#22d3ee;'>
        <AppBar title='匹配成功' left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/map/index')} />} />
        <View className='app-content text-center' style='padding:48px 20px;'>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='app-screen encounter-success-page'>
      <AppBar title='匹配成功' left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/map/index')} />} />
      <View className='success-hero text-center'>
        <View className='eyebrow' style='background:#fff;'>IT'S A MATCH!</View>
        <Text className='success-title'>匹配成功</Text>

        <View className='avatar-pair'>
          <View className='avatar-circle'>
            <View className='heart-float'>
              <AppIcon name='heart' />
            </View>
            <AppIcon name='dog' />
          </View>
          <View className='success-arrow'>
            <AppIcon name='chevron-right' />
          </View>
          <View className='avatar-circle avatar-circle-partner'>
            <AppIcon name='dog' />
          </View>
        </View>

        <Text className='success-msg'>{candidate.name} 也想和你一起遛弯！{'\n'}快去确认集合地点吧。</Text>

        <View style='margin-top:60px; width:100%;'>
          <Button
            className='btn-black'
            onClick={() => openPage(`/pages/meeting-point/index?id=${candidate.id}`, { replace: true })}
          >
            去选集合点
          </Button>
          <Button
            className='secondary-button'
            style='background:#fff;margin-top:16px;'
            onClick={() => openPage('/pages/map/index', { replace: true })}
          >
            先回地图
          </Button>
        </View>
      </View>
    </View>
  )
}
