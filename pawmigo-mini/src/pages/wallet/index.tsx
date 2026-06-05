import { useEffect, useState } from 'react'
import { Button, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AppIcon } from '../../components/icons'
import { AppBar, IconButton } from '../../components/ui'
import { api } from '../../services/api'
import { useSessionStore } from '../../store/sessionStore'
import { backOrHome, openPage } from '../../utils/navigation'
import type { WalletTxn } from '../../services/api'

export default function WalletPage() {
  const user = useSessionStore((s) => s.user)
  const [ledger, setLedger] = useState<WalletTxn[]>([])
  const balance = user?.boneBalance ?? 0

  useEffect(() => {
    api.getWallet().then((res) => setLedger(res.ledger)).catch(() => {})
  }, [])

  return (
    <View className='app-screen'>
      <AppBar
        title='骨头钱包'
        className='app-bar-purple'
        left={
          <IconButton
            icon='arrow-left'
            tone='purple'
            style='background:rgba(255,255,255,0.2);color:#fff;border-color:rgba(255,255,255,0.3);'
            onClick={() => backOrHome('/pages/profile/index')}
          />
        }
        right={
          <IconButton
            icon='info'
            tone='purple'
            style='background:rgba(255,255,255,0.2);color:#fff;border-color:rgba(255,255,255,0.3);'
            onClick={() => openPage('/pages/wallet-tasks/index')}
          />
        }
      />

      <View className='app-content' style='padding:0;'>
        <View className='wallet-hero'>
          <Text className='wallet-eyebrow'>当前余额</Text>
          <View className='bone-balance'>
            <AppIcon name='bone' color='#facc15' />
            <Text>{balance}</Text>
          </View>
          <Text className='wallet-sub'>用于送礼、报名活动和兑换权益</Text>
          <View className='wallet-hero-actions'>
            <Button className='btn-white-outline' onClick={() => Taro.showToast({ title: '充值功能即将上线', icon: 'none' })}>
              充值骨头
            </Button>
            <Button className='btn-white-outline' onClick={() => openPage('/pages/reward-shop/index')}>
              兑换中心
            </Button>
          </View>
        </View>

        <View style='padding:24px;'>
          <Text className='text-xs text-muted' style='display:block;margin-bottom:16px;font-weight:800;'>收支明细</Text>

          <View className='card' style='padding:0;overflow:hidden;'>
            {ledger.map((txn) => (
              <View className='history-item' key={txn.id}>
                <View className='stack' style='gap:4px;'>
                  <Text style='font-size:15px;font-weight:800;'>{txn.title}</Text>
                  <Text className='text-xs text-muted'>{txn.time}</Text>
                </View>
                <Text
                  className='wallet-amount'
                  style={txn.amount >= 0 ? 'color:#4ade80;' : 'color:#f87171;'}
                >
                  {txn.amount >= 0 ? `+${txn.amount}` : `${txn.amount}`}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  )
}
