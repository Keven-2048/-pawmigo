import { useState } from 'react'
import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AppBar, IconButton } from '../../components/ui'
import { api } from '../../services/api'
import { backOrHome } from '../../utils/navigation'

interface ToggleItem {
  title: string
  desc: string
  value: boolean
  toggle: () => void
}

export default function NotificationSettingsPage() {
  const [encounterNotify, setEncounterNotify] = useState(true)
  const [teamNotify, setTeamNotify] = useState(true)
  const [boneNotify, setBoneNotify] = useState(true)
  const [systemNotify, setSystemNotify] = useState(false)

  const items: ToggleItem[] = [
    { title: '偶遇邀约与回应', desc: '收到匹配邀请、对方接受等', value: encounterNotify, toggle: () => setEncounterNotify((v) => !v) },
    { title: '队伍活动', desc: '队伍新公告、活动提醒', value: teamNotify, toggle: () => setTeamNotify((v) => !v) },
    { title: '骨头相关', desc: '收到打赏、奖励到账', value: boneNotify, toggle: () => setBoneNotify((v) => !v) },
    { title: '系统更新', desc: '版本更新与功能公告', value: systemNotify, toggle: () => setSystemNotify((v) => !v) },
  ]

  const save = () => {
    api.updateSettings({ notifications: encounterNotify || teamNotify || boneNotify }).then(() => {
      Taro.showToast({ title: '设置已保存', icon: 'success' })
    })
  }

  return (
    <View className='app-screen page-with-action-bar'>
      <AppBar title='通知设置' left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/settings/index')} />} />

      <View className='app-content content-compact'>
        <View className='card settings-card'>
          {items.map((item) => (
            <View className='safety-item' key={item.title} onClick={item.toggle}>
              <View className='stack' style='gap:2px;flex:1;'>
                <Text style='font-size:16px;font-weight:900;'>{item.title}</Text>
                <Text className='text-xs text-muted'>{item.desc}</Text>
              </View>
              <Text className={item.value ? 'tag tag-green' : 'tag'}>
                {item.value ? '已开启' : '已关闭'}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View className='footer-actions'>
        <View className='primary-button' style='text-align:center;' onClick={save}>
          保存设置
        </View>
      </View>
    </View>
  )
}
