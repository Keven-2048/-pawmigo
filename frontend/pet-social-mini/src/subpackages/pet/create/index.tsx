import { useState } from 'react'
import { chooseImage, navigateBack } from '@tarojs/taro'
import { Image, Input, Picker, Text, Textarea, View } from '@tarojs/components'
import { Button } from '@/components/NutUI'
import { DEFAULT_AVATARS, GENDER_LABEL, INTEREST_TAGS, PERSONALITY_TAGS, PET_TYPE_LABEL, VACCINE_LABEL } from '@/constants/options'
import { EmptyState } from '@/components/EmptyState'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { uploadService } from '@/services'
import { usePetStore } from '@/store/petStore'
import type { Gender, PetType, VaccineStatus } from '@/types/domain'
import { showToast, toNearby } from '@/utils/navigation'
import './index.scss'

const petTypes = Object.keys(PET_TYPE_LABEL) as PetType[]
const genders = Object.keys(GENDER_LABEL) as Gender[]
const vaccines = Object.keys(VACCINE_LABEL) as VaccineStatus[]

export default function CreatePetPage() {
  const ready = useAuthGuard({ requirePet: false })
  const createPet = usePetStore((state) => state.createPet)
  const [name, setName] = useState('')
  const [type, setType] = useState<PetType>('dog')
  const [breed, setBreed] = useState('柯基')
  const [gender, setGender] = useState<Gender>('male')
  const [birthday, setBirthday] = useState('2022-01-01')
  const [weight, setWeight] = useState('8')
  const [sterilized, setSterilized] = useState(true)
  const [vaccineStatus, setVaccineStatus] = useState<VaccineStatus>('completed')
  const [personalityTags, setPersonalityTags] = useState<string[]>(['活泼', '亲人'])
  const [interestTags, setInterestTags] = useState<string[]>(['遛弯', '公园'])
  const [description, setDescription] = useState('喜欢认识新朋友，见面会先闻闻再摇尾巴。')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [visible, setVisible] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const toggleTag = (tag: string, list: string[], setter: (tags: string[]) => void, max = 10) => {
    if (list.includes(tag)) {
      setter(list.filter((item) => item !== tag))
      return
    }
    if (list.length >= max) {
      showToast('标签最多 10 个')
      return
    }
    setter([...list, tag])
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
    if (!ready) return
    if (submitting) return
    setSubmitting(true)
    try {
      await createPet({
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
      showToast('宠物档案已创建', 'success')
      await toNearby()
    } catch (error) {
      showToast(error instanceof Error ? error.message : '创建失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (!ready) {
    return (
      <View className="page create-pet">
        <EmptyState title="正在准备宠物档案" />
      </View>
    )
  }

  return (
    <View className="create-pet">
      <View className="create-pet__topbar">
        <View className="create-pet__back ui-icon ui-icon--back" onClick={() => navigateBack()} />
        <Text className="create-pet__topbar-title">创建宠物档案</Text>
        <View className="create-pet__spacer" />
      </View>

      <View className="create-pet__content">
        <View className="create-pet__avatar-upload" onClick={pickAvatar}>
          <View className="create-pet__avatar-shell">
            <Image className="create-pet__avatar" src={avatarUrl || DEFAULT_AVATARS[type]} mode="aspectFill" />
            <View className="create-pet__camera ui-icon ui-icon--camera" />
          </View>
          <Text className="create-pet__avatar-hint">点击上传宠物美照</Text>
        </View>

        <View className="form-card">
          <Text className="form-label">宠物昵称</Text>
          <Input className="form-input" value={name} placeholder="给TA取个好听的名字" onInput={(event) => setName(event.detail.value)} />

          <View className="create-pet__field-grid">
            <View className="create-pet__field">
              <Text className="form-label">种类</Text>
              <Picker mode="selector" range={petTypes.map((item) => PET_TYPE_LABEL[item])} onChange={(event) => setType(petTypes[Number(event.detail.value)])}>
                <View className="form-picker">{PET_TYPE_LABEL[type]}</View>
              </Picker>
            </View>
            <View className="create-pet__field">
              <Text className="form-label">品种</Text>
              <Input className="form-input" value={breed} placeholder="例如：金毛" onInput={(event) => setBreed(event.detail.value)} />
            </View>
          </View>

          <Text className="form-label">性别</Text>
          <View className="create-pet__segmented">
            {genders.map((item) => (
              <View className={`create-pet__segment ${gender === item ? 'create-pet__segment--active' : ''}`} key={item} onClick={() => setGender(item)}>
                {item === 'male' ? '男孩子' : item === 'female' ? '女孩子' : '未知'}
              </View>
            ))}
          </View>

          <View className="create-pet__field-grid">
            <View className="create-pet__field">
              <Text className="form-label">生日</Text>
              <Picker mode="date" value={birthday} onChange={(event) => setBirthday(event.detail.value)}>
                <View className="form-picker">{birthday}</View>
              </Picker>
            </View>
            <View className="create-pet__field">
              <Text className="form-label">体重 (kg)</Text>
              <Input className="form-input" type="digit" value={weight} onInput={(event) => setWeight(event.detail.value)} />
            </View>
          </View>

          <View className="create-pet__field-grid">
            <View className="form-switch">
              <Text>已绝育</Text>
              <View className={`settings-switch ${sterilized ? 'settings-switch--active' : ''}`} onClick={() => setSterilized(!sterilized)}>
                <Text className="settings-switch__dot" />
              </View>
            </View>
            <View className="create-pet__field">
              <Text className="form-label">疫苗状态</Text>
              <Picker mode="selector" range={vaccines.map((item) => VACCINE_LABEL[item])} onChange={(event) => setVaccineStatus(vaccines[Number(event.detail.value)])}>
                <View className="form-picker">{VACCINE_LABEL[vaccineStatus]}</View>
              </Picker>
            </View>
          </View>
        </View>

        <View className="form-card">
          <View className="form-section-title">
            <View className="form-section-title__icon ui-icon ui-icon--face" />
            <Text className="form-label form-label--section">性格标签</Text>
          </View>
          <View className="chip-grid">
            {PERSONALITY_TAGS.map((tag) => (
              <View className={`chip ${personalityTags.includes(tag) ? 'chip--active' : ''}`} key={tag} onClick={() => toggleTag(tag, personalityTags, setPersonalityTags)}>
                {tag}
              </View>
            ))}
          </View>

          <View className="form-section-title">
            <View className="form-section-title__icon ui-icon ui-icon--star" />
            <Text className="form-label form-label--section">兴趣爱好</Text>
          </View>
          <View className="chip-grid">
            {INTEREST_TAGS.map((tag) => (
              <View className={`chip chip--orange ${interestTags.includes(tag) ? 'chip--active' : ''}`} key={tag} onClick={() => toggleTag(tag, interestTags, setInterestTags)}>
                {tag}
              </View>
            ))}
          </View>

          <Text className="form-label">宠物简介</Text>
          <Textarea className="form-textarea" value={description} maxlength={500} placeholder="介绍一下你的毛孩子吧，比如它的怪癖或者最爱吃的零食..." onInput={(event) => setDescription(event.detail.value)} />

          <View className="form-switch">
            <Text>附近可见</Text>
            <View className={`settings-switch ${visible ? 'settings-switch--active' : ''}`} onClick={() => setVisible(!visible)}>
              <Text className="settings-switch__dot" />
            </View>
          </View>
        </View>
      </View>

      <View className="create-pet__sticky-submit">
        <Button className="submit-button" loading={submitting} disabled={submitting} onClick={submit}>
          <Text>保存并开始探索</Text>
          <View className="submit-button__icon ui-icon ui-icon--rocket" />
        </Button>
      </View>
    </View>
  )
}
