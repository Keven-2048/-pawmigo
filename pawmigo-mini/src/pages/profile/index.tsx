import { Button, Text, View } from '@tarojs/components'
import { AppIcon, IconName } from '../../components/icons'
import { AppBar, IconButton, MainNav } from '../../components/ui'
import { openPage } from '../../utils/navigation'

const menu = [
  { title: '骨头钱包', meta: '128 >', highlight: true, url: '/pages/wallet/index', icon: 'wallet' },
  { title: '荣誉奖杯墙', meta: '已获得 5 枚 >', url: '/pages/trophy-wall/index', icon: 'trophy' },
  { title: '我的队伍', meta: '3 个 >', url: '/pages/team/index', icon: 'team' },
  { title: '设置', meta: '>', url: '/pages/settings/index', icon: 'settings' },
] satisfies Array<{ title: string; meta: string; highlight?: boolean; url?: string; icon: IconName }>

export default function ProfilePage() {
  return (
    <View className='app-screen'>
      <AppBar
        title='我的'
        right={<IconButton icon='shield' tone='yellow' onClick={() => openPage('/pages/safety-center/index')} />}
      />

      <View className='app-content' style='padding:0;'>
        <View className='profile-header'>
          <View className='profile-avatar'><AppIcon name='dog' /></View>
          <Text style='font-size:28px;font-weight:900;'>球球</Text>
          <View className='row' style='justify-content:center;gap:8px;margin-top:12px;'>
            <Text className='tag tag-yellow'>社牛</Text>
            <Text className='tag tag-blue'>运动健将</Text>
          </View>
          <View className='row' style='justify-content:center;gap:16px;margin-top:20px;'>
            <View style='text-align:center;'>
              <Text style='display:block;font-weight:900;font-size:18px;'>86</Text>
              <Text className='text-xs text-muted'>获赠骨头</Text>
            </View>
            <View style='text-align:center;'>
              <Text style='display:block;font-weight:900;font-size:18px;'>32</Text>
              <Text className='text-xs text-muted'>偶遇次数</Text>
            </View>
          </View>
        </View>

        {menu.map((item) => (
          <View
            className={item.highlight ? 'profile-menu-item highlight' : 'profile-menu-item'}
            key={item.title}
            onClick={() => item.url && openPage(item.url)}
          >
            <View className='row' style='gap:12px;'>
              <View className='menu-icon'><AppIcon name={item.icon} /></View>
              <Text style='font-weight:900;'>{item.title}</Text>
            </View>
            <Text className={item.highlight ? '' : 'text-muted text-xs'} style='font-weight:900;font-size:14px;'>
              {item.meta}
            </Text>
          </View>
        ))}

        <View style='padding:32px 24px;'>
          <Button className='secondary-button' onClick={() => openPage('/pages/splash/index', { reset: true })}>
            退出登录
          </Button>
        </View>
      </View>

      <MainNav active='profile' />
    </View>
  )
}
