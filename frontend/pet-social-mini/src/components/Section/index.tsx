import { PropsWithChildren } from 'react'
import { View, Text } from '@tarojs/components'

interface SectionProps {
  title: string
  extra?: string
}

export function Section({ title, extra, children }: PropsWithChildren<SectionProps>) {
  return (
    <View className="section">
      <View className="section__header">
        <Text className="section__title">{title}</Text>
        {extra ? <Text className="section__extra">{extra}</Text> : null}
      </View>
      {children}
    </View>
  )
}
