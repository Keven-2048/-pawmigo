import { useEffect, useState } from 'react'
import { Button, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AppIcon } from '../../components/icons'
import { AppBar, IconButton } from '../../components/ui'
import { api, WalletTask } from '../../services/api'
import { backOrHome, openPage } from '../../utils/navigation'

export default function WalletTasksPage() {
  const [tasks, setTasks] = useState<WalletTask[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getWalletTasks().then((data) => {
      setTasks(data)
      setLoading(false)
    }).catch(() => {
      Taro.showToast({ title: '加载失败', icon: 'none' })
      setLoading(false)
    })
  }, [])

  const handleClaim = (task: WalletTask) => {
    api.claimTask(task.id).then((res) => {
      setTasks(res.tasks)
      Taro.showToast({ title: `获得 ${task.reward} 根骨头`, icon: 'success' })
    })
  }

  const go = (title: string) => {
    if (title.includes('偶遇')) openPage('/pages/encounter/index', { replace: true })
    else if (title.includes('动态')) openPage('/pages/post-flow/index', { replace: true })
    else if (title.includes('队伍')) openPage('/pages/team/index', { replace: true })
  }

  return (
    <View className='app-screen'>
      <AppBar title='赚骨头' left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/wallet/index')} />} />
      <View className='app-content' style='padding:20px;'>
        {loading && (
          <View className='text-center' style='padding:60px 20px;'>
            <Text className='text-muted'>加载中...</Text>
          </View>
        )}
        {!loading && tasks.length === 0 && (
          <View className='text-center' style='padding:60px 20px;'>
            <Text className='text-muted'>暂无可用任务</Text>
          </View>
        )}
        {tasks.map((task) => (
          <View className='match-result-card' key={task.id}>
            <View className='match-avatar' style='background:#facc15;'><AppIcon name='bone' /></View>
            <View className='stack' style='gap:4px;flex:1;'>
              <Text style='font-size:17px;font-weight:900;'>{task.title}</Text>
              <Text className='text-xs text-muted'>+{task.reward} 根骨头</Text>
            </View>
            <Button
              className={task.done ? 'secondary-button button-disabled' : 'primary-button'}
              type={task.done ? 'default' : 'primary'}
              disabled={task.done}
              onClick={() => task.done ? null : handleClaim(task)}
            >
              {task.done ? '已完成' : '去完成'}
            </Button>
          </View>
        ))}
      </View>
    </View>
  )
}
