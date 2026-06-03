import { Button, Input, Text, View } from '@tarojs/components'
import { AppIcon } from '../../components/icons'
import { AppBar, IconButton } from '../../components/ui'
import { backOrHome, openPage } from '../../utils/navigation'

const messages = [
  ['布丁家长', '我们已经到中央草坪入口啦。', 'left'],
  ['我', '收到，我还有 120m。', 'right'],
]

export default function ChatPage() {
  return (
    <View className='app-screen'>
      <AppBar
        title='偶遇消息'
        left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/encounter-ongoing/index')} />}
        right={<IconButton icon='shield' tone='yellow' onClick={() => openPage('/pages/safety-center/index')} />}
      />
      <View className='app-content' style='padding:20px;'>
        <View className='card' style='background:#facc15;margin:0 0 20px;'>
          <View className='row' style='gap:12px;'>
            <AppIcon name='map-pin' />
            <View className='stack' style='gap:2px;'>
              <Text style='font-size:17px;font-weight:900;'>滨江公园 · 中央草坪入口</Text>
              <Text className='text-xs text-muted'>预计 3 分钟后到达</Text>
            </View>
          </View>
        </View>

        {messages.map(([name, body, side]) => (
          <View className={side === 'right' ? 'chat-bubble chat-bubble-right' : 'chat-bubble'} key={`${name}-${body}`}>
            <Text className='text-xs text-muted'>{name}</Text>
            <Text style='display:block;font-size:15px;font-weight:800;margin-top:4px;'>{body}</Text>
          </View>
        ))}
      </View>
      <View className='chat-input-bar'>
        <Input className='input' placeholder='发送安全简短消息' />
        <Button className='primary-button' type='primary' onClick={() => openPage('/pages/encounter-ongoing/index', { replace: true })}>
          发送
        </Button>
      </View>
    </View>
  )
}
