import { useEffect, useState } from 'react'
import { Button, Text, View } from '@tarojs/components'
import { AppIcon } from '../../components/icons'
import { AppBar, IconButton } from '../../components/ui'
import { api } from '../../services/api'
import { backOrHome, openPage } from '../../utils/navigation'

export default function MatchingRadarPage() {
  const [count, setCount] = useState(0)
  const [scanning, setScanning] = useState(true)

  useEffect(() => {
    api.getCandidates('radar').then((list) => {
      setCount(list.length)
    }).catch(() => {})

    // Auto-redirect after 3s (simulating scan completion)
    const timer = setTimeout(() => {
      setScanning(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <View className='app-screen'>
      <AppBar
        title='一键匹配中'
        left={<IconButton icon='x' tone='yellow' onClick={() => backOrHome('/pages/encounter/index')} />}
      />

      <View className='radar-container'>
        <View className='radar-circles'>
          <View className='radar-circle-ring' />
          <View className='radar-circle-ring radar-circle-ring-2' />
          <View className='radar-circle-ring radar-circle-ring-3' />
          <View className='radar-scan-line' />

          <View className='radar-center-avatar'>
            <AppIcon name='dog' />
          </View>

          {/* Floating candidate pins */}
          <View className='radar-pin radar-pin-1'>
            <AppIcon name='dog' />
          </View>
          <View className='radar-pin radar-pin-2'>
            <AppIcon name='dog' />
          </View>
          <View className='radar-pin radar-pin-3'>
            <AppIcon name='dog' />
          </View>
        </View>

        <Text className='radar-title'>{scanning ? '正在寻找玩伴...' : '扫描完成！'}</Text>
        <Text className='radar-sub'>
          {scanning
            ? `已发现附近 ${count || 8} 只活跃毛孩子`
            : `为你找到 ${count || 3} 位匹配玩伴`}
        </Text>

        <View className='card' style='background:#facc15;border-radius:4px;text-align:center;margin-top:32px;width:100%;'>
          <Text style='font-size:14px;font-weight:800;'>💡 安全提示：位置已进行模糊处理</Text>
        </View>
      </View>

      <View style='padding:40px;'>
        <Button
          className='secondary-button'
          onClick={() => openPage('/pages/match-results/index', { replace: true })}
        >
          {scanning ? '模拟匹配成功' : '查看匹配结果'}
        </Button>
      </View>
    </View>
  )
}
