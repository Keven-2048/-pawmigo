import { useEffect, useState } from 'react'
import { Button, Text, View } from '@tarojs/components'
import { AppIcon } from '../../components/icons'
import { AppBar, IconButton, MainNav } from '../../components/ui'
import { api, EncounterCandidate } from '../../services/api'
import { openPage } from '../../utils/navigation'
import { useRequireAuth } from '../../utils/useRequireAuth'

type Mode = 'radar' | 'swipe'

export default function EncounterPage() {
  useRequireAuth()
  const [mode, setMode] = useState<Mode>('radar')
  const [candidates, setCandidates] = useState<EncounterCandidate[]>([])
  const [loading, setLoading] = useState(false)
  const [index, setIndex] = useState(0)
  const candidate = candidates[index]

  useEffect(() => {
    setLoading(true)
    api.getCandidates(mode).then((data) => {
      setCandidates(data)
      setIndex(0)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [mode])

  return (
    <View className='app-screen'>
      <AppBar
        title='发起偶遇'
        left={<IconButton icon='info' tone='yellow' onClick={() => openPage('/pages/encounter-guide/index')} />}
        right={<IconButton icon='settings' tone='yellow' onClick={() => openPage('/pages/encounter-settings/index')} />}
      />

      <View className='tab-nav'>
        <View className={mode === 'radar' ? 'tab-btn tab-btn-active' : 'tab-btn'} onClick={() => setMode('radar')}>
          <Text>一键匹配</Text>
        </View>
        <View className={mode === 'swipe' ? 'tab-btn tab-btn-active' : 'tab-btn'} onClick={() => setMode('swipe')}>
          <Text>滑卡选狗</Text>
        </View>
      </View>

      <View className='app-content' style='padding:0;'>
        <View className={mode === 'radar' ? 'mode-content mode-content-active' : 'mode-content'}>
          <View className='radar-circle'>
            <View className='radar-ring radar-ring-a' />
            <View className='radar-ring radar-ring-b' />
            <View className='radar-ring radar-ring-c' />
            <View className='radar-avatar'><AppIcon name='dog' /></View>
          </View>
          <Text style='font-size:22px;font-weight:900;'>
            {loading ? '正在寻找附近的玩伴...' : '附近的玩伴已就位'}
          </Text>
          <View className='radar-count'>
            <Text className='radar-count-num'>{candidates.length}</Text>
            <Text className='radar-count-label'>个正在遛狗的小伙伴</Text>
          </View>
          <Button
            className='primary-button'
            type='primary'
            style='width:220px;margin-top:24px;'
            onClick={() => openPage('/pages/matching-radar/index')}
          >
            开始扫描
          </Button>
        </View>

        <View className={mode === 'swipe' ? 'mode-content mode-content-active' : 'mode-content'}>
          {candidate ? (
            <View className='swipe-container'>
              <View className='swipe-stack'>
                <View className='swipe-media'>
                  <Text className='swipe-distance'>{candidate.distance}</Text>
                  <AppIcon name='dog' className='swipe-pet-icon' />
                </View>
                <View className='swipe-content'>
                  <View className='pet-header'>
                    <View className='stack' style='gap:0;'>
                      <Text className='pet-name'>{candidate.name}</Text>
                      <Text className='pet-breed'>{candidate.breed} · 匹配 {candidate.score}</Text>
                    </View>
                    <Text className='tag tag-yellow'>E狗出没</Text>
                  </View>
                  <View className='tag-cloud'>
                    <Text className='tag tag-blue'>性格温顺</Text>
                    <Text className='tag'>喜欢飞盘</Text>
                    <Text className='tag tag-green'>已打疫苗</Text>
                  </View>
                  <Text className='pet-bio'>
                    "{candidate.reason}"
                  </Text>
                </View>
              </View>

              <View className='swipe-actions'>
                <View className='action-group-vertical'>
                  <Button className='circle-button circle-button-pass' onClick={() => setIndex((i) => i + 1)}>
                    <AppIcon name='x' />
                  </Button>
                  <Text className='action-label'>再见</Text>
                </View>
                <View className='action-group-vertical'>
                  <Button className='circle-button circle-button-super' onClick={() => openPage(`/pages/encounter-waiting/index?id=${candidate.id}`)}>
                    <AppIcon name='star' />
                  </Button>
                  <Text className='action-label'>超级喜欢</Text>
                </View>
                <View className='action-group-vertical'>
                  <Button
                    className='circle-button circle-button-like'
                    onClick={() => openPage(`/pages/encounter-waiting/index?id=${candidate.id}`)}
                  >
                    <AppIcon name='check' color='#ffffff' />
                  </Button>
                  <Text className='action-label'>打招呼</Text>
                </View>
              </View>
            </View>
          ) : (
            <View className='text-center' style='padding:60px 20px;'>
              <Text className='text-muted'>暂无推荐玩伴，切换到其他模式试试</Text>
            </View>
          )}
        </View>
      </View>

      <MainNav active='encounter' />
    </View>
  )
}
