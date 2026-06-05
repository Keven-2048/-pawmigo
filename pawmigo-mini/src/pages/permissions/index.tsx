import { Button, Text, View } from '@tarojs/components'
import { AppIcon, IconName } from '../../components/icons'
import { openPage } from '../../utils/navigation'

const permissions = [
  { icon: 'map-pin', tone: '#22d3ee', title: '精确定位', desc: '仅展示模糊距离和近似位置，绝不暴露你的精确坐标。' },
  { icon: 'bell', tone: '#facc15', title: '消息通知', desc: '用于接收偶遇邀请和队伍活动提醒，不错过任何遛弯机会。' },
  { icon: 'camera', tone: '#fb7185', title: '相机与相册', desc: '用于发布宠物动态和编辑个人主页，展示毛孩子的萌照。' },
] satisfies Array<{ icon: IconName; tone: string; title: string; desc: string }>

export default function PermissionsPage() {
  const goMap = () => openPage('/pages/map/index', { replace: true })

  return (
    <View className='app-screen'>
      <View className='app-content permissions-content'>
        <Text className='title'>开启全功能体验</Text>
        <Text className='muted permissions-lead'>
          为了让你和毛孩子能顺利偶遇，我们需要以下权限：
        </Text>

        {permissions.map((item) => (
          <View className='perm-card' key={item.title}>
            <View className='info-card-icon' style={`background:${item.tone};margin:0;width:44px;height:44px;`}>
              <AppIcon name={item.icon} />
            </View>
            <View className='perm-card-body'>
              <Text className='perm-title'>{item.title}</Text>
              <Text className='perm-desc'>{item.desc}</Text>
            </View>
          </View>
        ))}

        <View style='margin-top:40px;'>
          <Button className='primary-button' type='primary' onClick={goMap}>全部允许并继续</Button>
          <Button className='secondary-button' style='margin-top:16px;' onClick={goMap}>暂不开启</Button>
        </View>
      </View>
    </View>
  )
}
