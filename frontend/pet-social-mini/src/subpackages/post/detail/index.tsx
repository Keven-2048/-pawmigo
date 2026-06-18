import { useEffect, useState } from 'react'
import { navigateBack, navigateTo, useRouter } from '@tarojs/taro'
import { Image, Input, Text, View } from '@tarojs/components'
import { Button } from '@/components/NutUI'
import { EmptyState } from '@/components/EmptyState'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { postService, blockService } from '@/services'
import { useUserStore } from '@/store/userStore'
import type { Comment, Post } from '@/types/domain'
import { relativeTime } from '@/utils/format'
import { showToast } from '@/utils/navigation'
import { canDeleteComment, isOwnedByCurrentUser } from '@/utils/ownership'
import { parseRouteId } from '@/utils/route'
import './index.scss'

export default function PostDetailPage() {
  const ready = useAuthGuard()
  const router = useRouter()
  const id = parseRouteId(router.params.id)
  const currentUserId = useUserStore((state) => state.user?.id)
  const [post, setPost] = useState<Post>()
  const [comments, setComments] = useState<Comment[]>([])
  const [content, setContent] = useState('')
  const [commenting, setCommenting] = useState(false)

  const load = async () => {
    if (!id) return
    try {
      const detail = await postService.detail(id)
      const list = await postService.comments(id)
      setPost(detail)
      setComments(list)
    } catch (error) {
      showToast(error instanceof Error ? error.message : '动态加载失败')
    }
  }

  useEffect(() => {
    if (ready) load()
  }, [id, ready])

  const toggleLike = async () => {
    if (!post) return
    try {
      const updated = post.liked ? await postService.unlike(post.id) : await postService.like(post.id)
      setPost(updated)
    } catch (error) {
      showToast(error instanceof Error ? error.message : '操作失败')
    }
  }

  const submitComment = async () => {
    if (commenting) return
    if (!id) return
    if (!content.trim()) {
      showToast('请填写评论内容')
      return
    }
    setCommenting(true)
    try {
      await postService.createComment(id, content)
      setContent('')
      await load()
    } catch (error) {
      showToast(error instanceof Error ? error.message : '评论失败')
    } finally {
      setCommenting(false)
    }
  }

  const deleteComment = async (commentId: number) => {
    try {
      await postService.deleteComment(commentId)
      await load()
    } catch (error) {
      showToast(error instanceof Error ? error.message : '删除失败')
    }
  }

  const deletePost = async () => {
    if (!post) return
    try {
      await postService.delete(post.id)
      showToast('已删除', 'success')
      navigateBack()
    } catch (error) {
      showToast(error instanceof Error ? error.message : '删除失败')
    }
  }

  const blockAuthor = async () => {
    if (!post) return
    try {
      await blockService.create(post.userId, '不想再看到该作者内容')
      showToast('已加入黑名单', 'success')
      navigateBack()
    } catch (error) {
      showToast(error instanceof Error ? error.message : '拉黑失败')
    }
  }

  if (!ready) {
    return (
      <View className="page">
        <EmptyState title="正在进入动态详情" />
      </View>
    )
  }

  if (!id) {
    return (
      <View className="page">
        <EmptyState title="动态参数无效" description="请返回社交圈后重新打开动态详情。" />
      </View>
    )
  }

  if (!post) {
    return (
      <View className="page">
        <EmptyState title="动态加载中" />
      </View>
    )
  }

  return (
    <View className="post-detail">
      <View className="post-detail__topbar">
        <View className="post-detail__back ui-icon ui-icon--back" onClick={() => navigateBack()} />
        <Text className="post-detail__page-title">动态详情</Text>
        <View className="post-detail__more ui-icon ui-icon--more" />
      </View>

      <View className="post-detail__article-card">
        <View className="post-detail__author">
          <Image className="post-detail__avatar" src={post.pet?.avatarUrl || ''} mode="aspectFill" />
          <View className="post-detail__author-copy">
            <Text className="post-detail__author-name">{post.pet?.name || '宠友'}</Text>
            <Text className="post-detail__meta">{relativeTime(post.createdAt)} · {post.locationName || post.city}</Text>
          </View>
          <Text className="post-detail__follow">关注动态</Text>
        </View>

        {post.images.length ? (
          <View className="post-detail__image-grid">
            {post.images.slice(0, 3).map((image, index) => (
              <Image className={`post-detail__image ${index === 0 ? 'post-detail__image--main' : ''}`} key={image} src={image} mode="aspectFill" />
            ))}
          </View>
        ) : null}

        <View className="post-detail__content-block">
          <View className="post-detail__tags">
            {post.topicTags.slice(0, 3).map((tag) => (
              <Text className="post-detail__tag" key={tag}># {tag}</Text>
            ))}
          </View>
          <Text className="post-detail__title">{post.content.split('\n')[0] || '宠物日常'}</Text>
          <Text className="post-detail__content">{post.content}</Text>
        </View>

        <View className="post-detail__interaction-bar">
          <View className="post-detail__counts">
            <View className={`post-detail__count ${post.liked ? 'post-detail__count--liked' : ''}`} onClick={toggleLike}>
              <View className="post-detail__count-icon post-action-icon post-action-icon--heart ui-icon ui-icon--heart" />
              <Text>{post.likeCount}</Text>
            </View>
            <View className="post-detail__count">
              <View className="post-detail__count-icon post-action-icon post-action-icon--comment ui-icon ui-icon--comment" />
              <Text>{post.commentCount}</Text>
            </View>
            <View className="post-detail__count">
              <View className="post-detail__count-icon post-action-icon post-action-icon--share ui-icon ui-icon--share" />
              <Text>分享</Text>
            </View>
          </View>
          <View className="post-detail__dots">
            <Text />
            <Text />
            <Text />
          </View>
        </View>
      </View>

      <View className="post-detail__tools">
        <Button className="post-detail__ghost" onClick={() => navigateTo({ url: `/subpackages/settings/report/index?targetType=post&targetId=${post.id}` })}>举报动态</Button>
        {!isOwnedByCurrentUser(post.userId, currentUserId) ? <Button className="post-detail__block" onClick={blockAuthor}>拉黑作者</Button> : null}
        {isOwnedByCurrentUser(post.userId, currentUserId) ? <Button className="post-detail__danger" onClick={deletePost}>删除动态</Button> : null}
      </View>

      <View className="comment-box">
        <Text className="comment-box__title">友好评论 ({comments.length})</Text>
        {comments.length ? comments.map((comment) => (
          <View className="comment-item" key={comment.id}>
            <Image className="comment-item__avatar" src={comment.pet?.avatarUrl || ''} mode="aspectFill" />
            <View className="comment-item__main">
              <View className="post-detail__comment-bubble">
                <View className="comment-item__heading">
                  <Text className="comment-item__name">{comment.pet?.name || '宠友'}</Text>
                  <Text className="comment-item__time">{relativeTime(comment.createdAt)}</Text>
                </View>
                <Text className="comment-item__content">{comment.content}</Text>
              </View>
              <View className="comment-item__actions">
                <Text onClick={() => navigateTo({ url: `/subpackages/settings/report/index?targetType=comment&targetId=${comment.id}` })}>举报评论</Text>
                {canDeleteComment({ commentUserId: comment.userId, postUserId: post.userId, currentUserId }) ? (
                  <Text className="comment-item__delete" onClick={() => deleteComment(comment.id)}>删除</Text>
                ) : null}
              </View>
            </View>
          </View>
        )) : <EmptyState title="还没有评论" description="说一句轻松友好的回应吧。" />}
      </View>

      <View className="post-detail__bottom-input safe-bottom">
        <Input className="comment-input__field" value={content} placeholder="说点友好的回应..." onInput={(event) => setContent(event.detail.value)} />
        <View
          className={`comment-input__send ui-button ui-button--primary ${commenting ? 'comment-input__send--disabled' : ''}`}
          onClick={submitComment}
        >
          {commenting ? '发送中' : '发送'}
        </View>
      </View>
    </View>
  )
}
