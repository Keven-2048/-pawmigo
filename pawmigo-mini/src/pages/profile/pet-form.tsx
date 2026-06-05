import { useState } from 'react'
import { Button, Input, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AppBar, AvatarUploader, IconButton } from '../../components/ui'
import { useSessionStore } from '../../store/sessionStore'
import { backOrHome, openPage } from '../../utils/navigation'

const tags = ['社牛', '温顺', '活泼', 'i狗', '运动健将', '爱飞盘', '胆小', '喜欢小狗']

export default function PetFormPage() {
  const [name, setName] = useState('')
  const [breed, setBreed] = useState('')
  const [selectedTags, setSelectedTags] = useState(['社牛'])
  const [loading, setLoading] = useState(false)
  const createPet = useSessionStore((s) => s.createPet)
  const canSubmit = name.trim().length > 0 && breed.trim().length > 0 && selectedTags.length > 0

  const toggleTag = (tag: string) => {
    setSelectedTags((current) => (
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag]
    ))
  }

  const next = () => {
    if (!canSubmit) {
      Taro.showToast({ title: '请补全昵称、品种和性格标签', icon: 'none' })
      return
    }

    setLoading(true)
    createPet({
      name,
      breed,
      personality: selectedTags,
      gender: '男',
      age: 2,
      bio: '',
    }).then(() => {
      openPage('/pages/permissions/index', { replace: true })
    }).catch(() => {
      Taro.showToast({ title: '创建失败，请重试', icon: 'none' })
    }).finally(() => {
      setLoading(false)
    })
  }

  return (
    <View className='app-screen page-with-action-bar'>
      <AppBar
        title='创建宠物档案'
        left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/login/index')} />}
      />

      <View className='app-content content-form'>
        <Text className='eyebrow'>宠物才是主角</Text>
        <View className='pet-form-title'>
          <Text className='text-title pet-form-title-line'>告诉大家</Text>
          <Text className='text-title pet-form-title-line'>你的毛孩子是谁</Text>
        </View>

        <View className='pet-form-avatar-row'>
          <AvatarUploader onClick={() => Taro.showToast({ title: '照片上传稍后接入', icon: 'none' })} />
        </View>

        <View className='form-group'>
          <Text className='label-text'>宠物昵称</Text>
          <Input
            className='input'
            placeholder='例如：布丁'
            value={name}
            adjustPosition={false}
            onInput={(event) => setName(event.detail.value)}
          />
        </View>

        <View className='form-group'>
          <Text className='label-text'>宠物品种</Text>
          <Input
            className='input'
            placeholder='例如：金毛寻回犬'
            value={breed}
            adjustPosition={false}
            onInput={(event) => setBreed(event.detail.value)}
          />
        </View>

        <View className='form-group'>
          <Text className='label-text'>性格标签 (多选)</Text>
          <View className='tag-grid'>
            {tags.map((tag) => (
              <View
                className={selectedTags.includes(tag) ? 'tag-btn tag-btn-active' : 'tag-btn'}
                key={tag}
                onClick={() => toggleTag(tag)}
              >
                <Text>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className='action-bar-fixed'>
        <Button
          className={canSubmit && !loading ? 'primary-button' : 'primary-button button-disabled'}
          type={canSubmit && !loading ? 'primary' : 'default'}
          disabled={!canSubmit || loading}
          loading={loading}
          onClick={next}
        >
          下一步
        </Button>
      </View>
    </View>
  )
}
