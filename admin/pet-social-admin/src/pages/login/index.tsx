import { App, Button, Card, Form, Input, Typography } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { setToken } from '../../auth/token'
import { authService } from '../../services'

import './style.css'

interface LoginFormValues {
  username: string
  password: string
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { message } = App.useApp()

  async function handleFinish(values: LoginFormValues) {
    setLoading(true)
    try {
      const result = await authService.login(values.username, values.password)
      setToken(result.token)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      message.error(error instanceof Error ? error.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <Card className="login-card" variant="borderless">
        <Typography.Title level={2} className="login-title">
          宠友圈管理后台
        </Typography.Title>
        <Typography.Paragraph className="login-subtitle">
          宠物社交内容与安全运营中心
        </Typography.Paragraph>
        <Form<LoginFormValues>
          layout="vertical"
          requiredMark={false}
          initialValues={{ username: 'admin' }}
          onFinish={handleFinish}
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="admin" size="large" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="admin123" size="large" />
          </Form.Item>
          <Button
            block
            htmlType="submit"
            loading={loading}
            size="large"
            type="primary"
          >
            登录
          </Button>
        </Form>
      </Card>
    </main>
  )
}
