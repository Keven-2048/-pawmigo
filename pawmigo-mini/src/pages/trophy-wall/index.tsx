import { Text, View } from '@tarojs/components'
import { AppIcon } from '../../components/icons'
import { AppBar, IconButton, MainNav } from '../../components/ui'
import { backOrHome } from '../../utils/navigation'

const trophies = ['连续遛弯 7 天', '安全反馈达人', '社牛毛孩子', '队伍活跃王', '投喂小能手']

export default function TrophyWallPage() {
  return (
    <View className='app-screen'>
      <AppBar title='荣誉奖杯墙' left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/profile/index')} />} />
      <View className='app-content' style='padding:20px;'>
        <View className='trophy-grid'>
          {trophies.map((trophy, index) => (
            <View className='trophy' key={trophy} style={index % 2 === 0 ? 'background:#facc15;' : 'background:#22d3ee;'}>
              <AppIcon name='trophy' />
              <Text style='display:block;margin-top:10px;font-size:13px;'>{trophy}</Text>
            </View>
          ))}
        </View>
      </View>
      <MainNav active='profile' />
    </View>
  )
}
