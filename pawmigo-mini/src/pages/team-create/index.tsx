import { Button, Input, Text, View } from '@tarojs/components'
import { AppBar, IconButton } from '../../components/ui'
import { backOrHome, openPage } from '../../utils/navigation'

export default function TeamCreatePage() {
  return (
    <View className='app-screen'>
      <AppBar title='创建队伍' left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/team/index')} />} />
      <View className='app-content' style='padding:20px;'>
        <View className='form-group'>
          <Text className='label-text'>队伍名称</Text>
          <Input className='input' placeholder='例如：滨江柯基冲锋队' />
        </View>
        <View className='form-group'>
          <Text className='label-text'>队伍类型</Text>
          <View className='tag-grid'>
            {['品种团', '地点团', '性格团', '活动团'].map((tag, index) => (
              <View className={index === 1 ? 'tag-btn tag-btn-active' : 'tag-btn'} key={tag}><Text>{tag}</Text></View>
            ))}
          </View>
        </View>
        <View className='form-group'>
          <Text className='label-text'>常驻集合点</Text>
          <Input className='input' placeholder='例如：幸福小区中心广场' />
        </View>
      </View>
      <View className='footer-actions'>
        <Button className='primary-button' type='primary' onClick={() => openPage('/pages/team-detail/index', { replace: true })}>
          创建并查看
        </Button>
      </View>
    </View>
  )
}
