import { useState } from 'react'
import { Button, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AppIcon } from '../../components/icons'
import { AppBar, IconButton } from '../../components/ui'
import { api } from '../../services/api'
import { backOrHome, openPage } from '../../utils/navigation'

interface SafetyRow {
  title: string
  meta: string
  metaOk?: boolean
  hasToggle?: boolean
  hasChevron?: boolean
  onClick?: () => void
}

export default function SafetyCenterPage() {
  const [preciseLocation, setPreciseLocation] = useState(true)

  const toggleLocation = () => {
    const next = !preciseLocation
    setPreciseLocation(next)
    api.updateSettings({ preciseLocation: next })
      .then(() => Taro.showToast({ title: next ? '已开启脱敏定位' : '已隐藏定位', icon: 'none' }))
      .catch(() => {
        setPreciseLocation(!next) // roll back on failure
        Taro.showToast({ title: '设置失败，请重试', icon: 'none' })
      })
  }

  const items: SafetyRow[] = [
    {
      title: '定位可见性',
      meta: preciseLocation ? '当前：仅遛狗时可见 (模糊位置)' : '当前：对所有人隐藏',
      hasToggle: true,
      onClick: toggleLocation,
    },
    { title: '黑名单', meta: '已拦截 0 名不友好用户', hasChevron: true, onClick: () => Taro.showToast({ title: '黑名单为空', icon: 'none' }) },
    { title: '行程分享设置', meta: '默认分享给 1 名紧急联系人', hasChevron: true, onClick: () => Taro.showToast({ title: '紧急联系人设置', icon: 'none' }) },
    { title: '实名认证状态', meta: '已认证 · 信用良好', metaOk: true, onClick: () => Taro.showToast({ title: '已实名认证', icon: 'success' }) },
    { title: '举报记录', meta: '查看处理中的反馈', hasChevron: true, onClick: () => Taro.showToast({ title: '暂无举报记录', icon: 'none' }) },
  ]

  return (
    <View className='app-screen'>
      <AppBar
        title='隐私与安全中心'
        left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/profile/index')} />}
      />

      <View className='app-content' style='padding:0;'>
        {/* Safety score card */}
        <View className='safety-status-card'>
          <Text style='font-size:20px;font-weight:900;margin-bottom:8px;display:block;'>您的安全等级：极高</Text>
          <Text style='font-size:12px;font-weight:900;'>位置脱敏与双向授权已开启</Text>
        </View>

        {/* Safety items */}
        {items.map((item) => (
          <View className='safety-row' key={item.title} onClick={item.onClick}>
            <View className='stack' style='gap:4px;flex:1;'>
              <Text style='font-size:16px;font-weight:900;'>{item.title}</Text>
              <Text className='text-xs' style={item.metaOk ? 'color:#4ade80;' : 'color:#6b7280;'}>
                {item.meta}
              </Text>
            </View>
            {item.hasToggle && (
              <View className={preciseLocation ? 'toggle-switch toggle-switch-on' : 'toggle-switch'}>
                <View className={preciseLocation ? 'toggle-knob toggle-knob-right' : 'toggle-knob'} />
              </View>
            )}
            {item.hasChevron && (
              <AppIcon name='chevron-right' />
            )}
            {item.metaOk && (
              <AppIcon name='check' />
            )}
          </View>
        ))}

        {/* Emergency section */}
        <View style='padding:24px;margin-top:40px;'>
          <View
            className='card safety-rules-card'
            onClick={() => openPage('/pages/safety-privacy/index')}
          >
            <Text style='display:block;font-size:14px;font-weight:900;margin-bottom:6px;'>隐私政策与安全守则</Text>
            <Text className='text-xs text-muted'>了解更多关于位置保护和社区安全的信息</Text>
          </View>
          <Button
            className='safety-emergency-btn'
            style='margin-top:20px;'
            onClick={() => openPage('/pages/emergency/index')}
          >
            紧急报警入口
          </Button>
          <Text className='text-xs text-muted' style='display:block;text-align:center;margin-top:16px;'>
            遇到紧急情况请立即点击上方按钮或拨打110
          </Text>
        </View>
      </View>
    </View>
  )
}
