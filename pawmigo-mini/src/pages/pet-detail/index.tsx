import { Button, Text, View } from '@tarojs/components'
import { AppBar, IconButton } from '../../components/ui'
import { backOrHome, openPage } from '../../utils/navigation'

export default function PetDetailPage() {
  return (
    <View className='app-screen'>
      <AppBar
        title='宠物档案'
        left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/map/index')} />}
        right={<IconButton icon='shield' tone='yellow' onClick={() => openPage('/pages/safety-center/index')} />}
      />

      <View className='app-content'>
        <View className='pet-hero'>
          <View className='pet-name-card'>
            <Text style='font-size:32px;font-weight:900;'>布丁 · 金毛</Text>
            <View className='row' style='gap:8px;margin-top:8px;'>
              <Text className='tag tag-yellow'>约 300m</Text>
              <Text className='tag tag-blue'>正在遛 (12min)</Text>
            </View>
          </View>
        </View>

        <View className='card' style='margin-top:-20px;position:relative;z-index:10;'>
          <View className='row' style='gap:8px;margin-bottom:16px;'>
            <Text className='eyebrow' style='background:#4ade80;'>已实名认证</Text>
            <Text className='eyebrow' style='background:#22d3ee;'>接受偶遇</Text>
          </View>
          <Text style='font-weight:600;line-height:1.6;'>
            布丁是个“社牛”金毛，特别喜欢追飞盘。如果你也在滨江公园附近，快来和我们偶遇吧！
          </Text>
          <View className='tag-grid' style='margin-top:16px;'>
            {['性格温顺', '爱接飞盘', '运动健将', '社牛'].map((tag) => (
              <Text className='tag' key={tag}>{tag}</Text>
            ))}
          </View>
        </View>

        <View className='info-grid'>
          {[
            ['宠物性别', '小男生'],
            ['宠物年龄', '2 岁'],
            ['宠物体型', '中大型'],
            ['共同队伍', '滨江金毛团'],
          ].map(([label, value]) => (
            <View className='info-item' key={label}>
              <Text className='text-xs text-muted'>{label}</Text>
              <Text style='display:block;font-weight:800;font-size:18px;margin-top:4px;'>{value}</Text>
            </View>
          ))}
        </View>

        <View className='card' style='background:#f8fafc;border-style:dashed;'>
          <Text style='font-size:16px;font-weight:900;margin-bottom:12px;display:block;'>安全提醒</Text>
          <Text className='text-sm text-muted' style='font-weight:600;line-height:1.8;'>
            位置已进行 200m 级脱敏处理。建议选择公园等公共开放地点集合。若有异常，请使用右上方举报入口。
          </Text>
        </View>
      </View>

      <View className='action-bar-fixed'>
        <Button className='secondary-button' style='flex:1;' onClick={() => openPage('/pages/profile/index')}>
          查看主页
        </Button>
        <Button
          className='primary-button'
          type='primary'
          style='flex:2;'
          onClick={() => openPage('/pages/encounter-waiting/index')}
        >
          邀请一起遛
        </Button>
      </View>
    </View>
  )
}
