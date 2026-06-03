import { Button, Text, View } from '@tarojs/components'
import { AppIcon } from '../../components/icons'
import { AppBar, IconButton } from '../../components/ui'
import { backOrHome, openPage } from '../../utils/navigation'

const steps = [
  ['选择方式', '一键匹配、地图圈选或滑卡选狗。'],
  ['等待回应', '对方接受后进入集合点确认。'],
  ['安全见面', '选择公开场地，并保留紧急求助入口。'],
]

export default function EncounterGuidePage() {
  return (
    <View className='app-screen'>
      <AppBar title='偶遇说明' left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/encounter/index')} />} />
      <View className='app-content' style='padding:20px;'>
        <View className='card' style='background:#facc15;margin:0 0 20px;'>
          <AppIcon name='radar' />
          <Text style='display:block;font-size:30px;font-weight:900;margin-top:12px;'>三步完成一次安全偶遇</Text>
        </View>

        <View className='card' style='padding:0;overflow:hidden;'>
          {steps.map(([title, body], index) => (
            <View className='safety-item' key={title}>
              <View className='timeline-dot'><Text>{index + 1}</Text></View>
              <View className='stack' style='gap:4px;flex:1;'>
                <Text style='font-size:17px;font-weight:900;'>{title}</Text>
                <Text className='text-xs text-muted'>{body}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
      <View className='footer-actions'>
        <Button className='primary-button' type='primary' onClick={() => openPage('/pages/encounter/index', { replace: true })}>
          开始偶遇
        </Button>
      </View>
    </View>
  )
}
