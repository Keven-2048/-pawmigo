import { useEffect, useState } from 'react'
import { navigateTo, switchTab } from '@tarojs/taro'
import { Image, Input, ScrollView, Text, View } from '@tarojs/components'
import { Popup } from '@/components/NutUI'
import { MOCK_IMAGES } from '@/constants/assets'
import { DEFAULT_FILTER, GENDER_LABEL, INTEREST_TAGS, PERSONALITY_TAGS, PET_TYPE_LABEL } from '@/constants/options'
import { EmptyState } from '@/components/EmptyState'
import { PetCard } from '@/components/PetCard'
import { TopBar } from '@/components/TopBar'
import { nearbyService } from '@/services'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { useLocationStore } from '@/store/locationStore'
import { usePetStore } from '@/store/petStore'
import type { NearbyFilter, NearbyPet, PetType } from '@/types/domain'
import { showToast, toCreatePet, toPetDetail } from '@/utils/navigation'
import './index.scss'

const petTypes: Array<'all' | PetType> = ['all', 'dog', 'cat', 'other']
const distances: NearbyFilter['distance'][] = [1000, 3000, 5000, 10000]

export default function NearbyPage() {
  const ready = useAuthGuard({ requirePet: false })
  const [pets, setPets] = useState<NearbyPet[]>([])
  const [filter, setFilter] = useState<NearbyFilter>({ ...DEFAULT_FILTER })
  const [keyword, setKeyword] = useState('')
  const [filterVisible, setFilterVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const authorized = useLocationStore((state) => state.authorized)
  const city = useLocationStore((state) => state.city)
  const authorizeMock = useLocationStore((state) => state.authorizeMock)
  const decline = useLocationStore((state) => state.decline)
  const loadPets = usePetStore((state) => state.loadPets)
  const myPets = usePetStore((state) => state.pets)

  const loadNearby = async (nextFilter = filter) => {
    setLoading(true)
    try {
      const result = await nearbyService.pets(nextFilter, 1, 20)
      setPets(result.list)
    } catch (error) {
      showToast(error instanceof Error ? error.message : '附近列表加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (ready) {
      loadPets().catch((error) => {
        showToast(error instanceof Error ? error.message : '宠物档案加载失败')
      })
    }
  }, [ready])

  useEffect(() => {
    if (ready && authorized) loadNearby()
  }, [authorized, ready])

  const handleAuthorize = async () => {
    await authorizeMock()
    showToast('已开启模糊位置', 'success')
    await loadNearby()
  }

  const setTag = (field: 'personalityTags' | 'interestTags', tag: string) => {
    const current = filter[field]
    setFilter({
      ...filter,
      [field]: current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]
    })
  }

  const applyFilter = async () => {
    setFilterVisible(false)
    await loadNearby(filter)
  }

  const resetFilter = () => {
    setFilter({ ...DEFAULT_FILTER })
  }

  const applyQuickFilter = async (nextFilter: NearbyFilter) => {
    setFilter(nextFilter)
    await loadNearby(nextFilter)
  }

  const displayedPets = pets.filter((pet) => {
    const searchText = `${pet.name} ${pet.breed} ${PET_TYPE_LABEL[pet.type]}`
    return searchText.includes(keyword.trim())
  })

  const renderNearbyEmpty = () => (
      <View className="nearby-empty">
        <View className="nearby-empty__illustration">
        <Image className="nearby-empty__pet" src={MOCK_IMAGES.hero} mode="aspectFill" />
        <Text className="nearby-empty__glow" />
      </View>
      <Text className="nearby-empty__title">{keyword ? '没有匹配的宠友' : '附近还没有宠友'}</Text>
      <Text className="nearby-empty__desc">去社交圈看看更多毛孩子的日常，也许会遇到合拍的新朋友。</Text>
      <View className="nearby-empty__primary ui-button ui-button--primary" onClick={() => switchTab({ url: '/pages/feed/index' })}>
        去社交圈看看
      </View>
      <View className="nearby-empty__secondary ui-button ui-button--secondary" onClick={() => loadNearby()}>
        重新定位
      </View>
    </View>
  )

  if (!ready) {
    return (
      <View className="page page--tab nearby-page">
        <EmptyState title="正在进入宠友圈" />
      </View>
    )
  }

  if (!myPets.length) {
    return (
      <View className="page page--tab nearby-page">
        <TopBar title="附近宠友" subtitle="先创建一只宠物，再认识附近的新朋友" />
        <EmptyState title="还没有宠物档案" description="宠友圈会以宠物为主角展示资料。" actionText="创建宠物" onAction={toCreatePet} />
      </View>
    )
  }

  return (
    <View className="page page--tab nearby-page">
      <View className="nearby-page__location-bar">
        <View className="nearby-page__location-copy">
          <View className="nearby-page__pin ui-icon ui-icon--pin" />
          <Text className="nearby-page__location">{authorized ? `${city || '上海市'} 静安公园` : '附近宠友'}</Text>
          <View className="nearby-page__refresh ui-icon ui-icon--refresh" onClick={() => authorized ? loadNearby() : undefined} />
        </View>
        <View className="nearby-page__filter-button" onClick={() => setFilterVisible(true)}>筛选</View>
      </View>

      <View className="nearby-search">
        <View className="nearby-search__icon ui-icon ui-icon--search" />
        <Input className="nearby-search__input" value={keyword} placeholder="搜索宠物名字或品种..." onInput={(event) => setKeyword(event.detail.value)} />
      </View>

      <ScrollView scrollX className="nearby-quick-filters">
        <View className="nearby-quick-filters__inner">
          {[
            { label: '全部', value: { ...filter, type: 'all' as const, distance: 3000 as const, canInviteOnly: false } },
            { label: '狗狗', value: { ...filter, type: 'dog' as const } },
            { label: '猫咪', value: { ...filter, type: 'cat' as const } },
            { label: '1km内', value: { ...filter, distance: 1000 as const } },
            { label: '可接受邀请', value: { ...filter, canInviteOnly: true } }
          ].map((item) => (
            <View
              className={`nearby-quick-filter ${(
                (item.label === '全部' && filter.type === 'all' && filter.distance === 3000 && !filter.canInviteOnly) ||
                (item.label === '狗狗' && filter.type === 'dog') ||
                (item.label === '猫咪' && filter.type === 'cat') ||
                (item.label === '1km内' && filter.distance === 1000) ||
                (item.label === '可接受邀请' && filter.canInviteOnly)
              ) ? 'nearby-quick-filter--active' : ''}`}
              key={item.label}
              onClick={() => applyQuickFilter(item.value)}
            >
              {item.label}
            </View>
          ))}
        </View>
      </ScrollView>

      {!authorized ? (
        <View className="nearby-permission card">
          <Text className="nearby-permission__title">用模糊距离找到合适玩伴</Text>
          <Text className="nearby-permission__desc">不会展示其他用户真实经纬度、小区、楼栋或门牌号。</Text>
          <View className="nearby-permission__actions">
            <View className="nearby-permission__ghost ui-button ui-button--secondary" onClick={decline}>稍后</View>
            <View className="nearby-permission__primary ui-button ui-button--primary" onClick={handleAuthorize}>开启位置</View>
          </View>
        </View>
      ) : displayedPets.length ? (
        <ScrollView scrollY className="nearby-list" refresherEnabled refresherTriggered={loading} onRefresherRefresh={() => loadNearby()}>
          {displayedPets.map((pet) => (
            <PetCard
              key={pet.id}
              pet={pet}
              onOpen={() => toPetDetail(pet.id)}
              onInvite={() => navigateTo({ url: `/subpackages/invite/create/index?toPetId=${pet.id}` })}
            />
          ))}
        </ScrollView>
      ) : (
        renderNearbyEmpty()
      )}

      <Popup visible={filterVisible} position="bottom" round onClose={() => setFilterVisible(false)}>
        <View className="filter-sheet">
          <View className="filter-sheet__handle" />
          <View className="filter-sheet__header">
            <Text className="filter-sheet__title">筛选附近宠友</Text>
            <View className="filter-sheet__close ui-icon ui-icon--close" onClick={() => setFilterVisible(false)} />
          </View>

          <View className="filter-section">
            <Text className="filter-label">宠物种类</Text>
            <View className="filter-row">
              {petTypes.map((item) => (
                <View className={`filter-chip ${filter.type === item ? 'filter-chip--active' : ''}`} key={item} onClick={() => setFilter({ ...filter, type: item })}>
                  {item === 'all' ? '全部' : PET_TYPE_LABEL[item]}
                </View>
              ))}
            </View>
          </View>

          <View className="filter-section">
            <Text className="filter-label">距离范围</Text>
            <View className="filter-row">
              {distances.map((item) => (
                <View className={`filter-chip ${filter.distance === item ? 'filter-chip--active' : ''}`} key={item} onClick={() => setFilter({ ...filter, distance: item })}>
                  {item === 10000 ? '5km+' : `${item / 1000}km内`}
                </View>
              ))}
            </View>
          </View>

          <View className="filter-section">
            <Text className="filter-label">宠物性别</Text>
            <View className="filter-row">
              {(['male', 'female', 'all'] as const).map((item) => (
                <View className={`filter-chip ${filter.gender === item ? 'filter-chip--active' : ''}`} key={item} onClick={() => setFilter({ ...filter, gender: item })}>
                  {item === 'all' ? '不限' : item === 'male' ? `♂ ${GENDER_LABEL[item]}` : `♀ ${GENDER_LABEL[item]}`}
                </View>
              ))}
            </View>
          </View>

          <View className="filter-section">
            <Text className="filter-label">性格特点</Text>
            <View className="filter-row filter-row--wrap">
              {PERSONALITY_TAGS.slice(0, 6).map((tag) => (
                <View className={`filter-chip ${filter.personalityTags.includes(tag) ? 'filter-chip--active' : ''}`} key={tag} onClick={() => setTag('personalityTags', tag)}>
                  {tag}
                </View>
              ))}
            </View>
          </View>

          <View className="filter-section">
            <Text className="filter-label">兴趣偏好</Text>
            <View className="filter-row filter-row--wrap">
              {INTEREST_TAGS.slice(0, 6).map((tag) => (
                <View className={`filter-chip filter-chip--orange ${filter.interestTags.includes(tag) ? 'filter-chip--active' : ''}`} key={tag} onClick={() => setTag('interestTags', tag)}>
                  {tag}
                </View>
              ))}
            </View>
          </View>

          <View className="filter-switch-row" onClick={() => setFilter({ ...filter, canInviteOnly: !filter.canInviteOnly })}>
            <View className="filter-switch-row__copy">
              <Text className="filter-switch-row__title">仅看接受邀请的</Text>
              <Text className="filter-switch-row__desc">只显示当前接受线下聚会的宠物</Text>
            </View>
            <View className={`filter-switch ${filter.canInviteOnly ? 'filter-switch--active' : ''}`}>
              <Text className="filter-switch__dot" />
            </View>
          </View>

          <View className="filter-sheet__actions">
            <View className="filter-reset ui-button ui-button--secondary" onClick={resetFilter}>重置</View>
            <View className="filter-submit ui-button ui-button--primary" onClick={applyFilter}>显示结果 ({displayedPets.length || pets.length})</View>
          </View>
        </View>
      </Popup>
    </View>
  )
}
