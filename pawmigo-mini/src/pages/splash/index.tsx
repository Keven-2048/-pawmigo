import { Button, Text, View } from '@tarojs/components'
import { AppIcon } from '../../components/icons'
import { openPage } from '../../utils/navigation'

export default function SplashPage() {
  return (
    <View className='app-screen'>
      <View className='prototype-splash-content'>
        <View className='brand-logo'><AppIcon name='paw' /></View>
        <Text className='brand-title'>遛遛{'\n'}PAWMIGO</Text>
        <Text className='slogan'>附近的毛孩子，{'\n'}一起遛个弯</Text>
      </View>

      <View className='footer-actions'>
        <Button
          className='primary-button'
          type='primary'
          onClick={() => openPage('/pages/login/index', { replace: true })}
        >
          开启偶遇之旅
        </Button>
        <Text className='text-xs text-center text-muted' style='display:block;margin-top:16px;'>
          附近的宠友正在活跃中
        </Text>
      </View>
    </View>
  )
}
