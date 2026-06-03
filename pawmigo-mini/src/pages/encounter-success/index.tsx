import { Button, Text, View } from '@tarojs/components'
import { AppIcon } from '../../components/icons'
import { openPage } from '../../utils/navigation'

export default function EncounterSuccessPage() {
  return (
    <View className='app-screen'>
      <View className='app-content text-center' style='padding:48px 20px;'>
        <Text className='eyebrow'>匹配成功</Text>
        <View className='success-burst'>
          <AppIcon name='check' />
        </View>
        <Text style='display:block;font-size:34px;font-weight:900;'>布丁 接受了邀约</Text>
        <Text className='text-muted' style='display:block;margin-top:10px;font-weight:700;'>
          现在确认一个双方都安全方便的集合点
        </Text>

        <View className='card' style='text-align:left;margin-top:32px;'>
          <View className='row-between'>
            <Text style='font-size:18px;font-weight:900;'>推荐集合点</Text>
            <Text className='tag tag-blue'>300m</Text>
          </View>
          <Text className='text-muted text-sm' style='display:block;margin-top:10px;font-weight:700;'>
            滨江公园 · 中央草坪入口，开放视野，附近有照明和饮水点。
          </Text>
        </View>
      </View>

      <View className='footer-actions'>
        <Button className='primary-button' type='primary' onClick={() => openPage('/pages/meeting-point/index', { replace: true })}>
          确认集合点
        </Button>
      </View>
    </View>
  )
}
