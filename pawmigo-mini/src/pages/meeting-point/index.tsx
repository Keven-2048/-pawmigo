import { Button, Text, View } from '@tarojs/components'
import { AppBar, IconButton } from '../../components/ui'
import { backOrHome, openPage } from '../../utils/navigation'

export default function MeetingPointPage() {
  return (
    <View className='app-screen'>
      <AppBar title='集合点确认' left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/encounter-success/index')} />} />

      <View className='app-content' style='padding:0;'>
        <View className='meeting-map'>
          <View className='meeting-pin meeting-pin-a'><Text>我</Text></View>
          <View className='meeting-pin meeting-pin-b'><Text>布</Text></View>
          <View className='meeting-target'><Text>集合</Text></View>
        </View>

        <View className='card' style='margin-top:-20px;position:relative;z-index:5;'>
          <Text className='eyebrow'>推荐地点</Text>
          <Text style='display:block;font-size:24px;font-weight:900;'>滨江公园 · 中央草坪入口</Text>
          <Text className='text-muted text-sm' style='display:block;margin-top:12px;font-weight:700;line-height:1.8;'>
            距离你约 260m，距离布丁约 310m。该区域开放、明亮，适合首次见面。
          </Text>
        </View>
      </View>

      <View className='action-bar-fixed'>
        <Button className='secondary-button' style='flex:1;' onClick={() => openPage('/pages/map-filter/index')}>
          换一个
        </Button>
        <Button
          className='primary-button'
          type='primary'
          style='flex:2;'
          onClick={() => openPage('/pages/encounter-ongoing/index', { replace: true })}
        >
          确认并出发
        </Button>
      </View>
    </View>
  )
}
