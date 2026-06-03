import { Button, Text, View } from '@tarojs/components'
import { AppIcon } from '../../components/icons'
import { openPage } from '../../utils/navigation'

export default function MatchingRadarPage() {
  return (
    <View className='app-screen'>
      <View className='app-content text-center' style='padding:46px 20px;'>
        <Text className='eyebrow'>一键匹配</Text>
        <Text style='display:block;font-size:34px;font-weight:900;margin-top:10px;'>扫描附近玩伴</Text>
        <View className='radar-circle radar-page-circle'>
          <View className='radar-ring' />
          <View className='radar-avatar'><AppIcon name='dog' /></View>
        </View>
        <Text className='text-muted' style='display:block;font-weight:800;'>已发现 3 个符合条件的毛孩子</Text>
      </View>

      <View className='footer-actions'>
        <Button className='primary-button' type='primary' onClick={() => openPage('/pages/match-results/index', { replace: true })}>
          查看匹配结果
        </Button>
      </View>
    </View>
  )
}
