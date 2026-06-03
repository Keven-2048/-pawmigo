import { Button, Text, View } from '@tarojs/components'
import { AppIcon } from '../../components/icons'
import { AppBar, IconButton } from '../../components/ui'
import { backOrHome, openPage } from '../../utils/navigation'

const tags = ['守时', '友好', '宠物温顺', '公共场地安全']

export default function EncounterFeedbackPage() {
  return (
    <View className='app-screen'>
      <AppBar title='偶遇反馈' left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/encounter-ongoing/index')} />} />

      <View className='app-content' style='padding:24px 20px;'>
        <View className='text-center'>
          <Text className='eyebrow'>偶遇完成</Text>
          <Text style='display:block;font-size:30px;font-weight:900;margin-top:10px;'>这次体验怎么样？</Text>
        </View>

        <View className='rating-row'>
          {[1, 2, 3, 4, 5].map((item) => (
            <View className='rating-star' key={item}><AppIcon name='star' /></View>
          ))}
        </View>

        <View className='tag-grid'>
          {tags.map((tag) => (
            <Text className='tag-btn tag-btn-active' key={tag}>{tag}</Text>
          ))}
        </View>

        <View className='card' style='background:#f8fafc;margin:24px 0;'>
          <Text style='display:block;font-size:17px;font-weight:900;margin-bottom:10px;'>奖励已到账</Text>
          <Text className='text-sm text-muted' style='font-weight:700;'>提交反馈后，你将获得 12 根骨头。</Text>
        </View>
      </View>

      <View className='footer-actions'>
        <Button className='primary-button' type='primary' onClick={() => openPage('/pages/wallet/index', { replace: true })}>
          提交反馈
        </Button>
      </View>
    </View>
  )
}
