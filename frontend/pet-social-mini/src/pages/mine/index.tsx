import { useEffect } from 'react'
import { navigateTo, reLaunch, switchTab } from '@tarojs/taro'
import { Image, Text, View } from '@tarojs/components'
import { EmptyState } from '@/components/EmptyState'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { usePetStore } from '@/store/petStore'
import { useUserStore } from '@/store/userStore'
import { showToast } from '@/utils/navigation'
import './index.scss'

interface MineMenuItem {
  icon: string
  title: string
  desc: string
  url?: string
  tabUrl?: string
  dot?: boolean
  status?: string
}

const menuGroups: Array<{ title: string; items: MineMenuItem[] }> = [
  {
    title: '宠友账户',
    items: [
      {
        icon: 'pets',
        title: '我的爱宠清单',
        desc: '档案、主宠与附近可见状态',
        url: '/subpackages/pet/manage/index'
      },
      {
        icon: 'sparkle',
        title: '宠圈精彩动态',
        desc: '查看毛孩子的生活记录',
        tabUrl: '/pages/feed/index'
      },
      {
        icon: 'group',
        title: '特别关注列表',
        desc: '整理最常互动的宠友',
        status: '即将开放'
      },
      {
        icon: 'bell',
        title: '消息与通知中心',
        desc: '邀请与互动提醒',
        dot: true,
        status: '即将开放'
      },
      {
        icon: 'lock',
        title: '个人隐私安全',
        desc: '附近可见、陌生邀请、评论权限',
        url: '/subpackages/settings/privacy/index'
      },
      {
        icon: 'info',
        title: '关于宠友圈',
        desc: '版本与服务说明',
        status: '即将开放'
      }
    ]
  }
]

export default function MinePage() {
  const ready = useAuthGuard()
  const user = useUserStore((state) => state.user)
  const hydrate = useUserStore((state) => state.hydrate)
  const logout = useUserStore((state) => state.logout)
  const pets = usePetStore((state) => state.pets)
  const loadPets = usePetStore((state) => state.loadPets)

  useEffect(() => {
    if (ready) {
      hydrate().catch((error) => {
        showToast(error instanceof Error ? error.message : '用户信息加载失败')
      })
      loadPets().catch((error) => {
        showToast(error instanceof Error ? error.message : '宠物档案加载失败')
      })
    }
  }, [ready])

  if (!ready) {
    return (
      <View className="page page--tab mine-page">
        <EmptyState title="正在进入我的" />
      </View>
    )
  }

  return (
    <View className="page page--tab mine-page">
      <View className="mine-page__appbar capsule-safe-appbar">
        <Text className="mine-page__brand">ChongYouQuan</Text>
        <View className="mine-page__search capsule-safe-appbar__action ui-icon ui-icon--search" />
      </View>

      <View className="mine-profile">
        <View className="mine-profile__avatar-wrap">
          <Image className="mine-profile__avatar" src={user?.avatarUrl || ''} mode="aspectFill" />
          <View className="mine-profile__badge">
            <View className="mine-profile__badge-icon ui-icon ui-icon--check" />
          </View>
        </View>
        <Text className="mine-profile__name">{user?.nickname || '宠友'}</Text>
        <View className="mine-profile__location">
          <View className="mine-profile__location-icon ui-icon ui-icon--near-me" />
          <Text className="mine-profile__meta">{user?.city ? `${user.city} · 徐汇区` : '未设置城市 · 宠物是主页角'}</Text>
        </View>
      </View>

      <View className="mine-stats card">
        <View className="mine-stats__item">
          <Text className="mine-stats__value">128</Text>
          <Text className="mine-stats__label">关注</Text>
        </View>
        <View className="mine-stats__item">
          <Text className="mine-stats__value">3.2k</Text>
          <Text className="mine-stats__label">粉丝</Text>
        </View>
        <View className="mine-stats__item">
          <Text className="mine-stats__value">56</Text>
          <Text className="mine-stats__label">动态</Text>
        </View>
        <View className="mine-stats__item">
          <Text className="mine-stats__value">12</Text>
          <Text className="mine-stats__label">邀请</Text>
        </View>
      </View>

      <View className="mine-pets card">
        <View className="mine-section-head">
          <Text className="mine-section-head__title">我的萌宠</Text>
          <Text className="mine-section-head__extra">{pets.length} 只萌宠</Text>
        </View>
        <View className="mine-pet-strip">
          {pets.slice(0, 3).map((pet) => (
            <View className="mine-pet-strip__item" key={pet.id} onClick={() => navigateTo({ url: `/subpackages/pet/detail/index?id=${pet.id}` })}>
              <View className={`mine-pet-strip__avatar-wrap ${pet.isDefault ? 'mine-pet-strip__avatar-wrap--active' : ''}`}>
                <Image className="mine-pet-strip__avatar" src={pet.avatarUrl} mode="aspectFill" />
                {pet.isDefault ? <Text className="mine-pet-strip__active-badge">ACTIVE</Text> : null}
              </View>
              <Text className="mine-pet-strip__name">{pet.name}</Text>
              <Text className="mine-pet-strip__meta">{pet.isDefault ? '主宠' : pet.visible ? '附近可见' : '附近隐藏'}</Text>
            </View>
          ))}
          <View className="mine-pet-strip__item mine-pet-strip__item--add" onClick={() => navigateTo({ url: '/subpackages/pet/create/index' })}>
            <View className="mine-pet-strip__add">
              <View className="mine-pet-strip__add-icon ui-icon ui-icon--add" />
            </View>
            <Text className="mine-pet-strip__name">添加</Text>
            <Text className="mine-pet-strip__meta">新伙伴</Text>
          </View>
        </View>
        <View className="mine-quick-actions">
          <View className="mine-quick-actions__button ui-button ui-button--warm" onClick={() => navigateTo({ url: '/subpackages/pet/manage/index' })}>
            <View className="mine-quick-actions__icon ui-icon ui-icon--swap" />
            <Text>切换主宠</Text>
          </View>
          <View className="mine-quick-actions__button ui-button ui-button--primary" onClick={() => navigateTo({ url: '/subpackages/pet/manage/index' })}>
            <View className="mine-quick-actions__icon ui-icon ui-icon--pets" />
            <Text>宠书管理</Text>
          </View>
        </View>
      </View>

      {menuGroups.map((group) => (
        <View className="mine-menu card" key={group.title}>
          {group.items.map((item) => (
            <View
              className={`mine-menu__item ${item.url || item.tabUrl ? '' : 'mine-menu__item--static'}`}
              key={item.title}
              onClick={item.url || item.tabUrl ? () => {
                if (item.tabUrl) switchTab({ url: item.tabUrl })
                if (item.url) navigateTo({ url: item.url })
              } : undefined}
            >
              <View className={`mine-menu__icon ui-icon ui-icon--${item.icon}`} />
              <View className="mine-menu__copy">
                <Text className="mine-menu__title">{item.title}</Text>
                <Text className="mine-menu__desc">{item.desc}</Text>
              </View>
              {item.dot ? <Text className="mine-menu__dot" /> : null}
              {item.status ? <Text className="mine-menu__status">{item.status}</Text> : null}
              {item.url || item.tabUrl ? <View className="mine-menu__arrow ui-icon ui-icon--chevron" /> : null}
            </View>
          ))}
        </View>
      ))}

      <View className="mine-logout" onClick={() => {
        logout()
        reLaunch({ url: '/pages/login/index' })
      }}>退出当前账号</View>
    </View>
  )
}
