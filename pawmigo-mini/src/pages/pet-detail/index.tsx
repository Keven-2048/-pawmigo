import { useEffect, useState } from 'react'
import { Button, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AppIcon } from '../../components/icons'
import { AppBar, IconButton } from '../../components/ui'
import { api, Pet } from '../../services/api'
import { useSessionStore } from '../../store/sessionStore'
import { backOrHome, getRouterParam, openPage } from '../../utils/navigation'

export default function PetDetailPage() {
  const id = Number(getRouterParam('id')) || 0
  const [pet, setPet] = useState<Pet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const user = useSessionStore((s) => s.user)
  const myPets = useSessionStore((s) => s.pets)

  const isOwnPet = pet ? (pet.ownerId === user?.id || myPets.some((p) => p.id === pet.id)) : false

  useEffect(() => {
    if (!id) {
      setLoading(false)
      setError(true)
      return
    }
    setLoading(true)
    setError(false)
    api.getPet(id).then((data) => {
      setPet(data)
      setLoading(false)
    }).catch(() => {
      setError(true)
      setLoading(false)
    })
  }, [id])

  const handleReport = () => {
    if (isOwnPet) {
      openPage(`/pages/profile/pet-form?id=${pet?.id}`)
      return
    }
    Taro.showActionSheet({
      itemList: ['拉黑该用户', '内容违规举报'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // Block: persist the id and drop the pet from nearby discovery.
          api.blockPet(pet!.id)
            .then(() => {
              Taro.showToast({ title: '已拉黑，不再推荐', icon: 'none' })
              backOrHome('/pages/map/index')
            })
            .catch(() => Taro.showToast({ title: '操作失败，请重试', icon: 'none' }))
        } else {
          api.reportPet(pet!.id)
            .then(() => Taro.showToast({ title: '举报已提交', icon: 'none' }))
            .catch(() => Taro.showToast({ title: '提交失败，请重试', icon: 'none' }))
        }
      },
    })
  }

  if (loading) {
    return (
      <View className='app-screen'>
        <AppBar title='宠物档案' left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/map/index')} />} />
        <View className='app-content text-center' style='padding:60px 20px;'>
          <Text className='text-muted'>加载中...</Text>
        </View>
      </View>
    )
  }

  if (error || !pet) {
    return (
      <View className='app-screen'>
        <AppBar title='宠物档案' left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/map/index')} />} />
        <View className='app-content text-center' style='padding:60px 20px;'>
          <Text className='text-muted' style='display:block;margin-bottom:16px;'>加载失败，请稍后重试</Text>
          <Text className='tag tag-yellow' onClick={() => {
            if (id) {
              setLoading(true)
              setError(false)
              api.getPet(id).then((data) => { setPet(data); setLoading(false) }).catch(() => { setError(true); setLoading(false) })
            }
          }}>点击重试</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='app-screen page-with-action-bar'>
      <AppBar
        title={isOwnPet ? '我的宠物' : '宠物档案'}
        left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/map/index')} />}
        right={isOwnPet
          ? <IconButton icon='edit' tone='yellow' onClick={() => openPage(`/pages/profile/pet-form?id=${pet.id}`)} />
          : <IconButton icon='shield' tone='yellow' onClick={handleReport} />
        }
      />

      <View className='app-content' style='padding:0;'>
        {/* Cyan hero with diagonal pattern */}
        <View className='pet-detail-hero'>
          <View className='pet-detail-name-card'>
            <Text className='pet-hero-name'>{pet.name}<Text className='pet-hero-breed'> · {pet.breed}</Text></Text>
            <View className='row' style='gap:8px;margin-top:8px;'>
              {isOwnPet ? (
                <>
                  <Text className='tag tag-green'>我的宝贝</Text>
                  <Text className='tag tag-yellow'>🦴 {pet.boneCount} 骨头</Text>
                </>
              ) : (
                <>
                  <Text className='tag tag-yellow'>约 300m</Text>
                  <Text className='tag tag-blue'>正在遛 (12min)</Text>
                </>
              )}
            </View>
          </View>
        </View>

        <View className='card' style='margin-top:-20px;position:relative;z-index:10;'>
          <View className='row' style='gap:8px;margin-bottom:16px;'>
            {isOwnPet ? (
              <View className='eyebrow eyebrow-green'>我的宠物</View>
            ) : (
              <>
                <View className='eyebrow eyebrow-green'>已实名认证</View>
                <View className='eyebrow eyebrow-blue'>接受偶遇</View>
              </>
            )}
          </View>
          <Text style='font-weight:600;line-height:1.6;'>
            {pet.name}{pet.personality.length > 0 ? `是个${pet.personality.join('、')}的${pet.breed}` : `是一只${pet.breed}`}。{pet.bio}
          </Text>
          <View className='tag-grid' style='margin-top:16px;'>
            {pet.personality.map((tag) => (
              <Text className='tag' key={tag}>{tag}</Text>
            ))}
          </View>
        </View>

        <View className='info-grid'>
          {[
            ['宠物性别', pet.gender === '男' ? '小男生' : '小女生'],
            ['宠物年龄', `${pet.age} 岁`],
            ['宠物体型', '中大型'],
            ['共同队伍', '滨江金毛团'],
          ].map(([label, value]) => (
            <View className='info-item' key={label}>
              <Text className='text-xs text-muted'>{label}</Text>
              <Text className='info-item-value'>{value}</Text>
            </View>
          ))}
        </View>

        {!isOwnPet && (
          <View className='card pet-safety-card'>
            <Text className='pet-safety-title'>安全提醒</Text>
            <View className='stack' style='gap:8px;'>
              <Text className='text-sm' style='font-weight:600;color:#4b5563;'>位置已进行 200m 级脱敏处理</Text>
              <Text className='text-sm' style='font-weight:600;color:#4b5563;'>建议选择公园等公共开放地点集合</Text>
              <Text className='text-sm' style='font-weight:600;color:#4b5563;'>若有异常，请使用右上方举报入口</Text>
            </View>
          </View>
        )}
      </View>

      <View className='action-bar-fixed'>
        {isOwnPet ? (
          <Button
            className='primary-button'
            type='primary'
            style='flex:1;'
            onClick={() => openPage(`/pages/profile/pet-form?id=${pet.id}`)}
          >
            编辑资料
          </Button>
        ) : (
          <>
            <Button className='secondary-button' style='flex:1;' onClick={() => openPage('/pages/profile/index')}>
              查看主页
            </Button>
            <Button
              className='primary-button'
              type='primary'
              style='flex:2;'
              onClick={() => openPage(`/pages/encounter-waiting/index?id=${pet.id}`)}
            >
              邀请一起遛
            </Button>
          </>
        )}
      </View>
    </View>
  )
}
