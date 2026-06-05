import { useCallback, useEffect, useRef, useState } from 'react'
import { Input, Text, View } from '@tarojs/components'
import { AppIcon } from '../../components/icons'
import { AppBar, IconButton, MainNav } from '../../components/ui'
import { api, Team } from '../../services/api'
import { backOrHome, openPage } from '../../utils/navigation'
import { useRequireAuth } from '../../utils/useRequireAuth'

const tones = ['rose', 'blue', 'yellow']

export default function TeamPage() {
  useRequireAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [query, setQuery] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchTeams = useCallback((searchQuery?: string) => {
    setLoading(true)
    setError(false)
    api.getTeams(searchQuery || undefined).then((data) => {
      setTeams(data)
      setLoading(false)
    }).catch(() => {
      setError(true)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  const handleSearch = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchTeams(value || undefined)
    }, 300)
  }

  const handleJoin = (team: Team, e: any) => {
    e.stopPropagation()
    if (team.joined) {
      openPage(`/pages/team-detail/index?id=${team.id}`)
      return
    }
    api.joinTeam(team.id).then((updated) => {
      setTeams((prev) => prev.map((t) => (t.id === team.id ? updated : t)))
    }).catch(() => {
      // ignore
    })
  }

  return (
    <View className='app-screen'>
      <AppBar
        title='组队'
        left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/map/index')} />}
        right={<IconButton icon='plus' tone='yellow' onClick={() => openPage('/pages/team-create/index')} />}
      />

      <View className='app-content page-with-bottom-nav content-flush'>
        <View className='feed-search-bar'>
          <View className='feed-search-input-wrap'>
            <AppIcon name='paw' className='feed-search-icon' />
            <Input
              className='feed-search-input'
              placeholder='搜索队伍 / 品种 / 地点...'
              value={query}
              adjustPosition={false}
              onInput={(e) => handleSearch(e.detail.value)}
            />
            {query && (
              <View className='feed-search-clear' onClick={() => { setQuery(''); fetchTeams() }}>
                <Text>✕</Text>
              </View>
            )}
          </View>
        </View>

        <View style='padding:16px;'>
          {loading && (
            <View className='text-center' style='padding:60px 20px;'>
              <Text className='text-muted'>加载中...</Text>
            </View>
          )}
          {error && (
            <View className='text-center' style='padding:60px 20px;'>
              <Text className='text-muted' style='display:block;margin-bottom:12px;'>加载失败</Text>
              <Text className='tag tag-yellow' onClick={() => fetchTeams()} style='cursor:pointer;'>点击重试</Text>
            </View>
          )}
          {!loading && !error && teams.length === 0 && (
            <View className='text-center' style='padding:60px 20px;'>
              <Text className='text-muted'>暂无队伍，创建一个吧</Text>
            </View>
          )}
          {teams.map((team, index) => (
            <View
              className='card'
              style={index === 0 ? 'margin-top:0;' : ''}
              key={team.id}
              onClick={() => openPage(`/pages/team-detail/index?id=${team.id}`)}
            >
              <View className='row-between team-card-head'>
                <View className='row' style='gap:8px;'>
                  <Text className={`eyebrow eyebrow-${tones[index % tones.length]}`}>{team.type}</Text>
                  {team.joined && <Text className='tag tag-green'>已加入</Text>}
                </View>
                <Text className='text-xs text-muted'>{team.members} 犬</Text>
              </View>
              <Text className='team-list-title'>{team.name}</Text>
              <Text className='text-meta team-list-meta'>{team.schedule}</Text>
              <Text className='text-meta team-list-copy'>{team.activity} · {team.vibe}</Text>
              <View
                className={team.joined ? 'team-join-btn team-join-btn-joined' : 'team-join-btn'}
                onClick={(e) => handleJoin(team, e)}
              >
                <Text>{team.joined ? '已加入 ✓' : '加入队伍'}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <MainNav active='team' />
    </View>
  )
}
