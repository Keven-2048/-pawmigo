import { useEffect, useState } from 'react'
import { navigateBack, switchTab, useRouter } from '@tarojs/taro'
import { Image, Input, Picker, Text, Textarea, View } from '@tarojs/components'
import { Button } from '@/components/NutUI'
import { MOCK_POST_IMAGES } from '@/constants/assets'
import { INTEREST_TAGS, VISIBILITY_LABEL } from '@/constants/options'
import { EmptyState } from '@/components/EmptyState'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { postService } from '@/services'
import { usePetStore } from '@/store/petStore'
import type { PostVisibility } from '@/types/domain'
import { showToast } from '@/utils/navigation'
import { parseRouteId } from '@/utils/route'
import './index.scss'

const visibilities = Object.keys(VISIBILITY_LABEL) as PostVisibility[]
const visibilityIcons: Record<PostVisibility, string> = {
  public: 'globe',
  nearby: 'near-me',
  followers: 'group',
  private: 'lock'
}

export default function CreatePostPage() {
  const ready = useAuthGuard({ requirePet: true })
  const router = useRouter()
  const routePetId = parseRouteId(router.params.petId)
  const loadPets = usePetStore((state) => state.loadPets)
  const pickCurrentPet = usePetStore((state) => state.pickCurrentPet)
  const currentPet = usePetStore((state) => state.currentPet)
  const [content, setContent] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [locationName, setLocationName] = useState('社区花园')
  const [visibility, setVisibility] = useState<PostVisibility>('nearby')
  const [topicTags, setTopicTags] = useState<string[]>(['遛弯'])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (ready) {
      loadPets()
        .then((pets) => {
          if (routePetId && pets.some((pet) => pet.id === routePetId)) {
            pickCurrentPet(routePetId)
          }
        })
        .catch((error) => {
          showToast(error instanceof Error ? error.message : '宠物档案加载失败')
        })
    }
  }, [pickCurrentPet, ready, routePetId])

  const chooseMockImage = () => {
    if (images.length >= 9) {
      showToast('图片最多 9 张')
      return
    }
    const next = MOCK_POST_IMAGES[images.length % MOCK_POST_IMAGES.length]
    setImages([...images, next])
  }

  const toggleTag = (tag: string) => {
    setTopicTags(topicTags.includes(tag) ? topicTags.filter((item) => item !== tag) : [...topicTags, tag])
  }

  const submit = async () => {
    if (submitting) return
    if (!currentPet) {
      showToast('请先创建宠物')
      return
    }
    setSubmitting(true)
    try {
      await postService.create({
        petId: currentPet.id,
        content,
        images,
        locationName,
        topicTags,
        visibility
      })
      showToast('动态已发布', 'success')
      switchTab({ url: '/pages/feed/index' })
    } catch (error) {
      showToast(error instanceof Error ? error.message : '发布失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (!ready) {
    return (
      <View className="page create-post">
        <EmptyState title="正在准备发布动态" />
      </View>
    )
  }

  return (
    <View className="create-post">
      <View className="create-post__topbar">
        <View className="create-post__close ui-icon ui-icon--close" onClick={() => navigateBack()} />
        <Text className="create-post__page-title">发布动态</Text>
        <View className="create-post__spacer" />
      </View>

      <View className="create-post__identity-card">
        <View className="create-post__identity-avatar-wrap">
          {currentPet ? <Image className="create-post__identity-avatar" src={currentPet.avatarUrl} mode="aspectFill" /> : null}
          <View className="create-post__identity-badge ui-icon ui-icon--swap" />
        </View>
        <View className="create-post__identity-copy">
          <Text className="create-post__identity-name">{currentPet?.name || '我的宠物'}</Text>
          <Text className="create-post__identity-note">正在以宠物身份发布</Text>
        </View>
      </View>

      <Textarea className="create-post__textarea" value={content} maxlength={1000} placeholder="记录毛孩子今天的小日常..." onInput={(event) => setContent(event.detail.value)} />

      <View className="create-post__photo-grid">
          {images.map((image) => (
            <Image className="create-post__image" key={image} src={image} mode="aspectFill" onClick={() => setImages(images.filter((item) => item !== image))} />
          ))}
          <View className="create-post__add" onClick={chooseMockImage}>
            <View className="create-post__add-icon ui-icon ui-icon--camera" />
            <Text>{images.length}/9</Text>
          </View>
      </View>

      <View className="create-post__utility-row">
        <View className="create-post__utility-pill">
          <View className="create-post__utility-icon ui-icon ui-icon--pin" />
          <Input className="create-post__utility-input" value={locationName} placeholder="添加地点" onInput={(event) => setLocationName(event.detail.value)} />
        </View>
        <View className="create-post__utility-pill">
          <View className="create-post__utility-icon ui-icon ui-icon--tag" />
          <Text>添加话题</Text>
        </View>
      </View>

      <View className="create-post__card card">
        <View className="create-post__visibility-title">
          <View className="create-post__visibility-title-icon ui-icon ui-icon--visibility" />
          <Text className="create-post__label">谁可以看到</Text>
        </View>
        <View className="create-post__visibility-grid">
          {visibilities.map((item) => (
            <View className={`create-post__visibility ${visibility === item ? 'create-post__visibility--active' : ''}`} key={item} onClick={() => setVisibility(item)}>
              <View className={`create-post__visibility-icon ui-icon ui-icon--${visibilityIcons[item]}`} />
              <Text>{VISIBILITY_LABEL[item]}</Text>
            </View>
          ))}
        </View>
      </View>
      <View className="create-post__topic-panel">
        <View className="create-post__chips">
          {INTEREST_TAGS.slice(0, 8).map((tag) => (
            <View className={`create-post__chip ${topicTags.includes(tag) ? 'create-post__chip--active' : ''}`} key={tag} onClick={() => toggleTag(tag)}>
              {tag}
            </View>
          ))}
        </View>
      </View>
      <View className="create-post__sticky-submit">
        <Button className="create-post__submit" loading={submitting} disabled={submitting} onClick={submit}>
          <Text>发布</Text>
          <View className="create-post__submit-icon ui-icon ui-icon--send" />
        </Button>
      </View>
    </View>
  )
}
