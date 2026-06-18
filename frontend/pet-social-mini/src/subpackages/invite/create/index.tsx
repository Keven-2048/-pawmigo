import { useEffect, useMemo, useState } from 'react'
import { navigateBack, navigateTo, switchTab, useRouter } from '@tarojs/taro'
import { Image, Input, Picker, Text, Textarea, View } from '@tarojs/components'
import { Button } from '@/components/NutUI'
import { INVITE_TYPE_LABEL, PET_TYPE_LABEL } from '@/constants/options'
import { EmptyState } from '@/components/EmptyState'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { inviteService, petService } from '@/services'
import { usePetStore } from '@/store/petStore'
import type { InviteType, Pet } from '@/types/domain'
import { normalizeDateTimeInput } from '@/utils/format'
import { showToast } from '@/utils/navigation'
import { parseRouteId } from '@/utils/route'
import './index.scss'

const inviteTypes: InviteType[] = ['walk', 'play', 'park', 'coffee', 'custom']
const inviteTypeDisplay: Record<InviteType, string> = {
  walk: '遛弯儿',
  play: '玩耍',
  park: '公园见',
  coffee: '宠物店',
  custom: '自定义',
  photo: INVITE_TYPE_LABEL.photo,
  event: INVITE_TYPE_LABEL.event
}

function nextDate() {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export default function CreateInvitePage() {
  const ready = useAuthGuard({ requirePet: true })
  const router = useRouter()
  const toPetId = parseRouteId(router.params.toPetId)
  const myPets = usePetStore((state) => state.pets)
  const currentPet = usePetStore((state) => state.currentPet)
  const loadPets = usePetStore((state) => state.loadPets)
  const pickCurrentPet = usePetStore((state) => state.pickCurrentPet)

  const [toPet, setToPet] = useState<Pet>()
  const [fromPetId, setFromPetId] = useState<number>()
  const [inviteType, setInviteType] = useState<InviteType>('walk')
  const [title, setTitle] = useState('一起遛弯吗？')
  const [description, setDescription] = useState('想约一个轻松、安全、宠物优先的见面时间。')
  const [locationName, setLocationName] = useState('附近公园入口')
  const [meetDate, setMeetDate] = useState(nextDate())
  const [meetTime, setMeetTime] = useState('19:00')
  const [submitting, setSubmitting] = useState(false)

  const selectedPet = useMemo(
    () => myPets.find((pet) => pet.id === fromPetId) ?? currentPet,
    [myPets, fromPetId, currentPet]
  )

  useEffect(() => {
    if (!ready) return
    loadPets().then((pets) => {
      const defaultPet = pets.find((pet) => pet.isDefault) ?? pets[0]
      setFromPetId(defaultPet?.id)
    }).catch((error) => {
      showToast(error instanceof Error ? error.message : '宠物档案加载失败')
    })
    if (!toPetId) return
    petService.detail(toPetId).then(setToPet).catch((error) => {
      showToast(error instanceof Error ? error.message : '接收宠物加载失败')
    })
  }, [toPetId, ready])

  useEffect(() => {
    setTitle(INVITE_TYPE_LABEL[inviteType])
  }, [inviteType])

  const submit = async () => {
    if (submitting) return
    if (!selectedPet) {
      showToast('请先选择自己的宠物')
      return
    }
    if (!toPetId) {
      showToast('接收宠物参数无效')
      return
    }
    setSubmitting(true)
    try {
      await inviteService.create({
        fromPetId: selectedPet.id,
        toPetId,
        type: inviteType,
        title,
        description,
        locationName,
        meetTime: normalizeDateTimeInput(`${meetDate} ${meetTime}:00`)
      })
      pickCurrentPet(selectedPet.id)
      showToast('邀请已发送', 'success')
      switchTab({ url: '/pages/invite/index' })
    } catch (error) {
      showToast(error instanceof Error ? error.message : '发送失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (!ready) {
    return (
      <View className="page create-invite">
        <EmptyState title="正在准备邀请" />
      </View>
    )
  }

  return (
    <View className="create-invite">
      <View className="create-invite__topbar">
        <View className="create-invite__back ui-icon ui-icon--back" onClick={() => navigateBack()} />
        <Text className="create-invite__title">发起邀请</Text>
        <View
          className="create-invite__more ui-icon ui-icon--more"
          onClick={() => toPetId
            ? navigateTo({ url: `/subpackages/settings/report/index?targetType=pet&targetId=${toPetId}` })
            : showToast('接收宠物参数无效')}
        />
      </View>

      <View className="create-invite__content">
        {toPet ? (
          <View className="create-invite__target-card">
            <Image className="create-invite__target-avatar" src={toPet.avatarUrl} mode="aspectFill" />
            <View className="create-invite__target-copy">
              <Text className="create-invite__target-name">{toPet.name}</Text>
              <Text className="create-invite__target-meta">{toPet.distanceText || '模糊距离'} · {PET_TYPE_LABEL[toPet.type]}</Text>
            </View>
            <Text className="create-invite__target-badge">{toPet.breed || PET_TYPE_LABEL[toPet.type]}</Text>
          </View>
        ) : null}

        <View className="create-invite__section">
          <Text className="create-invite__section-title">带着我的主子</Text>
          <View className="create-invite__my-pet-card">
            {selectedPet ? (
              <>
                <Image className="create-invite__my-pet-avatar" src={selectedPet.avatarUrl} mode="aspectFill" />
                <View className="create-invite__my-pet-copy">
                  <Text className="create-invite__my-pet-name">{selectedPet.name}</Text>
                  <Text className="create-invite__my-pet-meta">{selectedPet.breed} · {PET_TYPE_LABEL[selectedPet.type]}</Text>
                </View>
              </>
            ) : (
              <Text className="create-invite__my-pet-name">请选择宠物</Text>
            )}
            <Picker mode="selector" range={myPets.map((pet) => pet.name)} onChange={(event) => setFromPetId(myPets[Number(event.detail.value)]?.id)}>
              <View className="create-invite__my-pet-picker ui-icon ui-icon--chevron" />
            </Picker>
          </View>
        </View>

        <View className="create-invite__section">
          <Text className="create-invite__section-title">邀请类型</Text>
          <View className="create-invite__type-grid">
            {inviteTypes.map((item) => (
              <View className={`create-invite__type-card ${inviteType === item ? 'create-invite__type-card--active' : ''}`} key={item} onClick={() => setInviteType(item)}>
                <View className={`create-invite__type-icon create-invite__type-icon--${item}`} />
                <Text className="create-invite__type-label">{inviteTypeDisplay[item]}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="create-invite__section">
          <Text className="create-invite__section-title">时间与地点</Text>
          <View className="create-invite__schedule-card">
            <View className="create-invite__schedule-row">
              <View className="create-invite__schedule-icon create-invite__schedule-icon--time" />
              <Text className="create-invite__schedule-label">具体时间</Text>
              <Picker mode="date" value={meetDate} onChange={(event) => setMeetDate(event.detail.value)}>
                <View className="create-invite__schedule-value">{meetDate}</View>
              </Picker>
              <Picker mode="time" value={meetTime} onChange={(event) => setMeetTime(event.detail.value)}>
                <View className="create-invite__schedule-value">{meetTime}</View>
              </Picker>
            </View>
            <View className="create-invite__divider" />
            <View className="create-invite__schedule-row">
              <View className="create-invite__schedule-icon ui-icon ui-icon--pin" />
              <Input className="create-invite__location" value={locationName} maxlength={128} placeholder="大概地点 (如：南山公园)" onInput={(event) => setLocationName(event.detail.value)} />
            </View>
            <Text className="create-invite__privacy-hint">隐私提示：不会显示精确门牌号</Text>
          </View>
        </View>

        <View className="create-invite__section">
          <Text className="create-invite__section-title">想说的话</Text>
          <Input className="create-invite__title-input" value={title} maxlength={100} onInput={(event) => setTitle(event.detail.value)} />
          <Textarea className="create-invite__textarea" value={description} maxlength={500} placeholder="打个招呼吧，比如：我家布丁性格温顺，希望能和豆包交朋友..." onInput={(event) => setDescription(event.detail.value)} />
        </View>

        <View className="create-invite__safety">
          <View className="create-invite__safety-icon ui-icon ui-icon--shield" />
          <View className="create-invite__safety-copy">
            <Text className="create-invite__safety-title">安全贴士</Text>
            <Text className="create-invite__safety-text">仅限公共场所见面；请勿泄露电话等个人隐私；线下互动请注意宠物安全社交距离。</Text>
          </View>
        </View>
      </View>

      <View className="create-invite__sticky-submit">
        <Button className="create-invite__submit" loading={submitting} disabled={submitting} onClick={submit}>
          <View className="create-invite__submit-icon ui-icon ui-icon--send" />
          <Text>发送邀请</Text>
        </Button>
      </View>
    </View>
  )
}
