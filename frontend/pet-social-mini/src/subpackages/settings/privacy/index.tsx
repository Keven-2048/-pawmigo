import { useEffect, useState } from 'react'
import { navigateBack, navigateTo } from '@tarojs/taro'
import { Text, View } from '@tarojs/components'
import { Button } from '@/components/NutUI'
import { EmptyState } from '@/components/EmptyState'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { useUserStore } from '@/store/userStore'
import type { PrivacySettings } from '@/types/domain'
import { showToast } from '@/utils/navigation'
import './index.scss'

const groups: Array<{
  title: string
  rows: Array<{ key: keyof PrivacySettings; icon: string; title: string; desc: string }>
}> = [
  {
    title: '社交隐私',
    rows: [
      { key: 'allowNearbyVisible', icon: 'near-me', title: '在“附近”可见', desc: '允许其他宠物主在地图上发现你' },
      { key: 'allowStrangerInvite', icon: 'person-add', title: '允许陌生人邀请', desc: '非好友可向您发起遛狗邀约' },
      { key: 'allowComment', icon: 'comment', title: '允许陌生人评论', desc: '控制动态评论互动' },
      { key: 'showOwnerName', icon: 'badge', title: '显示主人昵称', desc: '在宠友圈显示您的个性昵称' }
    ]
  },
  {
    title: '系统设置',
    rows: [
      { key: 'showCity', icon: 'map', title: '个人主页显示城市', desc: '弱化对外城市信息展示' },
      { key: 'notificationEnabled', icon: 'bell', title: '接收通知', desc: '控制互动和邀请提醒' }
    ]
  }
]

export default function PrivacyPage() {
  const ready = useAuthGuard()
  const user = useUserStore((state) => state.user)
  const hydrate = useUserStore((state) => state.hydrate)
  const updatePrivacy = useUserStore((state) => state.updatePrivacy)
  const [settings, setSettings] = useState<PrivacySettings | undefined>(user?.privacy)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (ready) {
      hydrate().catch((error) => {
        showToast(error instanceof Error ? error.message : '隐私设置加载失败')
      })
    }
  }, [ready])

  useEffect(() => {
    if (user?.privacy) setSettings(user.privacy)
  }, [user])

  const save = async () => {
    if (!settings) return
    if (saving) return
    setSaving(true)
    try {
      await updatePrivacy(settings)
      showToast('隐私设置已保存', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (!ready || !settings) {
    return (
      <View className="page privacy-page">
        <EmptyState title="正在进入隐私设置" />
      </View>
    )
  }

  return (
    <View className="page privacy-page">
      <View className="privacy-page__topbar">
        <View className="privacy-page__back ui-icon ui-icon--back" onClick={() => navigateBack()} />
        <Text className="privacy-page__title">隐私设置</Text>
        <Text className="privacy-page__spacer" />
      </View>

      <View className="privacy-safety-card card">
        <View className="privacy-safety-card__icon ui-icon ui-icon--shield" />
        <View className="privacy-safety-card__copy">
          <Text className="privacy-safety-card__title">位置隐私保护</Text>
          <Text className="privacy-safety-card__desc">为了保护您的个人隐私，我们在“附近”功能中仅显示模糊位置。除非您主动接受邀请，否则其他用户无法看到您的精确坐标。</Text>
        </View>
      </View>

      {groups.map((group) => (
        <View className="privacy-group" key={group.title}>
          <Text className="privacy-group__title">{group.title}</Text>
          <View className="privacy-group__card card">
            {group.rows.map((row) => (
              <View className="privacy-entry" key={row.key}>
                <View className={`privacy-entry__icon ui-icon ui-icon--${row.icon}`} />
                <View className="privacy-entry__copy">
                  <Text className="privacy-entry__title">{row.title}</Text>
                  <Text className="privacy-entry__desc">{row.desc}</Text>
                </View>
                <View
                  className={`privacy-entry__switch settings-switch ${settings[row.key] ? 'settings-switch--active' : ''}`}
                  onClick={() => setSettings({ ...settings, [row.key]: !settings[row.key] })}
                >
                  <Text className="settings-switch__dot" />
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}

      <View className="privacy-group">
        <Text className="privacy-group__title">账户安全</Text>
        <View className="privacy-group__card card">
          <View className="privacy-entry privacy-entry--link" onClick={() => navigateTo({ url: '/subpackages/settings/block/index' })}>
            <View className="privacy-entry__icon ui-icon ui-icon--block" />
            <View className="privacy-entry__copy">
              <Text className="privacy-entry__title">黑名单管理</Text>
              <Text className="privacy-entry__desc">查看被你屏蔽的用户</Text>
            </View>
            <View className="privacy-entry__arrow ui-icon ui-icon--chevron" />
          </View>
          <View className="privacy-entry privacy-entry--danger">
            <View className="privacy-entry__icon privacy-entry__icon--danger ui-icon ui-icon--info" />
            <View className="privacy-entry__copy">
              <Text className="privacy-entry__title">注销账号</Text>
              <Text className="privacy-entry__desc">提交申请后将进入人工安全校验流程</Text>
            </View>
            <View className="privacy-entry__arrow ui-icon ui-icon--chevron" />
          </View>
        </View>
      </View>

      <View className="privacy-shield">
        <View className="privacy-shield__mark ui-icon ui-icon--shield" />
        <Text className="privacy-shield__copy">宠友圈竭力保障您的个人信息安全</Text>
        <Text className="privacy-shield__version">Version 2.4.0 (Build 82)</Text>
      </View>

      <Button className="privacy-save" loading={saving} disabled={saving} onClick={save}>保存设置</Button>
    </View>
  )
}
