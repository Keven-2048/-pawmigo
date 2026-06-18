import { useEffect, useState } from 'react'
import { navigateBack, navigateTo } from '@tarojs/taro'
import { Image, Text, View } from '@tarojs/components'
import { Button } from '@/components/NutUI'
import { EmptyState } from '@/components/EmptyState'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { usePetStore } from '@/store/petStore'
import { GENDER_LABEL } from '@/constants/options'
import type { Pet } from '@/types/domain'
import { showToast } from '@/utils/navigation'
import './index.scss'

function toPetPayload(pet: Pet, visible = pet.visible) {
  return {
    name: pet.name,
    avatarUrl: pet.avatarUrl,
    type: pet.type,
    breed: pet.breed,
    gender: pet.gender,
    birthday: pet.birthday,
    weight: pet.weight,
    sterilized: pet.sterilized,
    vaccineStatus: pet.vaccineStatus,
    personalityTags: pet.personalityTags,
    interestTags: pet.interestTags,
    description: pet.description,
    visible
  }
}

export default function PetManagePage() {
  const ready = useAuthGuard()
  const pets = usePetStore((state) => state.pets)
  const loadPets = usePetStore((state) => state.loadPets)
  const updatePet = usePetStore((state) => state.updatePet)
  const setDefaultPet = usePetStore((state) => state.setDefaultPet)
  const deletePet = usePetStore((state) => state.deletePet)
  const [busyId, setBusyId] = useState<number>()

  useEffect(() => {
    if (ready) {
      loadPets().catch((error) => {
        showToast(error instanceof Error ? error.message : '宠物档案加载失败')
      })
    }
  }, [ready])

  const removePet = async (id: number) => {
    if (busyId) return
    setBusyId(id)
    try {
      await deletePet(id)
      showToast('已删除', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '删除失败')
    } finally {
      setBusyId(undefined)
    }
  }

  const makeDefault = async (id: number) => {
    if (busyId) return
      setBusyId(id)
    try {
      await setDefaultPet(id)
      showToast('已设为主宠', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '设置失败')
    } finally {
      setBusyId(undefined)
    }
  }

  const toggleVisibility = async (pet: Pet) => {
    if (busyId) return
    setBusyId(pet.id)
    try {
      await updatePet(pet.id, toPetPayload(pet, !pet.visible))
      showToast(pet.visible ? '已隐藏附近展示' : '已开启附近展示', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '设置失败')
    } finally {
      setBusyId(undefined)
    }
  }

  if (!ready) {
    return (
      <View className="page pet-manage">
        <EmptyState title="正在进入宠物管理" />
      </View>
    )
  }

  return (
    <View className="page pet-manage">
      <View className="pet-manage__topbar capsule-safe-appbar">
        <View className="pet-manage__back ui-icon ui-icon--back" onClick={() => navigateBack()} />
        <Text className="pet-manage__title">我的宠物</Text>
        <Text className="pet-manage__add capsule-safe-appbar__action" onClick={() => navigateTo({ url: '/subpackages/pet/create/index' })}>添加</Text>
      </View>

      <View className="pet-manage__summary">
        <View>
          <Text className="pet-manage__summary-label">当前养护中</Text>
          <Text className="pet-manage__summary-count">{pets.length} 只萌宠</Text>
        </View>
        <View className="pet-manage__summary-paw">
          <View className="pet-manage__summary-dot pet-manage__summary-dot--one" />
          <View className="pet-manage__summary-dot pet-manage__summary-dot--two" />
          <View className="pet-manage__summary-dot pet-manage__summary-dot--three" />
          <View className="pet-manage__summary-pad" />
        </View>
      </View>

      <View className="pet-manage__list">
        {pets.map((pet) => (
          <View className="pet-manage__card card" key={pet.id}>
            <View className="pet-manage__card-main" onClick={() => navigateTo({ url: `/subpackages/pet/detail/index?id=${pet.id}` })}>
              <Image className="pet-manage__avatar" src={pet.avatarUrl} mode="aspectFill" />
              <View className="pet-manage__copy">
                <View className="pet-manage__name-row">
                  <Text className="pet-manage__name">{pet.name}</Text>
                  {pet.isDefault ? <Text className="pet-manage__default">默认</Text> : null}
                </View>
                <Text className="pet-manage__meta">{pet.breed || '萌宠'} · {GENDER_LABEL[pet.gender]}</Text>
              </View>
              <View className="pet-manage__edit ui-icon ui-icon--edit" onClick={(event) => {
                event.stopPropagation()
                navigateTo({ url: `/subpackages/pet/edit/index?id=${pet.id}` })
              }} />
            </View>

            <View className="pet-manage__visibility">
              <View className={`pet-manage__visibility-icon ui-icon ${pet.visible ? 'ui-icon--visibility' : 'ui-icon--visibility-off'}`} />
              <Text className="pet-manage__visibility-text">{pet.visible ? '附近可见' : '附近隐藏'}</Text>
              <View
                className={`pet-manage__toggle ${pet.visible ? 'pet-manage__toggle--active' : ''} ${busyId === pet.id ? 'pet-manage__toggle--disabled' : ''}`}
                onClick={(event) => {
                  event.stopPropagation()
                  toggleVisibility(pet)
                }}
              >
                <Text className="pet-manage__toggle-dot" />
              </View>
            </View>

            <View className="pet-manage__manage-row">
              <View className="pet-manage__default-status">
                <View className={`pet-manage__default-icon ui-icon ${pet.isDefault ? 'ui-icon--check' : 'ui-icon--swap'}`} />
                <Text>{pet.isDefault ? '当前主宠' : '可切换为主宠'}</Text>
              </View>
              <View className="pet-manage__row-actions">
                {!pet.isDefault ? (
                  <Button className="pet-manage__text-action" disabled={busyId === pet.id} loading={busyId === pet.id} onClick={() => makeDefault(pet.id)}>
                    设为主宠
                  </Button>
                ) : null}
                <Button className="pet-manage__danger-link" disabled={busyId === pet.id} loading={busyId === pet.id} onClick={() => removePet(pet.id)}>
                  删除
                </Button>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View className="pet-manage__empty-hint">
        <View className="pet-manage__empty-icon">
          <View className="pet-manage__empty-dot pet-manage__empty-dot--one" />
          <View className="pet-manage__empty-dot pet-manage__empty-dot--two" />
          <View className="pet-manage__empty-dot pet-manage__empty-dot--three" />
          <View className="pet-manage__empty-pad" />
        </View>
        <Text className="pet-manage__empty-copy">你的爱宠都在这里</Text>
      </View>
    </View>
  )
}
