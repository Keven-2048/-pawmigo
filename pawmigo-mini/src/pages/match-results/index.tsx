import { useEffect, useState } from 'react'
import { Button, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AppIcon } from '../../components/icons'
import { AppBar, IconButton } from '../../components/ui'
import { api, EncounterCandidate } from '../../services/api'
import { backOrHome, openPage } from '../../utils/navigation'

export default function MatchResultsPage() {
  const [candidates, setCandidates] = useState<EncounterCandidate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getCandidates('radar').then((list) => {
      setCandidates(list)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <View className='app-screen'>
        <AppBar title='匹配结果' left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/encounter/index')} />} />
        <View className='app-content text-center' style='padding:40px 20px;'>
          <Text>扫描中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='app-screen'>
      <AppBar title='匹配结果' left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/encounter/index')} />} />
      <View className='app-content' style='padding:32px 24px;'>
        <Text style='display:block;font-size:28px;font-weight:900;margin-bottom:32px;text-align:center;'>
          发现 {candidates.length} 位完美玩伴
        </Text>

        {candidates.map((candidate, index) => (
          <View className='result-card' key={candidate.id}>
            {index === 0 && (
              <View className='best-match-badge'>
                <Text>最佳匹配</Text>
              </View>
            )}

            <View className='row' style='gap:20px;'>
              <View className={`match-pet-avatar match-pet-avatar-${index === 0 ? 'yellow' : index === 1 ? 'cyan' : 'rose'}`}>
                <AppIcon name='dog' />
              </View>
              <View style='flex:1;'>
                <Text style='font-size:24px;font-weight:900;display:block;'>{candidate.name}</Text>
                <Text className='text-muted' style='font-weight:800;font-size:14px;'>{candidate.breed} · 距离 {candidate.distance}</Text>
              </View>
            </View>

            <View className='reason-box'>
              ✨ 推荐理由：{candidate.reason}
            </View>

            <View className='row' style='gap:12px;'>
              <Button
                className='primary-button'
                style='flex:1;'
                type='primary'
                onClick={() => openPage(`/pages/encounter-waiting/index?id=${candidate.id}`, { replace: true })}
              >
                发送邀请
              </Button>
              <Button
                className='secondary-button'
                style='padding:14px;min-width:0;'
                onClick={() => openPage(`/pages/pet-detail/index?id=${candidate.id}`)}
              >
                <AppIcon name='info' />
              </Button>
            </View>
          </View>
        ))}

        <View className='text-center' style='margin-top:32px;'>
          <Button className='secondary-button' onClick={() => Taro.showToast({ title: '正在为您换一批...', icon: 'none' })}>
            换一批试试
          </Button>
        </View>
      </View>
    </View>
  )
}
