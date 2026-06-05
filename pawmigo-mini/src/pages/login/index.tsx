import { useState } from 'react'
import { Button, Input, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AppIcon } from '../../components/icons'
import { AppBar, IconButton } from '../../components/ui'
import { useSessionStore } from '../../store/sessionStore'
import { backOrHome, openPage } from '../../utils/navigation'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useSessionStore((s) => s.login)
  const user = useSessionStore((s) => s.user)
  const canSubmit = phone.length === 11 && code.length >= 4

  const sendCode = () => {
    if (phone.length !== 11) {
      Taro.showToast({ title: '请先输入 11 位手机号', icon: 'none' })
      return
    }

    Taro.showToast({ title: '验证码已发送', icon: 'none' })
  }

  const handleWechatLogin = async () => {
    setLoading(true)
    try {
      if (user) {
        // Already logged in via session store
        openPage('/pages/map/index', { replace: true })
        return
      }
      await login()
      openPage('/pages/profile/pet-form', { replace: true })
    } catch (e) {
      // If WeChat login is unavailable (e.g. dev env), fall back to mock
      console.warn('WeChat login failed, using mock flow:', e)
      openPage('/pages/profile/pet-form', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  const submit = () => {
    if (!canSubmit) {
      Taro.showToast({ title: '请补全手机号和验证码', icon: 'none' })
      return
    }

    if (user) {
      openPage('/pages/map/index', { replace: true })
      return
    }

    openPage('/pages/profile/pet-form', { replace: true })
  }

  return (
    <View className='app-screen'>
      <AppBar
        title='登录 / 注册'
        left={<IconButton icon='arrow-left' tone='plain' onClick={() => backOrHome('/pages/splash/index')} />}
      />

      <View className='app-content login-content'>
        <Text className='title'>创建宠物身份</Text>
        <Text className='muted login-copy'>
          开启附近的偶遇之旅
        </Text>

        <View className='form-group'>
          <View className='label-text'><AppIcon name='phone' /><Text>手机号码</Text></View>
          <Input
            className='input'
            type='number'
            placeholder='请输入您的手机号'
            value={phone}
            maxlength={11}
            adjustPosition={false}
            onInput={(event) => setPhone(event.detail.value)}
          />
        </View>

        <View className='form-group'>
          <View className='label-text'><AppIcon name='shield' /><Text>验证码</Text></View>
          <View className='inline-input-row'>
            <Input
              className='input input-flex'
              type='number'
              placeholder='6位验证码'
              value={code}
              maxlength={6}
              adjustPosition={false}
              onInput={(event) => setCode(event.detail.value)}
            />
            <Button
              className='secondary-button button-compact'
              onClick={sendCode}
            >
              获取验证码
            </Button>
          </View>
        </View>

        <Button
          className={canSubmit ? 'primary-button' : 'primary-button button-disabled'}
          type={canSubmit ? 'primary' : 'default'}
          disabled={!canSubmit}
          onClick={submit}
        >
          进入宠物世界
        </Button>

        <View className='text-center login-alt'>
          <Text className='text-xs text-muted'>其他登录方式</Text>
          <View className='login-alt-buttons'>
            <Button
              className='icon-button icon-button-wechat'
              loading={loading}
              onClick={handleWechatLogin}
            >
              <AppIcon name='wechat' color='#ffffff' />
            </Button>
            <Button
              className='icon-button icon-button-phone-dark'
              onClick={submit}
            >
              <AppIcon name='phone' color='#ffffff' />
            </Button>
          </View>
        </View>
      </View>

      <View className='form-footer-text'>
        <Text className='text-xs text-muted'>
          登录即代表同意 用户协议 和 隐私政策
        </Text>
      </View>
    </View>
  )
}
