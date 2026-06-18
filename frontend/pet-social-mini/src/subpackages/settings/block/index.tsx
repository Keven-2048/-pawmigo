import { useEffect, useState } from 'react'
import { navigateBack } from '@tarojs/taro'
import { Image, Text, View } from '@tarojs/components'
import { MOCK_IMAGES } from '@/constants/assets'
import { EmptyState } from '@/components/EmptyState'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { blockService } from '@/services'
import type { Block } from '@/types/domain'
import { shortDateTime } from '@/utils/format'
import { showToast } from '@/utils/navigation'
import './index.scss'

export default function BlockPage() {
  const ready = useAuthGuard()
  const [blocks, setBlocks] = useState<Block[]>([])

  const loadBlocks = async () => {
    try {
      setBlocks(await blockService.list())
    } catch (error) {
      showToast(error instanceof Error ? error.message : '黑名单加载失败')
    }
  }

  useEffect(() => {
    if (!ready) return
    loadBlocks()
  }, [ready])

  if (!ready) {
    return (
      <View className="page block-page">
        <EmptyState title="正在进入黑名单" />
      </View>
    )
  }

  return (
    <View className="page block-page">
      <View className="block-page__topbar">
        <View className="block-page__back ui-icon ui-icon--back" onClick={() => navigateBack()} />
        <Text className="block-page__title">黑名单管理</Text>
        <View className="block-page__spacer" />
      </View>

      <View className="block-safety-card card">
        <View className="block-safety-card__icon ui-icon ui-icon--block" />
        <View className="block-safety-card__copy">
          <Text className="block-safety-card__title">保持边界，安静相处</Text>
          <Text className="block-safety-card__desc">拉黑后双方互相不可见，不能互相邀请、评论或关注。</Text>
        </View>
      </View>

      {blocks.length ? (
        <View className="block-list">
          {blocks.map((block) => (
            <View className="block-item" key={block.id}>
              <View className="block-item__avatar">
                <Image className="block-item__avatar-image" src={MOCK_IMAGES.owner} mode="aspectFill" />
                <View className="block-item__avatar-mask ui-icon ui-icon--block" />
              </View>
              <View className="block-item__copy">
                <View className="block-item__title-row">
                  <Text className="block-item__title">已屏蔽的宠友</Text>
                  <Text className="block-item__status">已屏蔽</Text>
                </View>
                <Text className="block-item__desc">{block.reason || '未填写原因'} · {shortDateTime(block.createdAt)}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View className="block-empty">
          <Image className="block-empty__photo" src={MOCK_IMAGES.hero} mode="aspectFill" />
          <EmptyState title="黑名单为空" description="你拉黑的用户会在这里显示。" />
        </View>
      )}
    </View>
  )
}
