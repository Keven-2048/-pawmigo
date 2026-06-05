import { Button, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AppIcon } from '../../components/icons'
import { AppBar, IconButton } from '../../components/ui'
import { backOrHome, openPage } from '../../utils/navigation'

interface EmergencyAction {
  label: string
  content: string
  done: string
}

const actions: EmergencyAction[] = [
  { label: '共享当前位置给紧急联系人', content: '将把你的实时位置共享给紧急联系人，确认吗？', done: '已共享实时位置' },
  { label: '一键拨打 110', content: '即将拨打报警电话 110，确认吗？', done: '已发起报警呼叫' },
  { label: '举报当前偶遇对象', content: '将向平台举报当前偶遇对象，确认吗？', done: '举报已提交，平台将介入' },
]

export default function EmergencyPage() {
  const trigger = (action: EmergencyAction) => {
    Taro.showModal({
      title: action.label,
      content: action.content,
      confirmText: '确认',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) Taro.showToast({ title: action.done, icon: 'none' })
      },
    })
  }

  return (
    <View className='app-screen'>
      <AppBar title='紧急求助' left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/safety-center/index')} />} />
      <View className='app-content' style='padding:20px;'>
        <View className='card' style='background:#f87171;margin:0 0 20px;text-align:center;'>
          <View className='success-burst' style='background:#fff;margin:20px auto;'>
            <AppIcon name='shield' />
          </View>
          <Text style='display:block;font-size:30px;font-weight:900;'>保持在公共区域</Text>
          <Text style='display:block;margin-top:10px;font-weight:800;'>必要时立即联系附近可信联系人或报警。</Text>
        </View>

        <View className='card' style='padding:0;overflow:hidden;'>
          {actions.map((action) => (
            <View className='safety-item' key={action.label} onClick={() => trigger(action)}>
              <Text style='font-size:17px;font-weight:900;'>{action.label}</Text>
              <AppIcon name='chevron-right' />
            </View>
          ))}
        </View>
      </View>
      <View className='footer-actions'>
        <Button className='primary-button' type='primary' onClick={() => openPage('/pages/safety-center/index', { replace: true })}>
          我已安全
        </Button>
      </View>
    </View>
  )
}
