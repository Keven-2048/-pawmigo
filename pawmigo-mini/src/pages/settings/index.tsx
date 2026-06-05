import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AppIcon } from '../../components/icons'
import { AppBar, IconButton, MainNav } from '../../components/ui'
import { backOrHome, openPage } from '../../utils/navigation'

const items = [
  ['账号与资料', '已绑定手机号', 'user'],
  ['隐私与安全', '位置脱敏已开启', 'shield'],
  ['通知设置', '偶遇和队伍提醒', 'bell'],
  ['关于 Pawmigo', '版本 0.1.0', 'info'],
] as const

export default function SettingsPage() {
  return (
    <View className='app-screen'>
      <AppBar title='设置' left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/profile/index')} />} />
      <View className='app-content' style='padding:20px;'>
        <View className='card' style='padding:0;overflow:hidden;margin:0;'>
          {items.map(([title, meta, icon]) => (
            <View
              className='safety-item'
              key={title}
              onClick={() => {
                if (title === '账号与资料') openPage('/pages/profile/pet-form')
                else if (title === '隐私与安全') openPage('/pages/safety-privacy/index')
                else if (title === '通知设置') openPage('/pages/notification-settings/index')
                else Taro.showToast({ title: '已是最新版本', icon: 'none' })
              }}
            >
              <View className='row' style='gap:12px;'>
                <AppIcon name={icon} />
                <View className='stack' style='gap:4px;'>
                  <Text style='font-size:17px;font-weight:900;'>{title}</Text>
                  <Text className='text-xs text-muted'>{meta}</Text>
                </View>
              </View>
              <AppIcon name='chevron-right' />
            </View>
          ))}
        </View>
      </View>
      <MainNav active='profile' />
    </View>
  )
}
