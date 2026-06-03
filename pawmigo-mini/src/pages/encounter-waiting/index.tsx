import { Button, Text, View } from '@tarojs/components'
import { AppIcon } from '../../components/icons'
import { openPage } from '../../utils/navigation'

export default function EncounterWaitingPage() {
  return (
    <View className='app-screen'>
      <View className='app-content text-center' style='padding:40px 20px;'>
        <Text className='eyebrow'>邀请已发送</Text>
        <Text style='display:block;font-size:32px;font-weight:900;margin-top:12px;'>正在等待 布丁 回应</Text>

        <View className='loading-pulse'>
          <AppIcon name='dog' color='#ffffff' className='pulse-icon' />
        </View>

        <Text className='countdown'>02:59</Text>
        <Text className='text-muted' style='display:block;font-weight:700;'>若超时未回应，建议换一只毛孩子试试</Text>

        <View className='card' style='background:#f8fafc;text-align:left;margin-top:40px;'>
          <Text style='display:block;font-size:16px;font-weight:900;margin-bottom:12px;'>遛遛贴士</Text>
          <Text className='text-sm text-muted' style='font-weight:700;line-height:1.8;'>
            对方接受后，你们将进入“集合点确认”环节。系统会优先推荐附近的开放广场和公园。
          </Text>
        </View>
      </View>

      <View className='footer-actions'>
        <Button className='secondary-button' onClick={() => openPage('/pages/encounter-success/index', { replace: true })}>
          模拟接受邀约
        </Button>
      </View>
    </View>
  )
}
