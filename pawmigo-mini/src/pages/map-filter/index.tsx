import { useState } from 'react'
import { Button, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AppIcon } from '../../components/icons'
import { AppBar, IconButton } from '../../components/ui'
import { backOrHome, openPage } from '../../utils/navigation'
import type { DogSize } from '../../services/api'

const personalityFilters = ['社牛', '慢热', '运动健将', '贴贴怪', '球控', '亲人']
const sizeFilters: Array<{ label: string; value: DogSize }> = [
  { label: '小型犬', value: '小型' },
  { label: '中型犬', value: '中型' },
  { label: '大型犬', value: '大型' },
]

export default function MapFilterPage() {
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedSize, setSelectedSize] = useState<DogSize | '全部'>('全部')

  const toggleTag = (tag: string) => {
    setSelectedTags((current) => (
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag]
    ))
  }

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (selectedSize !== '全部') params.set('size', selectedSize)
    if (selectedTags.length > 0) params.set('personality', selectedTags.join(','))
    const qs = params.toString()
    Taro.showToast({ title: '筛选已应用', icon: 'success' })
    openPage(`/pages/map/index${qs ? `?${qs}` : ''}`, { replace: true })
  }

  return (
    <View className='app-screen page-with-action-bar'>
      <AppBar title='地图筛选' left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/map/index')} />} />
      <View className='app-content content-compact'>
        <View className='card info-card-blue'>
          <View className='row row-gap-md map-filter-head'>
            <AppIcon name='map-pin' />
            <Text className='text-subtitle'>附近发现规则</Text>
          </View>
          <Text className='text-body'>
            优先显示正在遛、接受偶遇、资料完整的宠物伙伴，距离仅展示模糊范围。
          </Text>
        </View>

        <Text style='display:block;font-size:16px;font-weight:900;margin:16px 0 8px;'>宠物体型</Text>
        <View className='tag-grid'>
          <View
            className={selectedSize === '全部' ? 'tag-btn tag-btn-active' : 'tag-btn'}
            onClick={() => setSelectedSize('全部')}
          >
            <Text>不限</Text>
          </View>
          {sizeFilters.map((s) => (
            <View
              className={selectedSize === s.value ? 'tag-btn tag-btn-active' : 'tag-btn'}
              key={s.value}
              onClick={() => setSelectedSize(selectedSize === s.value ? '全部' : s.value)}
            >
              <Text>{s.label}</Text>
            </View>
          ))}
        </View>

        <Text style='display:block;font-size:16px;font-weight:900;margin:16px 0 8px;'>性格标签</Text>
        <View className='tag-grid'>
          {personalityFilters.map((tag) => (
            <View
              className={selectedTags.includes(tag) ? 'tag-btn tag-btn-active' : 'tag-btn'}
              key={tag}
              onClick={() => toggleTag(tag)}
            >
              <Text>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
      <View className='footer-actions'>
        <Button className='primary-button' type='primary' onClick={applyFilters}>
          应用筛选
        </Button>
      </View>
    </View>
  )
}
