import { useEffect, useState } from 'react'
import { chooseImage, navigateBack, useRouter } from '@tarojs/taro'
import { Image, Input, Picker, Text, Textarea, View } from '@tarojs/components'
import { Button } from '@/components/NutUI'
import { DEFAULT_AVATARS, GENDER_LABEL, INTEREST_TAGS, PERSONALITY_TAGS, PET_TYPE_LABEL, VACCINE_LABEL } from '@/constants/options'
import { EmptyState } from '@/components/EmptyState'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { petService, uploadService } from '@/services'
import { usePetStore } from '@/store/petStore'
import type { Gender, Pet, PetType, VaccineStatus } from '@/types/domain'
import { showToast } from '@/utils/navigation'
import { parseRouteId } from '@/utils/route'
import './index.scss'

const petTypes = Object.keys(PET_TYPE_LABEL) as PetType[]
const genders = Object.keys(GENDER_LABEL) as Gender[]
const vaccines = Object.keys(VACCINE_LABEL) as VaccineStatus[]

export default function EditPetPage() {
  const ready = useAuthGuard({ requirePet: true })
  const router = useRouter()
  const id = parseRouteId(router.params.id)
  const updatePet = usePetStore((state) => state.updatePet)
  const loadPets = usePetStore((state) => state.loadPets)
  const [pet, setPet] = useState<Pet>()
  const [name, setName] = useState('')
  const [type, setType] = useState<PetType>('dog')
  const [breed, setBreed] = useState('')
  const [gender, setGender] = useState<Gender>('unknown')
  const [birthday, setBirthday] = useState('2022-01-01')
  const [weight, setWeight] = useState('')
  const [sterilized, setSterilized] = useState(false)
  const [vaccineStatus, setVaccineStatus] = useState<VaccineStatus>('unknown')
  const [personalityTags, setPersonalityTags] = useState<string[]>([])
  const [interestTags, setInterestTags] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [visible, setVisible] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!ready) return
    if (!id) return
    petService.detail(id).then((detail) => {
      setPet(detail)
      setName(detail.name)
      setType(detail.type)
      setBreed(detail.breed)
      setGender(detail.gender)
      setBirthday(detail.birthday || '2022-01-01')
      setWeight(detail.weight ? `${detail.weight}` : '')
      setSterilized(detail.sterilized)
      setVaccineStatus(detail.vaccineStatus)
      setPersonalityTags(detail.personalityTags)
      setInterestTags(detail.interestTags)
      setDescription(detail.description)
      setAvatarUrl(detail.avatarUrl || '')
      setVisible(detail.visible)
    }).catch((error) => {
      showToast(error instanceof Error ? error.message : '宠物资料加载失败')
    })
  }, [id, ready])

  const toggleTag = (tag: string, list: string[], setter: (tags: string[]) => void) => {
    setter(list.includes(tag) ? list.filter((item) => item !== tag) : [...list, tag])
  }

  const pickAvatar = async () => {
    try {
      const res = await chooseImage({ count: 1 })
      const path = res.tempFilePaths?.[0]
      if (!path) return
      const url = await uploadService.uploadImage(path)
      setAvatarUrl(url)
    } catch (error) {
      showToast(error instanceof Error ? error.message : '头像上传失败')
    }
  }

  const submit = async () => {
    if (saving) return
    if (!id) {
      showToast('宠物参数无效')
      return
    }
    setSaving(true)
    try {
      await updatePet(id, {
        name,
        avatarUrl: avatarUrl || DEFAULT_AVATARS[type],
        type,
        breed,
        gender,
        birthday,
        weight: Number(weight) || undefined,
        sterilized,
        vaccineStatus,
        personalityTags,
        interestTags,
        description,
        visible
      })
      await loadPets()
      showToast('已保存', 'success')
      navigateBack()
    } catch (error) {
      showToast(error instanceof Error ? error.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (!ready) {
    return (
      <View className="page">
        <EmptyState title="正在进入编辑宠物" />
      </View>
    )
  }

  if (!id) {
    return (
      <View className="page">
        <EmptyState title="宠物参数无效" description="请返回宠物管理后重新编辑。" />
      </View>
    )
  }

  if (!pet) {
    return (
      <View className="page">
        <EmptyState title="宠物资料加载中" />
      </View>
    )
  }

  return (
    <View className="edit-pet">
      <View className="edit-pet__topbar">
        <View className="edit-pet__back ui-icon ui-icon--back" onClick={() => navigateBack()} />
        <Text className="edit-pet__page-title">编辑宠物档案</Text>
        <View className="edit-pet__spacer" />
      </View>

      <View className="edit-pet__content">
        <View className="edit-pet__avatar-card">
          <View className="edit-pet__avatar-shell" onClick={pickAvatar}>
            <Image className="edit-pet__avatar" src={avatarUrl || DEFAULT_AVATARS[type]} mode="aspectFill" />
            <View className="edit-pet__camera ui-icon ui-icon--camera" />
          </View>
          <View className="edit-pet__avatar-copy">
            <Text className="edit-pet__title">编辑 {pet.name}</Text>
            <Text className="edit-pet__subtitle">更新宠物资料、标签和附近可见状态。</Text>
          </View>
        </View>

        <View className="edit-pet__form-card">
          <Text className="edit-pet__label">宠物昵称</Text>
          <Input className="edit-pet__input" value={name} onInput={(event) => setName(event.detail.value)} />

          <View className="edit-pet__field-grid">
            <View className="edit-pet__field">
              <Text className="edit-pet__label">宠物类型</Text>
              <Picker mode="selector" range={petTypes.map((item) => PET_TYPE_LABEL[item])} value={petTypes.indexOf(type)} onChange={(event) => setType(petTypes[Number(event.detail.value)])}>
                <View className="edit-pet__picker">{PET_TYPE_LABEL[type]}</View>
              </Picker>
            </View>
            <View className="edit-pet__field">
              <Text className="edit-pet__label">品种</Text>
              <Input className="edit-pet__input" value={breed} onInput={(event) => setBreed(event.detail.value)} />
            </View>
          </View>

          <View className="edit-pet__field-grid">
            <View className="edit-pet__field">
              <Text className="edit-pet__label">性别</Text>
              <Picker mode="selector" range={genders.map((item) => GENDER_LABEL[item])} value={genders.indexOf(gender)} onChange={(event) => setGender(genders[Number(event.detail.value)])}>
                <View className="edit-pet__picker">{GENDER_LABEL[gender]}</View>
              </Picker>
            </View>
            <View className="edit-pet__field">
              <Text className="edit-pet__label">生日</Text>
              <Picker mode="date" value={birthday} onChange={(event) => setBirthday(event.detail.value)}>
                <View className="edit-pet__picker">{birthday}</View>
              </Picker>
            </View>
          </View>

          <View className="edit-pet__field-grid">
            <View className="edit-pet__field">
              <Text className="edit-pet__label">体重 kg</Text>
              <Input className="edit-pet__input" type="digit" value={weight} onInput={(event) => setWeight(event.detail.value)} />
            </View>
            <View className="edit-pet__field">
              <Text className="edit-pet__label">疫苗状态</Text>
              <Picker mode="selector" range={vaccines.map((item) => VACCINE_LABEL[item])} value={vaccines.indexOf(vaccineStatus)} onChange={(event) => setVaccineStatus(vaccines[Number(event.detail.value)])}>
                <View className="edit-pet__picker">{VACCINE_LABEL[vaccineStatus]}</View>
              </Picker>
            </View>
          </View>

          <View className="edit-pet__switch-row">
            <View className="edit-pet__switch-copy">
              <Text className="edit-pet__switch-title">已绝育</Text>
              <Text className="edit-pet__switch-desc">帮助其他宠友判断线下互动安全边界</Text>
            </View>
            <View className={`settings-switch ${sterilized ? 'settings-switch--active' : ''}`} onClick={() => setSterilized(!sterilized)}>
              <Text className="settings-switch__dot" />
            </View>
          </View>
        </View>

        <View className="edit-pet__form-card">
          <Text className="edit-pet__label">性格标签</Text>
          <View className="edit-pet__chip-grid">
            {PERSONALITY_TAGS.map((tag) => (
              <View className={`edit-pet__chip ${personalityTags.includes(tag) ? 'edit-pet__chip--active' : ''}`} key={tag} onClick={() => toggleTag(tag, personalityTags, setPersonalityTags)}>
                {tag}
              </View>
            ))}
          </View>

          <Text className="edit-pet__label">兴趣标签</Text>
          <View className="edit-pet__chip-grid">
            {INTEREST_TAGS.map((tag) => (
              <View className={`edit-pet__chip edit-pet__chip--orange ${interestTags.includes(tag) ? 'edit-pet__chip--active' : ''}`} key={tag} onClick={() => toggleTag(tag, interestTags, setInterestTags)}>
                {tag}
              </View>
            ))}
          </View>

          <Text className="edit-pet__label">简介</Text>
          <Textarea className="edit-pet__textarea" value={description} maxlength={500} onInput={(event) => setDescription(event.detail.value)} />

          <View className="edit-pet__switch-row">
            <View className="edit-pet__switch-copy">
              <Text className="edit-pet__switch-title">附近可见</Text>
              <Text className="edit-pet__switch-desc">开启后，附近宠友只能看到模糊距离</Text>
            </View>
            <View className={`settings-switch ${visible ? 'settings-switch--active' : ''}`} onClick={() => setVisible(!visible)}>
              <Text className="settings-switch__dot" />
            </View>
          </View>
        </View>
      </View>

      <View className="edit-pet__sticky-submit">
        <Button className="edit-pet__submit submit-button" loading={saving} disabled={saving} onClick={submit}>保存修改</Button>
      </View>
    </View>
  )
}
