import { Image, Text, View } from '@tarojs/components'
import { PET_TYPE_LABEL } from '@/constants/options'
import type { Post } from '@/types/domain'
import { relativeTime } from '@/utils/format'
import { TagList } from '../TagList'

interface PostCardProps {
  post: Post
  onOpen?: () => void
  onLike?: () => void
}

export function PostCard({ post, onOpen, onLike }: PostCardProps) {
  return (
    <View className="post-card" onClick={onOpen}>
      <View className="post-card__header">
        <Image className="post-card__avatar" src={post.pet?.avatarUrl || ''} mode="aspectFill" />
        <View className="post-card__author">
          <Text className="post-card__name">{post.pet?.name || '宠友'}</Text>
          {post.pet ? <Text className="post-card__breed">{post.pet.breed || PET_TYPE_LABEL[post.pet.type]}</Text> : null}
          <Text className="post-card__meta">
            {relativeTime(post.createdAt)} · {post.locationName || post.city}
          </Text>
        </View>
        <View className="post-card__more ui-icon ui-icon--more" />
      </View>
      <Text className="post-card__content">{post.content}</Text>
      {post.images.length ? (
        <View className={`post-card__images post-card__images--${Math.min(post.images.length, 3)}`}>
          {post.images.slice(0, 3).map((image) => (
            <Image className="post-card__image" key={image} src={image} mode="aspectFill" />
          ))}
        </View>
      ) : null}
      <View className="post-card__location-pill">
        <View className="post-card__location-icon" />
        <Text>{post.locationName || post.city}</Text>
      </View>
      <TagList tags={post.topicTags} tone="orange" max={3} />
      <View className="post-card__actions">
        <View className={`post-card__action ${post.liked ? 'post-card__action--active' : ''}`} onClick={(event) => {
          event.stopPropagation()
          onLike?.()
        }}>
          <View className="post-card__action-icon post-action-icon post-action-icon--heart ui-icon ui-icon--heart" />
          <Text>{post.liked ? '已喜欢' : '喜欢'} {post.likeCount}</Text>
        </View>
        <View className="post-card__action">
          <View className="post-card__action-icon post-action-icon post-action-icon--comment ui-icon ui-icon--comment" />
          <Text>评论 {post.commentCount}</Text>
        </View>
        <View className="post-card__action post-card__share">
          <View className="post-card__action-icon post-action-icon post-action-icon--share ui-icon ui-icon--share" />
          <Text>分享</Text>
        </View>
      </View>
    </View>
  )
}
