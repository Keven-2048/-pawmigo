import { useEffect, useState } from 'react'
import { Button, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AppBar, IconButton } from '../../components/ui'
import { api, Team } from '../../services/api'
import { backOrHome, getRouterParam, openPage } from '../../utils/navigation'

export default function TeamDetailPage() {
  const id = Number(getRouterParam('id')) || 0
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchTeam = () => {
    if (!id) return
    setLoading(true)
    setError(false)
    api.getTeam(id).then((data) => {
      setTeam(data)
      setLoading(false)
    }).catch(() => {
      setError(true)
      setLoading(false)
    })
  }

  useEffect(() => {
    fetchTeam()
  }, [id])

  const handleJoin = () => {
    if (!team) return
    api.joinTeam(team.id).then((updated) => {
      setTeam(updated)
      Taro.showToast({ title: '已加入队伍', icon: 'success' })
    }).catch(() => {
      Taro.showToast({ title: '加入失败，请重试', icon: 'none' })
    })
  }

  const handleLeave = () => {
    if (!team) return
    Taro.showModal({
      title: '退出队伍',
      content: `确定要退出「${team.name}」吗？`,
      success: (res) => {
        if (res.confirm) {
          api.leaveTeam(team.id).then((updated) => {
            setTeam(updated)
            Taro.showToast({ title: '已退出队伍', icon: 'none' })
          }).catch(() => {
            Taro.showToast({ title: '退出失败，请重试', icon: 'none' })
          })
        }
      },
    })
  }

  const handleReport = () => {
    Taro.showModal({
      title: '举报队伍',
      content: '确认举报该队伍存在违规内容？我们会尽快核实处理。',
      confirmText: '举报',
      success: (res) => {
        if (res.confirm) Taro.showToast({ title: '已举报，感谢反馈', icon: 'success' })
      },
    })
  }

  if (loading) {
    return (
      <View className='app-screen'>
        <AppBar title='队伍详情' left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/team/index')} />} />
        <View className='app-content text-center' style='padding:60px 20px;'>
          <Text className='text-muted'>加载中...</Text>
        </View>
      </View>
    )
  }

  if (error || !team) {
    return (
      <View className='app-screen'>
        <AppBar title='队伍详情' left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/team/index')} />} />
        <View className='app-content text-center' style='padding:60px 20px;'>
          <Text className='text-muted' style='display:block;margin-bottom:16px;'>加载失败，请稍后重试</Text>
          <Text className='tag tag-yellow' onClick={fetchTeam}>点击重试</Text>
        </View>
      </View>
    )
  }

  const isJoined = team.joined

  return (
    <View className='app-screen'>
      <AppBar
        title={isJoined ? '我的队伍' : '队伍详情'}
        className='app-bar-yellow'
        left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/team/index')} />}
        right={<IconButton icon='menu' tone='yellow' onClick={() => {
          const itemList = isJoined ? ['分享队伍', '队伍设置', '退出队伍'] : ['分享队伍', '举报队伍']
          Taro.showActionSheet({
            itemList,
            success: (res) => {
              const action = itemList[res.tapIndex]
              if (action === '退出队伍') handleLeave()
              else if (action === '举报队伍') handleReport()
              else Taro.showToast({ title: '功能即将上线', icon: 'none' })
            },
          })
        }} />}
      />
      <View className='app-content' style='padding:0;'>
        <View className='team-detail-hero'>
          <View className='row-between' style='margin-bottom:4px;'>
            <View className='eyebrow' style='background:var(--accent-quaternary);'>{team.type}</View>
            {isJoined && <Text className='tag tag-green'>已加入</Text>}
          </View>
          <Text className='team-detail-name'>{team.name}</Text>
          <Text className='team-detail-desc'>{team.schedule}</Text>

          <View className='team-meta-row'>
            <View className='member-stack'>
              <View className='member-stack-avatar member-stack-avatar-cyan' />
              <View className='member-stack-avatar member-stack-avatar-purple' />
              <View className='member-stack-avatar member-stack-more'>
                <Text style='font-size:10px;font-weight:900;'>+{Math.max(0, team.members - 2)}</Text>
              </View>
            </View>
            <Text style='font-size:12px;font-weight:800;'>{team.members} 名成员 · {team.vibe}</Text>
          </View>
        </View>

        <View style='padding:24px;'>
          <Text className='text-xs text-muted' style='display:block;margin-bottom:16px;font-weight:800;'>近期活动</Text>
          <View className='card team-activity-card'>
            <View className='row-between'>
              <Text className='tag tag-yellow'>群遛邀请</Text>
              <Text style='font-weight:900;font-size:12px;'>今天 18:30</Text>
            </View>
            <Text style='display:block;margin:12px 0 4px;font-size:18px;font-weight:900;'>{team.activity}</Text>
            <Text className='text-muted text-xs'>已报 12 犬 · 公园凉亭集合</Text>
            <Button
              className='primary-button'
              style='font-size:12px;min-height:44px;padding:0 10px;margin-top:16px;'
              disabled={team.signedUp}
              onClick={() => {
                if (!isJoined) {
                  Taro.showToast({ title: '请先加入队伍', icon: 'none' })
                  return
                }
                if (team.signedUp) return
                api.signupActivity(team.id).then((updated) => {
                  setTeam(updated)
                  Taro.showToast({ title: '报名成功！', icon: 'success' })
                }).catch(() => Taro.showToast({ title: '报名失败，请重试', icon: 'none' }))
              }}
            >
              {team.signedUp ? '已报名' : isJoined ? '立即报名' : '加入后可报名'}
            </Button>
          </View>

          <Text className='text-xs text-muted' style='display:block;margin-bottom:16px;'>加入条件</Text>
          <View className='stack' style='gap:12px;'>
            {[
              `必须是${team.tag}或${team.tag}混血`,
              '定期参加线下群遛活动',
              '友善不打架',
            ].map((condition) => (
              <View className='row' style='gap:10px;' key={condition}>
                <Text style='color:#4ade80;font-weight:900;font-size:18px;'>✓</Text>
                <Text style='font-size:14px;font-weight:700;'>{condition}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className='team-detail-footer'>
        {isJoined ? (
          <>
            <Button className='secondary-button' style='flex:1;' onClick={handleLeave}>退出队伍</Button>
            <Button className='primary-button' style='flex:1;' onClick={() => openPage(`/pages/chat/index?peerId=${team.id}`)}>进入群聊</Button>
          </>
        ) : (
          <>
            <Button className='secondary-button' style='flex:1;' onClick={() => backOrHome('/pages/team/index')}>返回列表</Button>
            <Button className='primary-button' style='flex:1;' onClick={handleJoin}>申请加入</Button>
          </>
        )}
      </View>
    </View>
  )
}
