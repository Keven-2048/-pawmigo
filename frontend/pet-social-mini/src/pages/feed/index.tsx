import { useEffect, useState } from 'react'
import { navigateTo } from '@tarojs/taro'
import { Text, View } from '@tarojs/components'
import { EmptyState } from '@/components/EmptyState'
import { PostCard } from '@/components/PostCard'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { postService } from '@/services'
import type { FeedType, Post } from '@/types/domain'
import { showToast, toPostDetail } from '@/utils/navigation'
import './index.scss'

const feeds: Array<{ key: FeedType; label: string }> = [
  { key: 'recommend', label: '推荐' },
  { key: 'nearby', label: '附近' },
  { key: 'following', label: '关注' }
]

export default function FeedPage() {
  const ready = useAuthGuard({ requirePet: true })
  const [feed, setFeed] = useState<FeedType>('recommend')
  const [posts, setPosts] = useState<Post[]>([])

  const load = async (nextFeed = feed) => {
    try {
      const result = await postService.list(nextFeed)
      setPosts(result.list)
    } catch (error) {
      showToast(error instanceof Error ? error.message : '动态加载失败')
    }
  }

  useEffect(() => {
    if (ready) load()
  }, [feed, ready])

  const toggleLike = async (post: Post) => {
    try {
      const updated = post.liked ? await postService.unlike(post.id) : await postService.like(post.id)
      setPosts(posts.map((item) => (item.id === updated.id ? updated : item)))
    } catch (error) {
      showToast(error instanceof Error ? error.message : '操作失败')
    }
  }

  if (!ready) {
    return (
      <View className="page page--tab feed-page">
        <EmptyState title="正在进入社交圈" />
      </View>
    )
  }

  return (
      <View className="page page--tab feed-page">
      <View className="feed-page__appbar capsule-safe-appbar">
        <View className="feed-page__brand">
          <View className="feed-page__pin ui-icon ui-icon--pin" />
          <Text className="feed-page__brand-name">ChongYouQuan</Text>
        </View>
        <View className="feed-page__search capsule-safe-appbar__action ui-icon ui-icon--search" />
      </View>
      <Text className="feed-page__title">社交圈</Text>
      <View className="feed-tabs feed-tabs--underline">
        {feeds.map((item) => (
          <View className={`feed-tab ${feed === item.key ? 'feed-tab--active' : ''}`} key={item.key} onClick={() => setFeed(item.key)}>
            <Text>{item.label}</Text>
          </View>
        ))}
      </View>
      {posts.length ? (
        <View className="feed-list">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onOpen={() => toPostDetail(post.id)} onLike={() => toggleLike(post)} />
          ))}
        </View>
      ) : (
        <EmptyState title="还没有动态" description="发布一条宠物日常，让附近宠友先认识你的毛孩子。" actionText="发布动态" onAction={() => navigateTo({ url: '/subpackages/post/create/index' })} />
      )}
      <View className="feed-page__fab" onClick={() => navigateTo({ url: '/subpackages/post/create/index' })}>
        <View className="feed-page__fab-icon ui-icon ui-icon--add" />
      </View>
    </View>
  )
}
