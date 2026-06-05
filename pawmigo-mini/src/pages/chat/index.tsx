import { useEffect, useRef, useState } from 'react'
import { Button, Input, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AppIcon } from '../../components/icons'
import { AppBar, IconButton } from '../../components/ui'
import { api, ChatMessage, EncounterCandidate } from '../../services/api'
import { backOrHome, getRouterParam, openPage } from '../../utils/navigation'

export default function ChatPage() {
  const id = Number(getRouterParam('id')) || 0
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [candidate, setCandidate] = useState<EncounterCandidate | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      api.getChat(id).then(setMessages).catch(() => {}).finally(() => setLoading(false))
      api.getCandidates('radar').then((list) => {
        setCandidate(list.find((c) => c.id === id) || list[0])
      }).catch(() => {})
    } else {
      setLoading(false)
    }
  }, [id])

  const handleSend = () => {
    const msg = text.trim()
    if (!msg) return
    if (!id) {
      Taro.showToast({ title: '发送失败', icon: 'none' })
      return
    }
    api.sendMessage(id, msg).then((sent) => {
      setMessages((prev) => [...prev, sent])
      setText('')
      // Simulate reply after a delay
      setTimeout(() => {
        api.simulateReply(id).then((reply) => {
          setMessages((prev) => [...prev, reply])
        }).catch(() => {})
      }, 1500)
    }).catch(() => {
      Taro.showToast({ title: '发送失败，请重试', icon: 'none' })
    })
  }

  if (loading) {
    return (
      <View className='app-screen'>
        <AppBar title='偶遇消息' left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/encounter-ongoing/index')} />} />
        <View className='app-content text-center' style='padding:40px 20px;'>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='app-screen'>
      <AppBar
        title='偶遇消息'
        left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/encounter-ongoing/index')} />}
        right={<IconButton icon='shield' tone='yellow' onClick={() => openPage('/pages/safety-center/index')} />}
      />
      <View className='app-content chat-content'>
        {messages.length === 0 && (
          <View className='text-center' style='padding:60px 20px;'>
            <Text className='text-muted'>暂无消息，发送一条打招呼吧</Text>
          </View>
        )}

        {candidate && messages.length > 0 && (
          <View className='card' style='background:#facc15;margin:0 0 20px;'>
            <View className='row' style='gap:12px;'>
              <AppIcon name='map-pin' />
              <View className='stack' style='gap:2px;'>
                <Text style='font-size:17px;font-weight:900;'>{candidate.meetup}</Text>
                <Text className='text-xs text-muted'>预计 3 分钟后到达</Text>
              </View>
            </View>
          </View>
        )}

        {messages.map((msg) => (
          <View className={msg.side === 'right' ? 'chat-bubble chat-bubble-right' : 'chat-bubble'} key={msg.id}>
            <Text className='text-xs text-muted'>{msg.name}</Text>
            <Text style='display:block;font-size:15px;font-weight:800;margin-top:4px;'>{msg.text}</Text>
          </View>
        ))}
      </View>
      <View className='chat-input-bar'>
        <Input
          className='input'
          placeholder='发送安全简短消息'
          value={text}
          adjustPosition={false}
          onInput={(event) => setText(event.detail.value)}
          onConfirm={handleSend}
        />
        <Button className='primary-button' type='primary' onClick={handleSend}>
          发送
        </Button>
      </View>
    </View>
  )
}
