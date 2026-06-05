import { Component, ReactNode } from 'react'
import { Button, Text, View } from '@tarojs/components'
import { AppIcon } from './icons'
import { openPage } from '../utils/navigation'

interface Props {
  children: ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    openPage('/pages/map/index', { replace: true })
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className='app-screen'>
          <View className='app-content text-center' style='padding:48px 20px;'>
            <View className='success-burst' style='background:#f87171;'>
              <AppIcon name='shield' />
            </View>
            <Text style='display:block;font-size:24px;font-weight:900;margin-top:20px;'>
              {this.props.fallbackTitle ?? '页面出了点小问题'}
            </Text>
            <Text className='text-muted' style='display:block;margin-top:12px;font-weight:700;'>
              请点击下方按钮重新加载
            </Text>
            <Button
              className='primary-button'
              type='primary'
              style='margin-top:32px;'
              onClick={this.handleReset}
            >
              返回首页
            </Button>
          </View>
        </View>
      )
    }

    return this.props.children
  }
}
