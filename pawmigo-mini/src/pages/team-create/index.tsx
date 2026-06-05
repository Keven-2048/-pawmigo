import { useState } from 'react'
import { Button, Input, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AppBar, IconButton } from '../../components/ui'
import { api, TeamType } from '../../services/api'
import { backOrHome, openPage } from '../../utils/navigation'

const teamTypes: TeamType[] = ['品种团', '地点团', '性格团']

export default function TeamCreatePage() {
  const [name, setName] = useState('')
  const [teamType, setTeamType] = useState<TeamType>('地点团')
  const [place, setPlace] = useState('')
  const [loading, setLoading] = useState(false)
  const canSubmit = name.trim().length > 0 && place.trim().length > 0

  const submit = () => {
    if (!canSubmit) {
      Taro.showToast({ title: '请补全队伍名称和集合点', icon: 'none' })
      return
    }

    setLoading(true)
    api.createTeam({
      name,
      type: teamType,
      tag: name.slice(0, 4),
      schedule: place,
    }).then((team) => {
      Taro.showToast({ title: '队伍已创建', icon: 'success' })
      openPage(`/pages/team-detail/index?id=${team.id}`, { replace: true })
    }).catch(() => {
      Taro.showToast({ title: '创建失败，请重试', icon: 'none' })
    }).finally(() => {
      setLoading(false)
    })
  }

  return (
    <View className='app-screen page-with-action-bar'>
      <AppBar title='创建队伍' left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/team/index')} />} />
      <View className='app-content content-compact'>
        <View className='form-group'>
          <Text className='label-text'>队伍名称</Text>
          <Input
            className='input'
            placeholder='例如：滨江柯基冲锋队'
            value={name}
            adjustPosition={false}
            onInput={(event) => setName(event.detail.value)}
          />
        </View>
        <View className='form-group'>
          <Text className='label-text'>队伍类型</Text>
          <View className='tag-grid'>
            {teamTypes.map((tag) => (
              <View
                className={teamType === tag ? 'tag-btn tag-btn-active' : 'tag-btn'}
                key={tag}
                onClick={() => setTeamType(tag)}
              >
                <Text>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
        <View className='form-group'>
          <Text className='label-text'>常驻集合点</Text>
          <Input
            className='input'
            placeholder='例如：幸福小区中心广场'
            value={place}
            adjustPosition={false}
            onInput={(event) => setPlace(event.detail.value)}
          />
        </View>
      </View>
      <View className='footer-actions'>
        <Button
          className={canSubmit && !loading ? 'primary-button' : 'primary-button button-disabled'}
          type={canSubmit && !loading ? 'primary' : 'default'}
          disabled={!canSubmit || loading}
          loading={loading}
          onClick={submit}
        >
          创建并查看
        </Button>
      </View>
    </View>
  )
}
