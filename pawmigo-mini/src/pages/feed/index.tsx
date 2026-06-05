import { useEffect, useMemo, useState } from 'react'
import { Input, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AppIcon } from '../../components/icons'
import { ActionIconButton, AppBar, IconButton, MainNav } from '../../components/ui'
import { api, Comment, FeedPost } from '../../services/api'
import { backOrHome, openPage } from '../../utils/navigation'
import { useRequireAuth } from '../../utils/useRequireAuth'

export default function FeedPage() {
  useRequireAuth()
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [activeTab, setActiveTab] = useState('附近')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [openComments, setOpenComments] = useState<number | null>(null)
  const [commentsByPost, setCommentsByPost] = useState<Record<number, Comment[]>>({})
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({})

  const fetchPosts = () => {
    setLoading(true)
    setError(false)
    api.getFeed(activeTab).then((data) => {
      setPosts(data)
      setLoading(false)
    }).catch(() => {
      setError(true)
      setLoading(false)
    })
  }

  useEffect(() => {
    fetchPosts()
  }, [activeTab])

  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts
    const q = searchQuery.trim().toLowerCase()
    return posts.filter((p) =>
      p.petName.toLowerCase().includes(q) ||
      p.breed.toLowerCase().includes(q) ||
      p.caption.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q)
    )
  }, [posts, searchQuery])

  const handleLike = (id: number) => {
    api.likePost(id).then((updated) => {
      setPosts((prev) => prev.map((p) => (p.id === id ? updated : p)))
    })
  }

  const handleTip = (id: number) => {
    api.tipBone(id, 1).then((updated) => {
      setPosts((prev) => prev.map((p) => (p.id === id ? updated : p)))
      Taro.showToast({ title: '已投喂 1 根骨头 🦴', icon: 'success', duration: 1500 })
    }).catch((err) => {
      Taro.showToast({ title: err?.message || '投喂失败', icon: 'none' })
    })
  }

  const toggleComments = (postId: number) => {
    if (openComments === postId) {
      setOpenComments(null)
      return
    }
    setOpenComments(postId)
    if (!commentsByPost[postId]) {
      api.getComments(postId).then((list) => {
        setCommentsByPost((prev) => ({ ...prev, [postId]: list }))
      }).catch(() => {})
    }
  }

  const handleAddComment = (postId: number) => {
    const text = (commentDrafts[postId] || '').trim()
    if (!text) return
    api.addComment(postId, text).then((created) => {
      setCommentsByPost((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), created] }))
      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }))
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments: p.comments + 1 } : p)))
    }).catch(() => {
      Taro.showToast({ title: '评论失败，请重试', icon: 'none' })
    })
  }

  return (
    <View className='app-screen'>
      <AppBar
        title='圈子'
        left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/map/index')} />}
        right={<IconButton icon='plus' tone='yellow' onClick={() => openPage('/pages/post-flow/index')} />}
      />
      <View className='prototype-tabs'>
        {['关注', '附近', '热门', '同城'].map((tab) => (
          <View
            className={tab === activeTab ? 'prototype-tab prototype-tab-active' : 'prototype-tab'}
            key={tab}
            onClick={() => setActiveTab(tab)}
          >
            <Text>{tab}</Text>
          </View>
        ))}
      </View>

      <View className='feed-search-bar'>
        <View className='feed-search-input-wrap'>
          <AppIcon name='paw' className='feed-search-icon' />
          <Input
            className='feed-search-input'
            placeholder='搜索宠物、品种、内容...'
            value={searchQuery}
            onInput={(e) => setSearchQuery(e.detail.value)}
          />
          {searchQuery && (
            <View className='feed-search-clear' onClick={() => setSearchQuery('')}>
              <Text>✕</Text>
            </View>
          )}
        </View>
      </View>

      <View className='app-content content-flush page-with-bottom-nav'>
        {loading && (
          <View className='text-center' style='padding:60px 20px;'>
            <Text className='text-muted'>加载中...</Text>
          </View>
        )}
        {error && (
          <View className='text-center' style='padding:60px 20px;'>
            <Text className='text-muted' style='display:block;margin-bottom:12px;'>加载失败</Text>
            <Text className='tag tag-yellow' onClick={fetchPosts} style='cursor:pointer;'>点击重试</Text>
          </View>
        )}
        {!loading && !error && filteredPosts.length === 0 && (
          <View className='text-center' style='padding:60px 20px;'>
            <Text className='text-muted'>{searchQuery ? '未找到相关动态' : '暂无动态，发布第一条吧'}</Text>
          </View>
        )}
        {filteredPosts.map((post, index) => (
          <View className={index % 2 === 0 ? 'post post-tilt-right' : 'post post-tilt-left'} key={post.id}>
            <View className='post-header'>
              <View className='post-user'>
                <View className='post-avatar'><AppIcon name='dog' /></View>
                <View>
                  <Text className='post-user-name'>{post.petName}</Text>
                  <Text className='text-meta'>{post.time} · {post.location}</Text>
                </View>
              </View>
              <ActionIconButton icon='menu' label='更多' className='action-icon-button-ghost' />
            </View>
            <View className={`post-media media-${post.mediaTone}`} onClick={() => openPage(`/pages/pet-detail/index?id=${post.petId}`)}>
              <View className='post-media-sky' />
              <View className='post-media-ground' />
              <View className='post-media-pet'>
                <AppIcon name='dog' color='#000000' />
              </View>
              <AppIcon name='camera' color='#000000' className='post-media-icon' />
              <Text
                className='post-sticker'
                onClick={(event) => {
                  event.stopPropagation()
                  openPage('/pages/sticker-edit/index')
                }}
              >
                #{post.stickers[0]}
              </Text>
            </View>
            <View className='post-actions'>
              <View className='action-row row-gap-md'>
                <ActionIconButton
                  icon='heart'
                  label='点赞'
                  active={post.liked}
                  tone='rose'
                  onClick={() => handleLike(post.id)}
                />
                <ActionIconButton icon='message' label='评论' tone='cyan' active={openComments === post.id} onClick={() => toggleComments(post.id)} />
              </View>
              <View className='bone-action' onClick={() => handleTip(post.id)}>
                <AppIcon name='bone' />
                <Text>打赏</Text>
              </View>
            </View>
            <View className='post-body'>
              <Text className='post-likes'>{post.likes} 个赞 · {post.comments} 条评论 · {post.bones} 根骨头</Text>
              <Text className='post-caption'>
                <Text className='post-caption-name'>{post.petName}</Text> {post.caption}
              </Text>
            </View>
            {openComments === post.id && (
              <View className='comment-thread'>
                {(commentsByPost[post.id] || []).map((c) => (
                  <View className='comment-item' key={c.id}>
                    <Text className='comment-author'>{c.author}</Text>
                    <Text className='comment-text'>{c.text}</Text>
                    <Text className='comment-time'>{c.time}</Text>
                  </View>
                ))}
                {(commentsByPost[post.id] || []).length === 0 && (
                  <Text className='comment-empty'>还没有评论，来抢沙发</Text>
                )}
                <View className='comment-input-row'>
                  <Input
                    className='comment-input'
                    placeholder='友善地说点什么...'
                    value={commentDrafts[post.id] || ''}
                    adjustPosition={false}
                    onInput={(e) => setCommentDrafts((prev) => ({ ...prev, [post.id]: e.detail.value }))}
                    onConfirm={() => handleAddComment(post.id)}
                  />
                  <Text className='comment-send' onClick={() => handleAddComment(post.id)}>发送</Text>
                </View>
              </View>
            )}
          </View>
        ))}
      </View>

      <View className='fab-post' onClick={() => openPage('/pages/post-flow/index')}>
        <AppIcon name='plus' color='#ffffff' />
      </View>
      <MainNav active='feed' />
    </View>
  )
}
