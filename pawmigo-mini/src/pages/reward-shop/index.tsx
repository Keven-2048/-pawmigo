import { useEffect, useState } from 'react'
import { Button, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AppIcon } from '../../components/icons'
import { AppBar, IconButton } from '../../components/ui'
import { api, ShopItem } from '../../services/api'
import { backOrHome } from '../../utils/navigation'

export default function RewardShopPage() {
  const [items, setItems] = useState<ShopItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getShop().then((data) => {
      setItems(data)
      setLoading(false)
    }).catch(() => {
      Taro.showToast({ title: '加载失败', icon: 'none' })
      setLoading(false)
    })
  }, [])

  const handleRedeem = (item: ShopItem) => {
    api.redeem(item.id).then(() => {
      Taro.showToast({ title: `已兑换 ${item.name}`, icon: 'success' })
    }).catch(() => {
      Taro.showToast({ title: '余额不足', icon: 'none' })
    })
  }

  return (
    <View className='app-screen'>
      <AppBar title='兑换中心' left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/wallet/index')} />} />
      <View className='app-content' style='padding:20px;'>
        {loading && (
          <View className='text-center' style='padding:60px 20px;'>
            <Text className='text-muted'>加载中...</Text>
          </View>
        )}
        {!loading && items.length === 0 && (
          <View className='text-center' style='padding:60px 20px;'>
            <Text className='text-muted'>暂无兑换商品</Text>
          </View>
        )}
        {items.map((item) => (
          <View className='match-result-card' key={item.id}>
            <View className='match-avatar' style='background:#22d3ee;'><AppIcon name='star' /></View>
            <View className='stack' style='gap:4px;flex:1;'>
              <Text style='font-size:17px;font-weight:900;'>{item.name}</Text>
              <Text className='text-xs text-muted'>{item.cost} 骨头 · {item.tag}</Text>
            </View>
            <Button className='primary-button' type='primary' onClick={() => handleRedeem(item)}>
              兑换
            </Button>
          </View>
        ))}
      </View>
    </View>
  )
}
