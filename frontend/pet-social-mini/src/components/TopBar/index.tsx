import { View, Text } from '@tarojs/components'

interface TopBarProps {
  title: string
  subtitle?: string
  action?: string
  onAction?: () => void
}

export function TopBar({ title, subtitle, action, onAction }: TopBarProps) {
  return (
    <View className="top-bar">
      <View className="top-bar__copy">
        <Text className="top-bar__title">{title}</Text>
        {subtitle ? <Text className="top-bar__subtitle">{subtitle}</Text> : null}
      </View>
      {action ? (
        <View className="top-bar__action" onClick={onAction}>
          {action}
        </View>
      ) : null}
    </View>
  )
}
