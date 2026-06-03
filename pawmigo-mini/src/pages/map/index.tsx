import { Text, View } from '@tarojs/components'
import { AppIcon } from '../../components/icons'
import { AppBar, IconButton, MainNav } from '../../components/ui'
import { useAppStore } from '../../store/appStore'
import { backOrHome, openPage } from '../../utils/navigation'

const markers = [
  { top: '30%', left: '20%', label: '约 300m', tone: '', status: 'walking' },
  { top: '45%', left: '70%', label: '约 500m', tone: 'background:#22d3ee;', status: 'just-started pulse' },
  { top: '15%', left: '55%', label: '约 800m', tone: 'background:#facc15;', status: 'offline' },
  { top: '60%', left: '40%', label: '约 400m', tone: 'background:#fb7185;', status: 'appointed' },
]

export default function MapPage() {
  const isWalking = useAppStore((state) => state.isWalking)
  const toggleWalking = useAppStore((state) => state.toggleWalking)

  return (
    <View className='app-screen'>
      <AppBar
        title='发现附近'
        left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/splash/index')} />}
        right={<IconButton icon='menu' tone='yellow' onClick={() => openPage('/pages/map-filter/index')} />}
      />

      <View className='map-container'>
        <View className='map-overlay-top'>
          <View className='location-card'>
            <AppIcon name='map-pin' color='#a855f7' />
            <View className='stack' style='gap:0;'>
              <Text className='text-xs'>当前位置</Text>
              <Text style='font-weight:800;font-size:14px;'>滨江公园附近</Text>
            </View>
          </View>

          <View className='safety-toast'>
            <Text>盾 位置已模糊处理 · 隐私受保护</Text>
          </View>
        </View>

        {markers.map((marker) => (
          <View
            className='marker'
            style={`position:absolute;top:${marker.top};left:${marker.left};`}
            key={marker.label}
            onClick={() => openPage('/pages/pet-detail/index')}
          >
            <Text className='marker-label'>{marker.label}</Text>
            <View className='marker-avatar' style={marker.tone} />
            <View className={`marker-status ${marker.status}`} />
          </View>
        ))}

        <View className='active-walker' style='top:50%;left:50%;transform:translate(-50%,-50%);' />

        <View className='walking-status-panel'>
          <View className='status-switch-container'>
            <View className='stack' style='gap:4px;'>
              <View className='row' style='gap:8px;'>
                <Text className='card-title'>我在遛</Text>
                <Text className={isWalking ? 'status-badge status-on' : 'status-badge status-off'}>
                  {isWalking ? '已开启' : '未开启'}
                </Text>
              </View>
              <Text className='text-xs text-muted'>
                {isWalking ? '即将超时 (还有 28分钟)' : '开启后对附近宠友可见，模糊距离'}
              </Text>
            </View>
            <View className={isWalking ? 'status-toggle status-toggle-on' : 'status-toggle'} onClick={toggleWalking}>
              <View className='toggle-knob' />
            </View>
          </View>
        </View>
      </View>

      <MainNav active='map' />
    </View>
  )
}
