import { View, Text } from '@tarojs/components'

interface EmptyStateProps {
  title: string
  description?: string
  actionText?: string
  onAction?: () => void
}

export function EmptyState({ title, description, actionText, onAction }: EmptyStateProps) {
  return (
    <View className="empty-state">
      <View className="empty-state__mark">
        <View className="empty-state__paw-dot empty-state__paw-dot--one" />
        <View className="empty-state__paw-dot empty-state__paw-dot--two" />
        <View className="empty-state__paw-dot empty-state__paw-dot--three" />
        <View className="empty-state__paw-pad" />
      </View>
      <Text className="empty-state__title">{title}</Text>
      {description ? <Text className="empty-state__desc">{description}</Text> : null}
      {actionText ? (
        <View className="empty-state__button ui-button ui-button--primary" onClick={onAction}>
          {actionText}
        </View>
      ) : null}
    </View>
  )
}
