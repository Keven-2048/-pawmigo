import { ProLayout } from '@ant-design/pro-components'
import { Button, Space, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import { clearToken } from '../auth/token'
import { authService } from '../services'
import type { AdminUser } from '../services/contracts'

const menuRoutes = [
  { path: '/dashboard', name: '仪表盘', icon: <span>仪</span> },
  { path: '/users', name: '用户管理', icon: <span>用</span> },
  { path: '/pets', name: '宠物管理', icon: <span>宠</span> },
  { path: '/posts', name: '动态管理', icon: <span>动</span> },
  { path: '/comments', name: '评论管理', icon: <span>评</span> },
  { path: '/invites', name: '邀约管理', icon: <span>邀</span> },
  { path: '/reports', name: '举报处理', icon: <span>报</span> },
  { path: '/announcements', name: '公告管理', icon: <span>告</span> },
  { path: '/admins', name: '管理员', icon: <span>管</span> },
]

export default function AdminLayout() {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false

    authService
      .me()
      .then((user) => {
        if (!cancelled) {
          setAdmin(user)
        }
      })
      .catch(() => {
        if (!cancelled) {
          clearToken()
          navigate('/login', { replace: true })
        }
      })

    return () => {
      cancelled = true
    }
  }, [navigate])

  function handleLogout() {
    clearToken()
    navigate('/login', { replace: true })
  }

  return (
    <ProLayout
      title="宠友圈管理后台"
      route={{ path: '/', routes: menuRoutes }}
      location={{ pathname: location.pathname }}
      menuItemRender={(item, dom) => (
        <button
          className="admin-menu-button"
          type="button"
          onClick={() => item.path && navigate(item.path)}
        >
          {dom}
        </button>
      )}
      avatarProps={false}
      actionsRender={() => [
        <Space key="admin-actions" size={16}>
          <Typography.Text>{admin?.nickname || '管理员'}</Typography.Text>
          <Button type="link" onClick={handleLogout}>
            退出登录
          </Button>
        </Space>,
      ]}
      layout="mix"
      fixedHeader
    >
      <Outlet />
    </ProLayout>
  )
}
