import { Button, Text, View } from '@tarojs/components'
import { AppIcon } from '../../components/icons'
import { AppBar, IconButton } from '../../components/ui'
import { backOrHome, openPage } from '../../utils/navigation'

const rewards = [
  ['超级喜欢卡', '20 骨头', 'star'],
  ['队伍活动券', '50 骨头', 'team'],
  ['主页贴纸包', '30 骨头', 'edit'],
] as const

export default function RewardShopPage() {
  return (
    <View className='app-screen'>
      <AppBar title='兑换中心' left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/wallet/index')} />} />
      <View className='app-content' style='padding:20px;'>
        {rewards.map(([title, price, icon]) => (
          <View className='match-result-card' key={title}>
            <View className='match-avatar' style='background:#22d3ee;'><AppIcon name={icon} /></View>
            <View className='stack' style='gap:4px;flex:1;'>
              <Text style='font-size:17px;font-weight:900;'>{title}</Text>
              <Text className='text-xs text-muted'>{price}</Text>
            </View>
            <Button className='primary-button' type='primary' onClick={() => openPage('/pages/wallet/index', { replace: true })}>
              兑换
            </Button>
          </View>
        ))}
      </View>
    </View>
  )
}
