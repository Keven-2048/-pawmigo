import { Button, Text, View } from '@tarojs/components'
import { AppIcon } from '../../components/icons'
import { AppBar, IconButton } from '../../components/ui'
import { backOrHome, openPage } from '../../utils/navigation'

const tasks = [
  ['完成一次偶遇反馈', '+12', '去偶遇'],
  ['发布一条附近动态', '+6', '去发布'],
  ['加入一个兴趣队伍', '+10', '去组队'],
]

export default function WalletTasksPage() {
  const go = (label: string) => {
    if (label === '去偶遇') openPage('/pages/encounter/index', { replace: true })
    if (label === '去发布') openPage('/pages/post-flow/index', { replace: true })
    if (label === '去组队') openPage('/pages/team/index', { replace: true })
  }

  return (
    <View className='app-screen'>
      <AppBar title='赚骨头' left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/wallet/index')} />} />
      <View className='app-content' style='padding:20px;'>
        {tasks.map(([title, reward, action]) => (
          <View className='match-result-card' key={title}>
            <View className='match-avatar' style='background:#facc15;'><AppIcon name='bone' /></View>
            <View className='stack' style='gap:4px;flex:1;'>
              <Text style='font-size:17px;font-weight:900;'>{title}</Text>
              <Text className='text-xs text-muted'>{reward} 根骨头</Text>
            </View>
            <Button className='secondary-button' onClick={() => go(action)}>{action}</Button>
          </View>
        ))}
      </View>
    </View>
  )
}
