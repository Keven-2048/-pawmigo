import { Button, Text, View } from '@tarojs/components'
import { AppBar, IconButton } from '../../components/ui'
import { backOrHome, openPage } from '../../utils/navigation'

const settings = [
  ['匹配范围', '800m 内'],
  ['宠物体型', '不限'],
  ['仅看已认证', '已开启'],
  ['夜间安全提醒', '已开启'],
]

export default function EncounterSettingsPage() {
  return (
    <View className='app-screen'>
      <AppBar title='偶遇设置' left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/encounter/index')} />} />
      <View className='app-content' style='padding:20px;'>
        <View className='card' style='padding:0;overflow:hidden;margin:0;'>
          {settings.map(([title, value]) => (
            <View className='safety-item' key={title}>
              <Text style='font-size:17px;font-weight:900;'>{title}</Text>
              <Text className='tag tag-yellow'>{value}</Text>
            </View>
          ))}
        </View>
      </View>
      <View className='footer-actions'>
        <Button className='primary-button' type='primary' onClick={() => openPage('/pages/encounter/index', { replace: true })}>
          保存设置
        </Button>
      </View>
    </View>
  )
}
