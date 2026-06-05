import { useState } from 'react'
import { Button, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AppBar, IconButton } from '../../components/ui'
import { useAppStore } from '../../store/appStore'
import { backOrHome } from '../../utils/navigation'

const stickers = ['#社牛小钢炮', '#E狗出没', '#今天超乖', '#求搭子']

export default function StickerEditPage() {
  const draftStickers = useAppStore((s) => s.draftStickers)
  const setDraftStickers = useAppStore((s) => s.setDraftStickers)
  const [selected, setSelected] = useState<string[]>(
    draftStickers.length > 0 ? draftStickers : [stickers[0]],
  )

  const toggle = (sticker: string) => {
    setSelected((current) =>
      current.includes(sticker)
        ? current.filter((s) => s !== sticker)
        : [...current, sticker],
    )
  }

  const apply = () => {
    setDraftStickers(selected)
    Taro.showToast({ title: '贴纸已应用', icon: 'success' })
    backOrHome('/pages/post-flow/index')
  }

  return (
    <View className='app-screen'>
      <AppBar title='贴纸编辑' left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/feed/index')} />} />
      <View className='app-content' style='padding:20px;'>
        <View className='sticker-preview'>
          <Text className='post-sticker'>{selected[0] ?? stickers[0]}</Text>
        </View>

        <Text style='display:block;font-size:18px;font-weight:900;margin:20px 0 12px;'>选择贴纸</Text>
        <View className='tag-grid'>
          {stickers.map((sticker) => (
            <Text
              className={selected.includes(sticker) ? 'tag-btn tag-btn-active' : 'tag-btn'}
              key={sticker}
              onClick={() => toggle(sticker)}
            >
              {sticker}
            </Text>
          ))}
        </View>
      </View>

      <View className='footer-actions'>
        <Button className='primary-button' type='primary' onClick={apply}>
          应用贴纸
        </Button>
      </View>
    </View>
  )
}
