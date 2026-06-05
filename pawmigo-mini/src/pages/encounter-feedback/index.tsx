import { useEffect, useState } from 'react'
import { Button, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AppIcon } from '../../components/icons'
import { AppBar, IconButton } from '../../components/ui'
import { api, EncounterCandidate } from '../../services/api'
import { useEncounterStore } from '../../store/encounterStore'
import { backOrHome, getRouterParam, openPage } from '../../utils/navigation'

const tags = ['守时', '友好', '宠物温顺', '公共场地安全']

export default function EncounterFeedbackPage() {
  const id = Number(getRouterParam('id')) || 0
  const [rating, setRating] = useState(5)
  const [selectedTags, setSelectedTags] = useState(tags)
  const [candidate, setCandidate] = useState<EncounterCandidate | null>(null)

  useEffect(() => {
    api.getCandidates('radar').then((list) => {
      setCandidate(list.find((c) => c.id === id) || list[0])
    }).catch(() => {})
  }, [id])

  const toggleTag = (tag: string) => {
    setSelectedTags((current) => (
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag]
    ))
  }

  const submit = () => {
    // Complete the journey: submit feedback, award bones, clear active encounter.
    useEncounterStore.getState().complete(rating, selectedTags).then(() => {
      Taro.showToast({ title: '反馈已提交', icon: 'success' })
      openPage('/pages/map/index', { replace: true })
    }).catch(() => {
      Taro.showToast({ title: '提交失败，请重试', icon: 'none' })
    })
  }

  return (
    <View className='app-screen page-with-action-bar'>
      <AppBar
        title='偶遇反馈'
        left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/encounter-ongoing/index')} />}
      />

      <View className='app-content' style='padding:0;'>
        <View className='feedback-hero'>
          <View className='avatar-circle avatar-circle-sm'>
            <AppIcon name='dog' />
          </View>
          <Text className='feedback-hero-title'>今天遛得怎么样？</Text>
          {candidate && (
            <Text className='text-sm' style='font-weight:800;display:block;margin-top:4px;'>{candidate.name} & 它的主人</Text>
          )}

          <View className='rating-row'>
            {[1, 2, 3, 4, 5].map((item) => (
              <View
                className={item <= rating ? 'rating-bone rating-bone-active' : 'rating-bone'}
                key={item}
                onClick={() => setRating(item)}
              >
                <AppIcon name='bone' color={item <= rating ? '#000000' : '#6b7280'} />
              </View>
            ))}
          </View>
        </View>

        <View style='padding:24px 20px;'>
          <View className='eyebrow' style='background:#22d3ee;'>关系沉淀</View>
          <Text className='feedback-title' style='margin-bottom:20px;'>记录这次愉快的邂逅</Text>

          <View className='action-grid-2x2'>
            <Button className='btn-action-card' onClick={() => Taro.showToast({ title: '已关注', icon: 'success' })}>
              <AppIcon name='heart' />
              <Text className='action-card-label'>关注 TA</Text>
            </Button>
            <Button className='btn-action-card btn-action-card-rose' onClick={() => openPage('/pages/post-flow/index')}>
              <AppIcon name='plus' />
              <Text className='action-card-label'>发动态</Text>
            </Button>
            <Button className='btn-action-card' onClick={() => Taro.showToast({ title: '已赠送 1 根骨头', icon: 'success' })}>
              <AppIcon name='bone' />
              <Text className='action-card-label'>赠送骨头</Text>
            </Button>
            <Button className='btn-action-card btn-action-card-cyan' onClick={() => openPage('/pages/team/index')}>
              <AppIcon name='team' />
              <Text className='action-card-label'>推荐队伍</Text>
            </Button>
          </View>

          <View className='card' style='margin:20px 0;'>
            <View className='row-between'>
              <View className='stack' style='gap:4px;'>
                <Text style='font-size:14px;font-weight:900;'>标记为"准时/友好"</Text>
                <Text className='text-xs text-muted'>提升双方的宠友信用度</Text>
              </View>
              <View className='safety-dot safety-dot-ok' style='width:24px;height:24px;border-radius:4px;' />
            </View>
          </View>
        </View>
      </View>

      <View className='action-bar-fixed'>
        <Button className='primary-button' type='primary' onClick={submit}>
          完成并回到主页
        </Button>
      </View>
    </View>
  )
}
