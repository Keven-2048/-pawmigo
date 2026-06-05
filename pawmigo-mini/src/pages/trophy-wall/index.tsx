import { useEffect, useState } from 'react'
import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AppIcon } from '../../components/icons'
import { AppBar, IconButton, MainNav } from '../../components/ui'
import { api, Trophy } from '../../services/api'
import { backOrHome } from '../../utils/navigation'

export default function TrophyWallPage() {
  const [trophies, setTrophies] = useState<Trophy[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getTrophies().then((data) => {
      setTrophies(data)
      setLoading(false)
    }).catch(() => {
      Taro.showToast({ title: '加载失败', icon: 'none' })
      setLoading(false)
    })
  }, [])

  return (
    <View className='app-screen'>
      <AppBar title='荣誉奖杯墙' left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/profile/index')} />} />
      <View className='app-content' style='padding:20px;'>
        {loading && (
          <View className='text-center' style='padding:60px 20px;'>
            <Text className='text-muted'>加载中...</Text>
          </View>
        )}
        {!loading && trophies.length === 0 && (
          <View className='text-center' style='padding:60px 20px;'>
            <Text className='text-muted'>还没有获得奖杯</Text>
          </View>
        )}
        <View className='trophy-grid'>
          {trophies.map((trophy, index) => (
            <View
              className='trophy'
              key={trophy.id}
              style={trophy.unlocked ? (index % 2 === 0 ? 'background:#facc15;' : 'background:#22d3ee;') : 'background:#e5e7eb;'}
            >
              <AppIcon name='trophy' color={trophy.unlocked ? undefined : '#9ca3af'} />
              <Text style='display:block;margin-top:10px;font-size:13px;'>{trophy.name}</Text>
              <Text style='display:block;font-size:11px;color:#6b7280;'>{trophy.desc}</Text>
            </View>
          ))}
        </View>
      </View>
      <MainNav active='profile' />
    </View>
  )
}
