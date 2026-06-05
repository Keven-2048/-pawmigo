import { Button, Text, View } from '@tarojs/components'
import { AppIcon, IconName } from '../../components/icons'
import { AppBar, IconButton, MainNav } from '../../components/ui'
import { useSessionStore } from '../../store/sessionStore'
import { openPage } from '../../utils/navigation'
import { useRequireAuth } from '../../utils/useRequireAuth'

export default function ProfilePage() {
  useRequireAuth()
  const user = useSessionStore((s) => s.user)
  const pets = useSessionStore((s) => s.pets)
  const activePetId = useSessionStore((s) => s.activePetId)
  const logout = useSessionStore((s) => s.logout)
  const pet = pets.find((p) => p.id === activePetId) ?? pets[0]

  const menu = [
    { title: '骨头钱包', meta: `${user?.boneBalance ?? 0} >`, highlight: true, url: '/pages/wallet/index', icon: 'wallet' as IconName },
    { title: '荣誉奖杯墙', meta: '查看奖杯 >', url: '/pages/trophy-wall/index', icon: 'trophy' as IconName },
    { title: '我的队伍', meta: `${pets.length > 0 ? pets.length : 0} 只宠物 >`, url: '/pages/team/index', icon: 'team' as IconName },
    { title: '设置', meta: '>', url: '/pages/settings/index', icon: 'settings' as IconName },
  ]

  const handleLogout = () => {
    logout()
    openPage('/pages/splash/index', { reset: true })
  }

  return (
    <View className='app-screen'>
      <AppBar
        title='我的'
        right={<IconButton icon='shield' tone='yellow' onClick={() => openPage('/pages/safety-center/index')} />}
      />

      <View className='app-content' style='padding:0;'>
        <View className='profile-header'>
          <View className='profile-avatar'><AppIcon name='dog' /></View>
          <Text style='font-size:28px;font-weight:900;'>{pet?.name ?? '添加宠物'}</Text>
          <View className='row' style='justify-content:center;gap:8px;margin-top:12px;'>
            {pet?.personality.map((tag, index) => (
              <Text className={index === 0 ? 'tag tag-yellow' : 'tag tag-blue'} key={tag}>{tag}</Text>
            ))}
          </View>
          <View className='row' style='justify-content:center;gap:16px;margin-top:20px;'>
            <View style='text-align:center;'>
              <Text style='display:block;font-weight:900;font-size:18px;'>{pet?.boneCount ?? 0}</Text>
              <Text className='text-xs text-muted'>获赠骨头</Text>
            </View>
            <View style='text-align:center;'>
              <Text style='display:block;font-weight:900;font-size:18px;'>{user?.boneBalance ?? 0}</Text>
              <Text className='text-xs text-muted'>钱包余额</Text>
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
          <Button className='secondary-button' onClick={handleLogout}>
            退出登录
          </Button>
        </View>
      </View>

      <MainNav active='profile' />
    </View>
  )
}
