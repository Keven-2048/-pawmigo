import { Button, Input, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AppIcon } from '../../components/icons'
import { AppBar, IconButton } from '../../components/ui'
import { backOrHome, openPage } from '../../utils/navigation'

export default function LoginPage() {
  return (
    <View className='app-screen'>
      <AppBar
        title='登录 / 注册'
        left={<IconButton icon='arrow-left' tone='plain' onClick={() => backOrHome('/pages/splash/index')} />}
      />

      <View className='app-content' style='padding:32px;'>
        <Text className='title'>创建宠物身份</Text>
        <Text className='muted' style='display:block;margin-top:8px;margin-bottom:16px;font-weight:700;'>
          开启附近的偶遇之旅
        </Text>

        <View className='form-group'>
          <View className='label-text'><AppIcon name='phone' /><Text>手机号码</Text></View>
          <Input className='input' type='number' placeholder='请输入您的手机号' />
        </View>

        <View className='form-group'>
          <View className='label-text'><AppIcon name='shield' /><Text>验证码</Text></View>
          <View className='row' style='gap:12px;'>
            <Input className='input' type='number' style='flex:1;' placeholder='6位验证码' />
            <Button
              className='secondary-button'
              style='white-space:nowrap;font-size:14px;padding:0 12px;'
              onClick={() => Taro.showToast({ title: '验证码已发送', icon: 'none' })}
            >
              获取验证码
            </Button>
          </View>
        </View>

        <Button
          className='primary-button'
          type='primary'
          style='margin-top:16px;'
          onClick={() => openPage('/pages/profile/pet-form', { replace: true })}
        >
          进入宠物世界
        </Button>

        <View className='text-center' style='margin-top:16px;'>
          <Text className='text-xs text-muted'>其他登录方式</Text>
          <View className='row' style='justify-content:center;gap:24px;margin-top:16px;'>
            <Button
              className='icon-button'
              style='background:#07C160;color:#fff;'
              onClick={() => openPage('/pages/profile/pet-form', { replace: true })}
            >
              <AppIcon name='wechat' color='#ffffff' />
            </Button>
            <Button
              className='icon-button'
              style='background:#000;color:#fff;'
              onClick={() => openPage('/pages/profile/pet-form', { replace: true })}
            >
              <AppIcon name='phone' color='#ffffff' />
            </Button>
          </View>
        </View>
      </View>

      <View style='padding:24px;text-align:center;'>
        <Text className='text-xs text-muted'>
          登录即代表同意 用户协议 和 隐私政策
        </Text>
      </View>
    </View>
  )
}
