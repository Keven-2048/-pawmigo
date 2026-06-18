import { useEffect, useState } from 'react'
import { navigateBack, navigateTo, useRouter } from '@tarojs/taro'
import { Image, Text, View } from '@tarojs/components'
import { Button } from '@/components/NutUI'
import { GENDER_LABEL, PET_TYPE_LABEL, VACCINE_LABEL } from '@/constants/options'
import { EmptyState } from '@/components/EmptyState'
import { Section } from '@/components/Section'
import { TagList } from '@/components/TagList'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { petService, postService, blockService } from '@/services'
import { useUserStore } from '@/store/userStore'
import type { Pet, Post } from '@/types/domain'
import { formatAge } from '@/utils/format'
import { showToast, toPostDetail } from '@/utils/navigation'
import { getPetDetailActions } from '@/utils/ownership'
import { parseRouteId } from '@/utils/route'
import { PostCard } from '@/components/PostCard'
import './index.scss'

export default function PetDetailPage() {
  const ready = useAuthGuard()
  const router = useRouter()
  const id = parseRouteId(router.params.id)
  const currentUserId = useUserStore((state) => state.user?.id)
  const [pet, setPet] = useState<Pet>()
  const [posts, setPosts] = useState<Post[]>([])

  const load = async () => {
    if (!id) return
    try {
      const detail = await petService.detail(id)
      setPet(detail)
      const feed = await postService.list('recommend')
      setPosts(feed.list.filter((post) => post.petId === id).slice(0, 2))
    } catch (error) {
      showToast(error instanceof Error ? error.message : '宠物主页加载失败')
    }
  }

  useEffect(() => {
    if (ready) load()
  }, [id, ready])

  const createInvite = () => {
    if (!id) return
    navigateTo({ url: `/subpackages/invite/create/index?toPetId=${id}` })
  }

  const blockOwner = async () => {
    if (!pet || !pet.userId) return
    try {
      await blockService.create(pet.userId, '不想再互相可见')
      showToast('已加入黑名单', 'success')
      navigateBack()
    } catch (error) {
      showToast(error instanceof Error ? error.message : '拉黑失败')
    }
  }

  const petActions = pet ? getPetDetailActions({ petUserId: pet.userId, currentUserId }) : {
    secondary: 'none' as const,
    primary: 'none' as const
  }

  const handleSecondaryAction = () => {
    if (!pet) return
    if (petActions.secondary === 'edit') {
      navigateTo({ url: `/subpackages/pet/edit/index?id=${pet.id}` })
      return
    }
    if (petActions.secondary === 'block') {
      blockOwner()
    }
  }

  const handlePrimaryAction = () => {
    if (!pet) return
    if (petActions.primary === 'publish') {
      navigateTo({ url: `/subpackages/post/create/index?petId=${pet.id}` })
      return
    }
    if (petActions.primary === 'invite') {
      createInvite()
    }
  }

  if (!ready) {
    return (
      <View className="page">
        <EmptyState title="正在进入宠物主页" />
      </View>
    )
  }

  if (!id) {
    return (
      <View className="page">
        <EmptyState title="宠物参数无效" description="请返回附近列表后重新打开宠物主页。" />
      </View>
    )
  }

  if (!pet) {
    return (
      <View className="page">
        <EmptyState title="宠物主页加载中" />
      </View>
    )
  }

  return (
    <View className="pet-detail">
      <View className="pet-detail__nav">
        <View className="pet-detail__nav-button ui-icon ui-icon--back" onClick={() => navigateBack()} />
        <View className="pet-detail__nav-button ui-icon ui-icon--info" onClick={() => navigateTo({ url: `/subpackages/settings/report/index?targetType=pet&targetId=${pet.id}` })} />
      </View>

      <View className="pet-detail__hero">
        <Image className="pet-detail__cover" src={pet.avatarUrl} mode="aspectFill" />
        <View className="pet-detail__floating-avatar">
          <Image className="pet-detail__avatar" src={pet.avatarUrl} mode="aspectFill" />
        </View>
      </View>

      <View className="pet-detail__identity">
        <View className="pet-detail__identity-copy">
          <Text className="pet-detail__name">{pet.name}</Text>
          <Text className="pet-detail__meta">
            {PET_TYPE_LABEL[pet.type]} · {pet.breed} · {formatAge(pet.birthday)} · {GENDER_LABEL[pet.gender]}
          </Text>
        </View>
        <Text className="pet-detail__distance">{pet.distanceText || '模糊距离'}</Text>
      </View>

      <View className="pet-detail__owner-strip">
        <Image className="pet-detail__owner-avatar" src={pet.ownerAvatarUrl || pet.avatarUrl} mode="aspectFill" />
        <View className="pet-detail__owner-copy">
          <Text className="pet-detail__owner-name">Owner: {pet.ownerName || '宠物主人'}</Text>
          <Text className="pet-detail__owner-note">主人信息已弱化展示</Text>
        </View>
      </View>

      <View className="pet-detail__metric-grid">
        <View className="pet-detail__metric">
          <Text className="pet-detail__metric-value">{pet.weight ? `${pet.weight}kg` : '未知'}</Text>
          <Text className="pet-detail__metric-label">体重</Text>
        </View>
        <View className="pet-detail__metric">
          <Text className="pet-detail__metric-value">{pet.sterilized ? '已绝育' : '未绝育'}</Text>
          <Text className="pet-detail__metric-label">绝育</Text>
        </View>
        <View className="pet-detail__metric">
          <Text className="pet-detail__metric-value">{VACCINE_LABEL[pet.vaccineStatus]}</Text>
          <Text className="pet-detail__metric-label">疫苗</Text>
        </View>
      </View>

      <Section title="性格">
        <TagList tags={pet.personalityTags} />
      </Section>
      <Section title="兴趣">
        <TagList tags={pet.interestTags} tone="orange" />
      </Section>
      <Section title="介绍">
        <Text className="pet-detail__desc">{pet.description}</Text>
      </Section>
      <Section title="最近动态">
        {posts.length ? (
          posts.map((post) => (
            <PostCard key={post.id} post={post} onOpen={() => toPostDetail(post.id)} />
          ))
        ) : (
          <EmptyState title="还没有动态" description="可以先发起一次温柔的见面邀请。" />
        )}
      </Section>

      {petActions.primary !== 'none' || petActions.secondary !== 'none' ? (
        <View className="pet-detail__bottom-actions">
          {petActions.secondary !== 'none' ? (
            <Button className="pet-detail__follow" onClick={handleSecondaryAction}>
              {petActions.secondary === 'edit' ? '编辑资料' : '拉黑'}
            </Button>
          ) : null}
          {petActions.primary !== 'none' ? (
            <Button className="pet-detail__invite" onClick={handlePrimaryAction}>
              {petActions.primary === 'publish' ? '发布动态' : '发起邀请'}
            </Button>
          ) : null}
        </View>
      ) : null}
    </View>
  )
}
