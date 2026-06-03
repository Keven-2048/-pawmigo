import { Button, Text, View } from '@tarojs/components'
import { AppBar, IconButton } from '../../components/ui'
import { backOrHome, openPage } from '../../utils/navigation'

const matches = [
  ['布丁', '金毛 · 300m', '#22d3ee'],
  ['大福', '柴犬 · 500m', '#facc15'],
  ['奶盖', '比熊 · 650m', '#fb7185'],
]

export default function MatchResultsPage() {
  return (
    <View className='app-screen'>
      <AppBar title='匹配结果' left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/encounter/index')} />} />
      <View className='app-content' style='padding:20px;'>
        {matches.map(([name, meta, color]) => (
          <View className='match-result-card' key={name}>
            <View className='match-avatar' style={`background:${color};`}><Text>{name.slice(0, 1)}</Text></View>
            <View className='stack' style='gap:4px;flex:1;'>
              <Text style='font-size:22px;font-weight:900;'>{name}</Text>
              <Text className='text-sm text-muted' style='font-weight:800;'>{meta}</Text>
            </View>
            <Button className='primary-button' type='primary' onClick={() => openPage('/pages/encounter-waiting/index', { replace: true })}>
              邀请
            </Button>
          </View>
        ))}
      </View>
    </View>
  )
}
