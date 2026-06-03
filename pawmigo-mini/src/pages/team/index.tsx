import { Button, Input, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AppBar, IconButton, MainNav } from '../../components/ui'
import { openPage } from '../../utils/navigation'

const teams = [
  { type: '品种团', tone: '#fb7185', active: '45 犬活跃', title: '滨江柯基冲锋队', place: '常驻：滨江公园 · 南大门', button: '查看队伍', primary: false },
  { type: '地点团', tone: '#22d3ee', active: '128 犬活跃', title: '幸福社区毛孩子集合', place: '常驻：幸福小区 · 中心广场', button: '已加入', primary: true },
  { type: '性格团', tone: '#facc15', active: '12 犬活跃', title: 'i 狗互不打扰遛遛群', place: '常驻：各种清静绿道', button: '申请加入', primary: false },
]

export default function TeamPage() {
  return (
    <View className='app-screen'>
      <AppBar title='组队' right={<IconButton icon='plus' tone='yellow' onClick={() => openPage('/pages/team-create/index')} />} />

      <View className='app-content'>
        <View style='padding:20px;'>
          <Input className='input' placeholder='搜索兴趣队伍 / 品种 / 地点' />
        </View>

        {teams.map((team, index) => (
          <View
            className='card'
            style={index === 0 ? 'margin-top:0;' : ''}
            key={team.title}
            onClick={() => openPage('/pages/team-detail/index')}
          >
            <View className='row-between' style='margin-bottom:8px;'>
              <Text className='eyebrow' style={`background:${team.tone};`}>{team.type}</Text>
              <Text className='text-xs text-muted'>{team.active}</Text>
            </View>
            <Text style='font-size:20px;font-weight:900;margin-bottom:8px;display:block;'>{team.title}</Text>
            <Text className='text-muted text-xs' style='display:block;margin-bottom:16px;'>{team.place}</Text>
            <Button
              className={team.primary ? 'primary-button' : 'secondary-button'}
              type={team.primary ? 'primary' : 'default'}
              onClick={() => openPage('/pages/team-detail/index')}
            >
              {team.button}
            </Button>
          </View>
        ))}
      </View>

      <MainNav active='team' />
    </View>
  )
}
