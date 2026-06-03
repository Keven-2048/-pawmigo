import { useState } from 'react'
import { Button, Text, View } from '@tarojs/components'
import { AppIcon } from '../../components/icons'
import { AppBar, IconButton, MainNav } from '../../components/ui'
import { openPage } from '../../utils/navigation'

type Mode = 'radar' | 'lasso' | 'swipe'

export default function EncounterPage() {
  const [mode, setMode] = useState<Mode>('radar')

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
        <View className={mode === 'lasso' ? 'tab-btn tab-btn-active' : 'tab-btn'} onClick={() => setMode('lasso')}>
          <Text>地图圈选</Text>
        </View>
        <View className={mode === 'swipe' ? 'tab-btn tab-btn-active' : 'tab-btn'} onClick={() => setMode('swipe')}>
          <Text>滑卡选狗</Text>
        </View>
      </View>

      <View className='app-content' style='padding:0;'>
        <View className={mode === 'radar' ? 'mode-content mode-content-active' : 'mode-content'}>
          <View className='radar-circle'>
            <View className='radar-avatar'><AppIcon name='dog' /></View>
          </View>
          <Text style='font-size:22px;font-weight:900;'>正在寻找附近的玩伴...</Text>
          <Text className='text-muted' style='font-size:15px;margin-top:8px;'>已发现 3 个正在遛狗的小伙伴</Text>
          <Button
            className='primary-button'
            type='primary'
            style='width:220px;margin-top:24px;'
            onClick={() => openPage('/pages/matching-radar/index')}
          >
            开始扫描
          </Button>
        </View>

        <View className={mode === 'lasso' ? 'mode-content mode-content-active' : 'mode-content'}>
          <View className='lasso-map'>
            <Text className='lasso-hint'>在此区域圈选</Text>
            <View className='map-dot' style='top:30%;left:20%;' />
            <View className='map-dot' style='top:60%;left:50%;' />
            <View className='map-dot' style='top:40%;left:80%;' />
          </View>
          <Text style='font-size:22px;font-weight:900;'>框选一个范围</Text>
          <Text className='text-muted' style='font-size:15px;margin-top:8px;'>向圈内的所有小伙伴群发偶遇邀请</Text>
          <Button
            className='primary-button'
            type='primary'
            style='width:220px;margin-top:24px;'
            onClick={() => openPage('/pages/match-results/index')}
          >
            开始圈选
          </Button>
        </View>

        <View className={mode === 'swipe' ? 'mode-content mode-content-active' : 'mode-content'}>
          <View className='swipe-container'>
            <View className='swipe-stack'>
              <View className='swipe-media'>
                <Text className='swipe-distance'>500m</Text>
                <AppIcon name='dog' className='swipe-pet-icon' />
              </View>
              <View className='swipe-content'>
                <View className='pet-header'>
                  <View className='stack' style='gap:0;'>
                    <Text className='pet-name'>大福 ♂</Text>
                    <Text className='pet-breed'>日本柴犬 · 2岁</Text>
                  </View>
                  <Text className='tag tag-yellow'>E狗出没</Text>
                </View>
                <View className='tag-cloud'>
                  <Text className='tag tag-blue'>性格温顺</Text>
                  <Text className='tag'>喜欢飞盘</Text>
                  <Text className='tag tag-green'>已打疫苗</Text>
                  <Text className='tag'>12kg</Text>
                </View>
                <Text className='pet-bio'>
                  “我是大福！最喜欢在奥森公园草地上打滚，希望能遇到一起赛跑的好兄弟~”
                </Text>
              </View>
            </View>

            <View className='swipe-actions'>
              <View className='action-group-vertical'>
                <Button className='circle-button circle-button-pass' onClick={() => openPage('/pages/match-results/index', { replace: true })}>
                  <AppIcon name='x' />
                </Button>
                <Text className='action-label'>再见</Text>
              </View>
              <View className='action-group-vertical'>
                <Button className='circle-button circle-button-super' onClick={() => openPage('/pages/encounter-waiting/index')}>
                  <AppIcon name='star' />
                </Button>
                <Text className='action-label'>超级喜欢</Text>
              </View>
              <View className='action-group-vertical'>
                <Button
                  className='circle-button circle-button-like'
                  onClick={() => openPage('/pages/encounter-waiting/index')}
                >
                  <AppIcon name='check' color='#ffffff' />
                </Button>
                <Text className='action-label'>打招呼</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <MainNav active='encounter' />
    </View>
  )
}
