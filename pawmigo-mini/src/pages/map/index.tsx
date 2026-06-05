import { useEffect, useMemo, useState } from 'react'
import { CoverView, Map, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AppBar, IconButton, MainNav } from '../../components/ui'
import { useAppStore } from '../../store/appStore'
import { backOrHome, getRouterParam, openPage } from '../../utils/navigation'
import { useRequireAuth } from '../../utils/useRequireAuth'
import { api, DogSize, MapFilter, NearbyPet } from '../../services/api'

const MARKER_ICON_PATH = '/assets/map-marker.png'

const FALLBACK_CENTER = {
  latitude: 31.232,
  longitude: 121.478,
}

const markerTones = ['blue', 'yellow', 'rose']

// Place dog-friends as small offsets (~100-300m) around the user's real center,
// so they are always visible nearby regardless of the actual location.
const NEARBY_OFFSETS = [
  { dLat: 0.0016, dLng: 0.0012 },
  { dLat: -0.0014, dLng: 0.0018 },
  { dLat: 0.0009, dLng: -0.0017 },
  { dLat: -0.0019, dLng: -0.0008 },
]

export default function MapPage() {
  const { isAuthenticated } = useRequireAuth()
  const isWeb = Taro.getEnv() === Taro.ENV_TYPE.WEB
  const isWalking = useAppStore((state) => state.isWalking)
  const toggleWalkingRaw = useAppStore((state) => state.toggleWalking)
  const toggleWalking = () => {
    const newState = !isWalking
    toggleWalkingRaw()
    api.setWalkingStatus(newState).catch(() => {})
    Taro.showToast({
      title: newState ? '你已对附近宠友可见' : '已停止同步位置',
      icon: newState ? 'success' : 'none',
      duration: 1500,
    })
  }
  const [center, setCenter] = useState(FALLBACK_CENTER)
  const [locationLabel, setLocationLabel] = useState('滨江公园附近')
  const [nearbyPets, setNearbyPets] = useState<NearbyPet[]>([])
  const [loading, setLoading] = useState(true)
  const [walkMinutes, setWalkMinutes] = useState(30)

  // Countdown timer when walking
  useEffect(() => {
    if (!isWalking) {
      setWalkMinutes(30)
      return
    }
    const timer = setInterval(() => {
      setWalkMinutes((prev) => (prev > 0 ? prev - 1 : 0))
    }, 60000)
    return () => clearInterval(timer)
  }, [isWalking])

  useEffect(() => {
    Taro.getLocation({
      type: 'gcj02',
      success: (result) => {
        setCenter({
          latitude: result.latitude,
          longitude: result.longitude,
        })
        setLocationLabel('我的当前位置附近')
      },
      fail: () => {
        setCenter(FALLBACK_CENTER)
        setLocationLabel('滨江公园附近')
      },
    })

    // Read filter params passed from map-filter page.
    const sizeParam = getRouterParam('size') as DogSize | ''
    const personalityParam = getRouterParam('personality')
    const filter: MapFilter = {}
    if (sizeParam) filter.size = sizeParam
    if (personalityParam) filter.personality = personalityParam

    api.getNearbyWalkers(filter).then((pets) => {
      setNearbyPets(pets)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [])

  const markers = useMemo(() => (
    nearbyPets.map((pet, index) => {
      const offset = NEARBY_OFFSETS[index % NEARBY_OFFSETS.length]
      return ({
      id: pet.id,
      latitude: center.latitude + offset.dLat,
      longitude: center.longitude + offset.dLng,
      iconPath: MARKER_ICON_PATH,
      width: 42,
      height: 48,
      zIndex: 10,
      callout: {
        content: `${pet.name} · ${pet.distance}`,
        color: '#000000',
        fontSize: 13,
        anchorX: 0,
        anchorY: -6,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#000000',
        bgColor: '#facc15',
        padding: 8,
        display: 'ALWAYS' as const,
        textAlign: 'center' as const,
      },
      })
    })
  ), [nearbyPets, center])

  const openPetDetail = (event: { detail: { markerId: number | string } }) => {
    const markerId = Number(event.detail.markerId)
    const pet = nearbyPets.find((item) => item.id === markerId)

    if (pet) {
      openPage(`/pages/pet-detail/index?id=${pet.id}`)
    }
  }

  const handleMapError = () => {
    Taro.showToast({ title: '地图加载失败，请稍后重试', icon: 'none' })
  }

  return (
    <View className='app-screen map-page'>
      <AppBar
        title='发现附近'
        left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/splash/index')} />}
        right={<IconButton icon='menu' tone='yellow' onClick={() => openPage('/pages/map-filter/index')} />}
      />

      <View className='map-container'>
        {isWeb ? (
          <View className='native-map map-fallback'>
            <View className='map-fallback-grid' />
            <View className='active-walker' />
            {nearbyPets.slice(0, 3).map((pet, index) => (
              <View
                className={`marker map-fallback-marker map-fallback-marker-${index + 1}`}
                key={pet.id}
                onClick={() => openPage(`/pages/pet-detail/index?id=${pet.id}`)}
              >
                <View className='marker-label'>{pet.name} · {pet.distance}</View>
                <View className={`marker-avatar marker-avatar-${markerTones[index % markerTones.length]}`}>
                  {pet.name.slice(0, 1)}
                </View>
                <View className={`marker-status marker-status-${index === 0 ? 'cyan' : index === 1 ? 'purple' : 'muted'}`} />
              </View>
            ))}
          </View>
        ) : (
          <Map
            className='native-map'
            latitude={center.latitude}
            longitude={center.longitude}
            scale={16}
            minScale={13}
            maxScale={19}
            markers={markers}
            showLocation
            showCompass
            showScale
            enableZoom
            enableScroll
            onMarkerTap={openPetDetail}
            onError={handleMapError}
          />
        )}

        <CoverView className='map-overlay-top'>
          <CoverView className='location-card'>
            <CoverView className='location-pin'>⌖</CoverView>
            <CoverView className='map-location-copy'>
              <CoverView className='text-caption'>当前位置</CoverView>
              <CoverView className='map-location-title'>{locationLabel}</CoverView>
            </CoverView>
          </CoverView>

          <CoverView className='safety-toast'>
            <CoverView className='safety-toast-icon'>隐私</CoverView>
            <CoverView>位置已模糊处理 · 隐私受保护</CoverView>
          </CoverView>
        </CoverView>

        <CoverView className={`walking-status-panel${isWalking ? ' walking-panel-active' : ''}`}>
          <CoverView className='status-switch-container'>
            <CoverView className='walking-status-copy'>
              <CoverView className='walking-status-title-row'>
                <CoverView className='walking-status-icon'>{isWalking ? '🐕' : '💤'}</CoverView>
                <CoverView className='card-title'>我在遛</CoverView>
                <CoverView className={isWalking ? 'status-badge status-on' : 'status-badge status-off'}>
                  {isWalking ? '已开启' : '未开启'}
                </CoverView>
              </CoverView>
              <CoverView className='text-caption'>
                {isWalking ? (walkMinutes > 0 ? `超时倒计时 ${walkMinutes} 分钟` : '已超时，请重新开启') : '开启后对附近宠友可见'}
              </CoverView>
            </CoverView>
            <CoverView className={isWalking ? 'status-toggle status-toggle-on' : 'status-toggle'} onClick={toggleWalking}>
              <CoverView className='toggle-knob' />
            </CoverView>
          </CoverView>
        </CoverView>
      </View>

      <MainNav active='map' />
    </View>
  )
}
