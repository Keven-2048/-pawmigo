import { Button, Text, View } from '@tarojs/components'
import { AppIcon } from '../../components/icons'
import { AppBar, IconButton } from '../../components/ui'
import { backOrHome, openPage } from '../../utils/navigation'

const history = [
  ['完成一次偶遇反馈', '+12', '今天 18:20'],
  ['给大福投喂骨头', '-8', '昨天 20:12'],
  ['队伍周任务奖励', '+30', '05/28 09:10'],
]

export default function WalletPage() {
  return (
    <View className='app-screen'>
      <AppBar
        title='骨头钱包'
        left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/profile/index')} />}
        right={<IconButton icon='info' tone='yellow' onClick={() => openPage('/pages/wallet-tasks/index')} />}
      />

      <View className='app-content' style='padding:0;'>
        <View className='wallet-hero'>
          <Text className='eyebrow' style='background:#fff;color:#000;'>当前余额</Text>
          <View className='bone-balance'>
            <AppIcon name='bone' color='#ffffff' />
            <Text>128</Text>
          </View>
          <Text style='font-size:14px;font-weight:800;opacity:.92;'>用于送礼、报名活动和兑换权益</Text>
        </View>

        <View style='padding:20px;'>
          <View className='wallet-actions'>
            <Button className='primary-button' type='primary' hoverClass='button-hover' onClick={() => openPage('/pages/wallet-tasks/index')}>
              赚骨头
            </Button>
            <Button className='secondary-button' hoverClass='button-hover' onClick={() => openPage('/pages/reward-shop/index')}>
              去兑换
            </Button>
          </View>

          <View className='section-header' style='margin:24px 0 12px;'>
            <View>
              <Text className='eyebrow'>明细</Text>
              <Text className='section-title'>最近记录</Text>
            </View>
          </View>

          <View className='card' style='padding:0;overflow:hidden;'>
            {history.map(([title, amount, time]) => (
              <View className='history-item' key={title}>
                <View className='stack' style='gap:4px;'>
                  <Text style='font-size:16px;font-weight:900;'>{title}</Text>
                  <Text className='text-xs text-muted'>{time}</Text>
                </View>
                <Text className={amount.startsWith('+') ? 'wallet-plus' : 'wallet-minus'}>{amount}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  )
}
