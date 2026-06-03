import { Button, Text, View } from '@tarojs/components'
import { AppIcon } from '../../components/icons'
import { AppBar, IconButton } from '../../components/ui'
import { backOrHome, openPage } from '../../utils/navigation'

const filters = ['正在遛', '可偶遇', '已认证', '路线重合', '300m 内', '性格温顺']

export default function MapFilterPage() {
  return (
    <View className='app-screen'>
      <AppBar title='地图筛选' left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/map/index')} />} />
      <View className='app-content' style='padding:20px;'>
        <View className='card' style='background:#22d3ee;margin:0 0 20px;'>
          <View className='row' style='gap:12px;margin-bottom:12px;'>
            <AppIcon name='map-pin' />
            <Text style='font-size:24px;font-weight:900;'>附近发现规则</Text>
          </View>
          <Text style='font-weight:800;line-height:1.7;'>
            优先显示正在遛、接受偶遇、资料完整的宠物伙伴，距离仅展示模糊范围。
          </Text>
        </View>

        <View className='tag-grid'>
          {filters.map((filter, index) => (
            <View className={index < 3 ? 'tag-btn tag-btn-active' : 'tag-btn'} key={filter}>
              <Text>{filter}</Text>
            </View>
          ))}
        </View>
      </View>
      <View className='footer-actions'>
        <Button className='primary-button' type='primary' onClick={() => openPage('/pages/map/index', { replace: true })}>
          应用筛选
        </Button>
      </View>
    </View>
  )
}
