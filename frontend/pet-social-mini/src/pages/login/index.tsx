import { useState } from 'react'
import { login as taroLogin } from '@tarojs/taro'
import { Image, Text, View } from '@tarojs/components'
import { MOCK_IMAGES } from '@/constants/assets'
import { useUserStore } from '@/store/userStore'
import { usePetStore } from '@/store/petStore'
import { showToast, toCreatePet, toNearby } from '@/utils/navigation'
import './index.scss'

export default function LoginPage() {
  const login = useUserStore((state) => state.login)
  const loading = useUserStore((state) => state.loading)
  const loadPets = usePetStore((state) => state.loadPets)
  const [submitting, setSubmitting] = useState(false)
  const [agreeProtocol, setAgreeProtocol] = useState(false)

  const handleLogin = async () => {
    if (submitting) return
    if (!agreeProtocol) {
      showToast('请先阅读并同意用户服务协议与隐私政策')
      return
    }
    setSubmitting(true)
    try {
      await taroLogin().catch(() => undefined)
      const hasPet = await login()
      await loadPets()
      showToast('登录成功', 'success')
      if (hasPet) {
        await toNearby()
      } else {
        await toCreatePet()
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : '登录失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className="login-page">
      <View className="login-page__brand-block">
        <View className="login-page__brand-mark">
          <View className="login-page__paw-dot login-page__paw-dot--one" />
          <View className="login-page__paw-dot login-page__paw-dot--two" />
          <View className="login-page__paw-dot login-page__paw-dot--three" />
          <View className="login-page__paw-pad" />
        </View>
        <Text className="login-page__brand">ChongYouQuan</Text>
        <Text className="login-page__tagline">让毛孩子认识附近新朋友</Text>
      </View>

      <View className="login-page__montage">
        <View className="login-page__glow" />
        <View className="login-page__photo login-page__photo--large">
          <Image src={MOCK_IMAGES.dog} mode="aspectFill" />
        </View>
        <View className="login-page__photo login-page__photo--top">
          <Image src={MOCK_IMAGES.cat} mode="aspectFill" />
        </View>
        <View className="login-page__photo login-page__photo--bottom">
          <Image src={MOCK_IMAGES.hero} mode="aspectFill" />
        </View>
        <View className="login-page__floating-tag login-page__floating-tag--top">发现趣事</View>
        <View className="login-page__floating-tag login-page__floating-tag--bottom">附近毛孩</View>
      </View>

      <View className="login-page__actions">
        <View
          className={`login-page__button ui-button ui-button--primary ${(loading || submitting) ? 'ui-button--disabled' : ''}`}
          onClick={handleLogin}
        >
          {loading || submitting ? '正在进入...' : '微信一键登录'}
        </View>
        <View className="login-page__agreement" onClick={() => setAgreeProtocol(!agreeProtocol)}>
          <View className={`login-page__checkbox ${agreeProtocol ? 'login-page__checkbox--checked' : ''}`}>
            {agreeProtocol ? <View className="login-page__checkbox-icon ui-icon ui-icon--check" /> : null}
          </View>
          <Text className="login-page__agreement-text">
            我已阅读并同意 <Text className="login-page__agreement-link">用户服务协议</Text> 与 <Text className="login-page__agreement-link">隐私政策</Text>
          </Text>
        </View>
      </View>
    </View>
  )
}
