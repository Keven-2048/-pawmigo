import { Text, View } from '@tarojs/components'
import { AppIcon } from '../../components/icons'
import { MainNav } from '../../components/ui'
import { openPage } from '../../utils/navigation'

export default function FeedPage() {
  return (
    <View className='app-screen'>
      <View className='prototype-tabs'>
        {['关注', '附近', '热门', '同城'].map((tab) => (
          <View className={tab === '附近' ? 'prototype-tab prototype-tab-active' : 'prototype-tab'} key={tab}>
            <Text>{tab}</Text>
          </View>
        ))}
      </View>

      <View className='app-content' style='padding:0;'>
        <View className='story-bar'>
          <View className='story-item'>
            <View className='story-circle'>
              <View className='story-inner plus'><AppIcon name='plus' /></View>
            </View>
            <Text className='story-label'>发布</Text>
          </View>
          <View className='story-item'>
            <View className='story-circle story-circle-active'>
              <View className='story-inner'><AppIcon name='dog' /></View>
            </View>
            <Text className='story-label'>豆豆</Text>
          </View>
          {['布丁', '奶盖', '球球'].map((name) => (
            <View className='story-item' key={name}>
              <View className='story-circle'>
                <View className='story-inner'><AppIcon name='paw' /></View>
              </View>
              <Text className='story-label'>{name}</Text>
            </View>
          ))}
        </View>

        <View className='post' style='transform:rotate(1deg);'>
          <View className='post-header'>
            <View className='post-user'>
              <View className='post-avatar'><AppIcon name='dog' /></View>
              <View>
                <Text style='font-weight:800;font-size:15px;'>豆豆</Text>
                <Text className='text-muted text-sm' style='display:block;'>15分钟前 · 滨江公园</Text>
              </View>
            </View>
            <AppIcon name='menu' />
          </View>
          <View className='post-media media-park' onClick={() => openPage('/pages/pet-detail/index')}>
            <AppIcon name='camera' color='#000000' className='post-media-icon' />
              <Text
                className='post-sticker'
                onClick={(event) => {
                  event.stopPropagation()
                  openPage('/pages/sticker-edit/index')
                }}
              >
                #社牛小钢炮
              </Text>
          </View>
          <View className='post-actions'>
            <View className='action-row' style='gap:20px;'>
              <AppIcon name='heart' />
              <AppIcon name='message' />
            </View>
            <View className='bone-action'>
              <Text>打赏</Text>
            </View>
          </View>
          <View className='post-body'>
            <Text className='post-likes'>241 个赞</Text>
            <Text className='post-caption'>
              豆豆 今天在滨江公园偶遇了好多小伙伴！天气真好，遛弯太开心啦
            </Text>
          </View>
        </View>
      </View>

      <View className='fab-post' onClick={() => openPage('/pages/post-flow/index')}>
        <AppIcon name='plus' color='#ffffff' />
      </View>
      <MainNav active='feed' />
    </View>
  )
}
