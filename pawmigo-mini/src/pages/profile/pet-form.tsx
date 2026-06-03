import { Button, Input, Text, View } from '@tarojs/components'
import { AppIcon } from '../../components/icons'
import { AppBar, IconButton } from '../../components/ui'
import { backOrHome, openPage } from '../../utils/navigation'

const tags = ['社牛', '温顺', '活泼', 'i狗', '运动健将', '爱飞盘', '胆小', '喜欢小狗']

export default function PetFormPage() {
  return (
    <View className='app-screen'>
      <AppBar
        title='创建宠物档案'
        left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/login/index')} />}
      />

      <View className='app-content' style='padding:24px 20px;'>
        <Text className='eyebrow'>宠物才是主角</Text>
        <Text className='title' style='display:block;font-size:28px;margin-bottom:32px;'>
          告诉大家{'\n'}你的毛孩子是谁
        </Text>

        <View className='row' style='justify-content:center;margin-bottom:32px;'>
          <View
            style='width:120px;height:120px;border-radius:40px;background:#f3f4f6;border:3px solid #000;display:flex;align-items:center;justify-content:center;box-shadow:8px 8px 0 #000;position:relative;'
          >
            <AppIcon name='dog' color='#6b7280' />
            <View
              style='position:absolute;bottom:-10px;right:-10px;width:40px;height:40px;background:#a855f7;border:2px solid #000;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;'
            >
              <AppIcon name='camera' color='#ffffff' />
            </View>
          </View>
        </View>

        <View className='form-group'>
          <Text className='label-text'>宠物昵称</Text>
          <Input className='input' placeholder='例如：布丁' />
        </View>

        <View className='form-group'>
          <Text className='label-text'>宠物品种</Text>
          <Input className='input' placeholder='例如：金毛寻回犬' />
        </View>

        <View className='form-group'>
          <Text className='label-text'>性格标签 (多选)</Text>
          <View className='tag-grid'>
            {tags.map((tag, index) => (
              <View className={index === 0 ? 'tag-btn tag-btn-active' : 'tag-btn'} key={tag}>
                <Text>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className='action-bar-fixed' style='position:sticky;bottom:0;'>
        <Button
          className='primary-button'
          type='primary'
          onClick={() => openPage('/pages/permissions/index', { replace: true })}
        >
          下一步
        </Button>
      </View>
    </View>
  )
}
