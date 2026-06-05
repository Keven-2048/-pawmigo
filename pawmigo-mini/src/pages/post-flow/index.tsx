import { useState } from 'react'
import { Button, Text, Textarea, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AppIcon } from '../../components/icons'
import { AppBar, IconButton } from '../../components/ui'
import { api, MediaTone } from '../../services/api'
import { useAppStore } from '../../store/appStore'
import { backOrHome, openPage } from '../../utils/navigation'

export default function PostFlowPage() {
  const [content, setContent] = useState('')
  const [hasMedia, setHasMedia] = useState(false)
  const [loading, setLoading] = useState(false)
  const draftStickers = useAppStore((s) => s.draftStickers)
  const setDraftStickers = useAppStore((s) => s.setDraftStickers)
  const canSubmit = hasMedia || content.trim().length > 0

  const submit = () => {
    if (!canSubmit) {
      Taro.showToast({ title: '请添加照片或写点内容', icon: 'none' })
      return
    }

    setLoading(true)
    api.createPost({
      caption: content,
      location: '附近',
      mediaTone: 'park' as MediaTone,
      stickers: draftStickers.length > 0 ? draftStickers : ['今日上墙'],
    }).then(() => {
      setDraftStickers([]) // consume the draft so the next post starts clean
      Taro.showToast({ title: '已发布', icon: 'success' })
      openPage('/pages/feed/index', { replace: true })
    }).catch(() => {
      Taro.showToast({ title: '发布失败，请重试', icon: 'none' })
    }).finally(() => {
      setLoading(false)
    })
  }

  return (
    <View className='app-screen page-with-action-bar'>
      <AppBar title='发布动态' left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/feed/index')} />} right={<IconButton icon='edit' tone='yellow' onClick={() => openPage('/pages/sticker-edit/index')} />} />
      <View className='app-content content-compact'>
        <View
          className={hasMedia ? 'post-upload post-upload-ready' : 'post-upload'}
          onClick={() => {
            setHasMedia(true)
            Taro.showToast({ title: '已添加演示照片', icon: 'none' })
          }}
        >
          <AppIcon name={hasMedia ? 'camera' : 'plus'} className='upload-icon' />
          <Text className='text-label'>{hasMedia ? '已添加 1 张照片' : '添加照片或视频'}</Text>
        </View>

        <View className='form-group'>
          <Text className='label-text'>这一刻想说什么</Text>
          <Textarea
            className='textarea'
            placeholder='分享今天的遛遛瞬间...'
            value={content}
            adjustPosition={false}
            onInput={(event) => setContent(event.detail.value)}
          />
        </View>

        <View className='chip-row'>
          {draftStickers.length > 0
            ? draftStickers.map((s) => <Text className='tag tag-yellow' key={s}>{s}</Text>)
            : <Text className='tag tag-yellow'>#社牛小钢炮</Text>}
          <Text className='tag tag-blue'>滨江公园</Text>
          <Text className='tag'>可偶遇</Text>
        </View>
      </View>

      <View className='footer-actions'>
        <Button
          className={canSubmit && !loading ? 'primary-button' : 'primary-button button-disabled'}
          type={canSubmit && !loading ? 'primary' : 'default'}
          disabled={!canSubmit || loading}
          loading={loading}
          onClick={submit}
        >
          发布
        </Button>
      </View>
    </View>
  )
}
