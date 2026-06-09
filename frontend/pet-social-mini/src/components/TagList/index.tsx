import { View, Text } from '@tarojs/components'

interface TagListProps {
  tags: string[]
  tone?: 'green' | 'orange' | 'neutral'
  max?: number
}

export function TagList({ tags, tone = 'green', max }: TagListProps) {
  const visible = typeof max === 'number' ? tags.slice(0, max) : tags

  return (
    <View className="tag-list">
      {visible.map((tag) => (
        <Text className={`tag tag--${tone}`} key={tag}>
          {tag}
        </Text>
      ))}
    </View>
  )
}
