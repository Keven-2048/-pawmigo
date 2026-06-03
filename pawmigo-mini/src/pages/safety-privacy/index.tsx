import { Text, View } from '@tarojs/components'
import { AppBar, IconButton } from '../../components/ui'
import { backOrHome } from '../../utils/navigation'

const items = [
  ['实时位置', '仅用于匹配，不写入 MySQL'],
  ['距离展示', '统一脱敏为约 200m 精度'],
  ['集合建议', '优先公共开放场地'],
  ['异常处理', '支持拉黑、举报和紧急求助'],
]

export default function SafetyPrivacyPage() {
  return (
    <View className='app-screen'>
      <AppBar title='隐私与安全' left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/safety-center/index')} />} />
      <View className='app-content' style='padding:20px;'>
        <View className='card' style='background:#22d3ee;margin:0 0 20px;'>
          <Text className='eyebrow'>Safety First</Text>
          <Text style='display:block;font-size:30px;font-weight:900;'>位置只为偶遇服务</Text>
          <Text style='display:block;margin-top:10px;font-weight:800;'>真实坐标不公开展示，匹配结束后退出实时状态。</Text>
        </View>

        <View className='card' style='padding:0;overflow:hidden;'>
          {items.map(([title, meta]) => (
            <View className='safety-item' key={title}>
              <View className='stack' style='gap:4px;'>
                <Text style='font-size:17px;font-weight:900;'>{title}</Text>
                <Text className='text-xs text-muted'>{meta}</Text>
              </View>
              <Text className='tag tag-green'>已启用</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}
