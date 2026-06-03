import { Button, Text, Textarea, View } from '@tarojs/components'
import { AppIcon } from '../../components/icons'
import { AppBar, IconButton } from '../../components/ui'
import { backOrHome, openPage } from '../../utils/navigation'

export default function PostFlowPage() {
  return (
    <View className='app-screen'>
      <AppBar title='发布动态' left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/feed/index')} />} right={<IconButton icon='edit' tone='yellow' onClick={() => openPage('/pages/sticker-edit/index')} />} />
      <View className='app-content' style='padding:20px;'>
        <View className='post-upload'>
          <AppIcon name='plus' className='upload-icon' />
          <Text style='font-weight:900;'>添加照片或视频</Text>
        </View>

        <View className='form-group'>
          <Text className='label-text'>这一刻想说什么</Text>
          <Textarea className='textarea' placeholder='分享今天的遛遛瞬间...' />
        </View>

        <View className='row' style='gap:10px;flex-wrap:wrap;'>
          <Text className='tag tag-yellow'>#社牛小钢炮</Text>
          <Text className='tag tag-blue'>滨江公园</Text>
          <Text className='tag'>可偶遇</Text>
        </View>
      </View>

      <View className='footer-actions'>
        <Button className='primary-button' type='primary' onClick={() => openPage('/pages/feed/index', { replace: true })}>
          发布
        </Button>
      </View>
    </View>
  )
}
