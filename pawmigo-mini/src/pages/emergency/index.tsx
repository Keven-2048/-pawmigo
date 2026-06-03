import { Button, Text, View } from '@tarojs/components'
import { AppIcon } from '../../components/icons'
import { AppBar, IconButton } from '../../components/ui'
import { backOrHome, openPage } from '../../utils/navigation'

export default function EmergencyPage() {
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
          {['共享当前位置给紧急联系人', '一键拨打 110', '举报当前偶遇对象'].map((item) => (
            <View className='safety-item' key={item}>
              <Text style='font-size:17px;font-weight:900;'>{item}</Text>
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
