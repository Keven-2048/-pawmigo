import { Button, Text, View } from '@tarojs/components'
import { AppBar, IconButton } from '../../components/ui'
import { backOrHome, openPage } from '../../utils/navigation'

export default function TeamDetailPage() {
  return (
    <View className='app-screen'>
      <AppBar
        title='队伍详情'
        left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/team/index')} />}
        right={<IconButton icon='plus' tone='yellow' onClick={() => openPage('/pages/team-create/index')} />}
      />
      <View className='app-content' style='padding:0;'>
        <View className='team-hero'>
          <Text className='eyebrow'>地点团</Text>
          <Text style='display:block;font-size:34px;font-weight:900;'>幸福社区毛孩子集合</Text>
          <Text style='display:block;margin-top:10px;font-weight:800;'>128 犬活跃 · 每晚 19:30</Text>
        </View>

        <View className='card' style='margin-top:-18px;position:relative;z-index:3;'>
          <Text style='display:block;font-size:18px;font-weight:900;margin-bottom:10px;'>队伍公告</Text>
          <Text className='text-sm text-muted' style='font-weight:700;line-height:1.8;'>
            今晚集合点调整到中心广场喷泉旁，首次加入请先完成宠物资料和安全确认。
          </Text>
        </View>

        <View className='card'>
          <View className='row-between'>
            <Text style='font-size:18px;font-weight:900;'>活跃成员</Text>
            <Text className='tag tag-blue'>12 在线</Text>
          </View>
          <View className='member-row'>
            {['球', '布', '豆', '奶', '福'].map((item) => (
              <View className='member-avatar' key={item}><Text>{item}</Text></View>
            ))}
          </View>
        </View>
      </View>

      <View className='footer-actions'>
        <Button className='primary-button' type='primary' onClick={() => openPage('/pages/team/index', { replace: true })}>
          加入队伍
        </Button>
      </View>
    </View>
  )
}
