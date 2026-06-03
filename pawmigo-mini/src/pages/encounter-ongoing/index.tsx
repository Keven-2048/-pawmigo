import { Button, Text, View } from '@tarojs/components'
import { AppBar, IconButton } from '../../components/ui'
import { backOrHome, openPage } from '../../utils/navigation'

export default function EncounterOngoingPage() {
  return (
    <View className='app-screen'>
      <AppBar
        title='偶遇进行中'
        left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/meeting-point/index')} />}
        right={<IconButton icon='shield' tone='yellow' onClick={() => openPage('/pages/safety-center/index')} />}
      />

      <View className='app-content' style='padding:20px;'>
        <View className='ongoing-hero'>
          <Text className='eyebrow'>距离集合点</Text>
          <Text className='ongoing-distance'>120m</Text>
          <Text style='font-size:15px;font-weight:800;'>预计 3 分钟后到达</Text>
        </View>

        <View className='card' style='margin:20px 0;'>
          <View className='row-between'>
            <View className='stack' style='gap:4px;'>
              <Text style='font-size:20px;font-weight:900;'>布丁 & 球球</Text>
              <Text className='text-sm text-muted' style='font-weight:700;'>滨江公园 · 中央草坪入口</Text>
            </View>
            <Text className='tag tag-green'>已出发</Text>
          </View>
        </View>

        <View className='timeline-card'>
          {['邀约成功', '集合点已确认', '双方正在前往'].map((item, index) => (
            <View className='timeline-row' key={item}>
              <View className='timeline-dot'><Text>{index + 1}</Text></View>
              <Text style='font-weight:900;'>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className='action-bar-fixed'>
        <Button className='secondary-button' style='flex:1;' onClick={() => openPage('/pages/chat/index')}>
          发消息
        </Button>
        <Button
          className='primary-button'
          type='primary'
          style='flex:2;'
          onClick={() => openPage('/pages/encounter-feedback/index', { replace: true })}
        >
          完成偶遇
        </Button>
      </View>
    </View>
  )
}
