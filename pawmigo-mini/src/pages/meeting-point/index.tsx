import { useEffect, useState } from 'react'
import { Button, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AppIcon } from '../../components/icons'
import { AppBar, IconButton } from '../../components/ui'
import { api, EncounterCandidate } from '../../services/api'
import { useEncounterStore } from '../../store/encounterStore'
import { backOrHome, getRouterParam, openPage } from '../../utils/navigation'

interface PointOption {
  name: string
  desc: string
  distance: string
}

export default function MeetingPointPage() {
  const id = Number(getRouterParam('id')) || 0
  const [candidate, setCandidate] = useState<EncounterCandidate | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    api.getCandidates('radar').then((list) => {
      setCandidate(list.find((c) => c.id === id) || list[0])
    }).catch(() => {})
  }, [id])

  const selectPoint = (index: number) => {
    setSelectedIndex(index)
    Taro.showToast({ title: '已选择该集合点', icon: 'success' })
  }

  if (!candidate) {
    return (
      <View className='app-screen'>
        <AppBar title='集合点确认' left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/encounter-success/index')} />} />
        <View className='app-content text-center' style='padding:40px 20px;'>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  const points: PointOption[] = [
    { name: '滨江公园北门广场', desc: `距离你约 400m · 视野开阔`, distance: '400m' },
    { name: 'Manner Coffee (滨江店)', desc: `距离你约 550m · 宠物友好`, distance: '550m' },
  ]

  return (
    <View className='app-screen page-with-action-bar'>
      <AppBar title='集合点确认' left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/encounter-success/index')} />} />

      <View className='app-content' style='padding:0;'>
        <View className='meeting-map'>
          <View className='meeting-pin meeting-pin-a'><Text>我</Text></View>
          <View className='meeting-pin meeting-pin-b'><Text>{candidate.name.slice(0, 1)}</Text></View>
          <View className='meeting-target'><Text>集合</Text></View>
        </View>

        <View style='padding:24px 20px 8px;'>
          <View className='eyebrow'>推荐公共地点</View>
          <Text style='display:block;font-size:24px;font-weight:900;'>选择一个集合地点</Text>
          <Text className='text-sm text-muted' style='display:block;margin-top:8px;'>系统优先推荐公共开放场地，更安全可靠。</Text>
        </View>

        {points.map((point, index) => (
          <View
            className={selectedIndex === index ? 'point-card point-card-selected' : 'point-card'}
            key={point.name}
            onClick={() => selectPoint(index)}
          >
            <View className='point-icon'>
              <AppIcon name={index === 0 ? 'map-pin' : 'home'} />
            </View>
            <View className='stack' style='flex:1;gap:4px;'>
              <Text style='font-weight:800;font-size:16px;'>{point.name}</Text>
              <Text className='text-xs text-muted'>{point.desc}</Text>
            </View>
          </View>
        ))}

        <View className='card' style='background:#FFFBEB;border-style:dashed;margin-top:20px;'>
          <View className='row' style='gap:12px;align-items:flex-start;'>
            <AppIcon name='shield' />
            <View className='stack' style='gap:4px;'>
              <Text style='font-size:14px;font-weight:900;'>安全提示</Text>
              <Text className='text-xs text-muted'>建议选择明亮、开放区域，不要在私人住宅或隐蔽角落集合。</Text>
            </View>
          </View>
        </View>
      </View>

      <View className='action-bar-fixed' style='position:sticky;bottom:0;'>
        <Button
          className='primary-button'
          type='primary'
          onClick={() => {
            // Lock in the meeting point (status: accepted -> meeting), then depart.
            useEncounterStore.getState().confirmPoint(points[selectedIndex].name)
              .catch(() => {})
              .finally(() => openPage(`/pages/encounter-ongoing/index?id=${candidate.id}`, { replace: true }))
          }}
        >
          确认地点并出发
        </Button>
      </View>
    </View>
  )
}
