import { useState } from 'react'
import { Button, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AppBar, IconButton } from '../../components/ui'
import { api } from '../../services/api'
import { backOrHome, openPage } from '../../utils/navigation'

export default function EncounterSettingsPage() {
  const [safeOnly, setSafeOnly] = useState(true)
  const [nightReminder, setNightReminder] = useState(true)

  const save = () => {
    api.updateSettings({ notifications: nightReminder, preciseLocation: !safeOnly }).then(() => {
      Taro.showToast({ title: '设置已保存', icon: 'success' })
      openPage('/pages/encounter/index', { replace: true })
    })
  }

  return (
    <View className='app-screen page-with-action-bar'>
      <AppBar title='偶遇设置' left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/encounter/index')} />} />
      <View className='app-content content-compact'>
        <View className='card settings-card'>
          <View className='safety-item'>
            <Text className='text-label'>匹配范围</Text>
            <Text className='tag tag-yellow'>800m 内</Text>
          </View>
          <View className='safety-item'>
            <Text className='text-label'>宠物体型</Text>
            <Text className='tag tag-yellow'>不限</Text>
          </View>
          <View className='safety-item' onClick={() => setSafeOnly((current) => !current)}>
            <Text className='text-label'>安全模式</Text>
            <Text className={safeOnly ? 'tag tag-green' : 'tag'}>{safeOnly ? '已开启' : '未开启'}</Text>
          </View>
          <View className='safety-item' onClick={() => setNightReminder((current) => !current)}>
            <Text className='text-label'>夜间提醒</Text>
            <Text className={nightReminder ? 'tag tag-green' : 'tag'}>{nightReminder ? '已开启' : '未开启'}</Text>
          </View>
        </View>
      </View>
      <View className='footer-actions'>
        <Button className='primary-button' type='primary' onClick={save}>
          保存设置
        </Button>
      </View>
    </View>
  )
}
