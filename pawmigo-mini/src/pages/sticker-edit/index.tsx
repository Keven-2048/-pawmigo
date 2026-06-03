import { Button, Text, View } from '@tarojs/components'
import { AppBar, IconButton } from '../../components/ui'
import { backOrHome } from '../../utils/navigation'

const stickers = ['#社牛小钢炮', '#E狗出没', '#今天超乖', '#求搭子']

export default function StickerEditPage() {
  return (
    <View className='app-screen'>
      <AppBar title='贴纸编辑' left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/feed/index')} />} />
      <View className='app-content' style='padding:20px;'>
        <View className='sticker-preview'>
          <Text className='post-sticker'>#社牛小钢炮</Text>
        </View>

        <Text style='display:block;font-size:18px;font-weight:900;margin:20px 0 12px;'>选择贴纸</Text>
        <View className='tag-grid'>
          {stickers.map((sticker, index) => (
            <Text className={index === 0 ? 'tag-btn tag-btn-active' : 'tag-btn'} key={sticker}>{sticker}</Text>
          ))}
        </View>
      </View>

      <View className='footer-actions'>
        <Button className='primary-button' type='primary' onClick={() => backOrHome('/pages/feed/index')}>
          应用贴纸
        </Button>
      </View>
    </View>
  )
}
