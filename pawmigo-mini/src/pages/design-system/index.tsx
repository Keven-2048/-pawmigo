import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AppIcon } from '../../components/icons'
import {
  AppBar,
  ActionIconButton,
  AvatarUploader,
  BottomNav,
  Chip,
  DSButton,
  Field,
  IconButton,
  PageShell,
  SectionHeader,
  SurfaceCard,
  Tag,
} from '../../components/ui'

const colors = [
  { name: 'Canvas', value: '#FFFBEB', className: 'color-bg' },
  { name: 'Surface', value: '#FFFFFF', className: 'color-surface' },
  { name: 'Alt Surface', value: '#F3F4F6', className: 'color-alt' },
  { name: 'Accent', value: '#A855F7', className: 'color-accent' },
  { name: 'Cyan', value: '#22D3EE', className: 'color-cyan' },
  { name: 'Yellow', value: '#FACC15', className: 'color-yellow' },
  { name: 'Rose', value: '#FB7185', className: 'color-rose' },
  { name: 'Success', value: '#4ADE80', className: 'color-green' },
]

export default function DesignSystemPage() {
  return (
    <PageShell
      className='design-preview-shell'
      contentClassName='design-preview-page stack'
      appBar={
        <AppBar
          title='设计系统'
          left={<IconButton icon='arrow-left' tone='plain' onClick={() => Taro.navigateBack()} />}
          right={<IconButton icon='paw' tone='purple' />}
        />
      }
    >
        <View className='preview-hero'>
          <Text className='eyebrow tag-rose'>Dev Preview</Text>
          <Text className='title'>PAWMIGO DESIGN SYSTEM</Text>
          <Text className='muted'>新粗野主义边框、硬阴影、多巴胺强调色与高字重排版。</Text>
        </View>

        <View className='preview-section'>
          <SectionHeader eyebrow='Tokens' title='颜色系统' extra='8 core' />
          <View className='preview-grid'>
            {colors.map((color) => (
              <View className='preview-token' key={color.name}>
                <View className={`preview-token-color ${color.className}`} />
                <View className='preview-token-body'>
                  <Text className='preview-token-name'>{color.name}</Text>
                  <Text className='preview-token-value'>{color.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className='preview-section'>
          <SectionHeader eyebrow='Type' title='字体与层级' extra='Bold' />
          <View className='preview-type-specimen'>
            <Text className='preview-type-display'>遛遛 PAWMIGO</Text>
            <Text className='preview-type-body'>
              以系统字体承载微信小程序性能，使用 800/900 字重、紧凑行高和大字号标题还原原型冲击力。
            </Text>
            <View className='preview-inline-row'>
              <Tag tone='yellow'>Title 900</Tag>
              <Tag tone='cyan'>Body 700</Tag>
              <Tag tone='rose'>Uppercase</Tag>
            </View>
          </View>
        </View>

        <View className='preview-section'>
          <SectionHeader eyebrow='Buttons' title='按钮与按压状态' />
          <View className='preview-button-grid'>
            <DSButton variant='primary'>开启偶遇之旅</DSButton>
            <DSButton variant='secondary'>获取验证码</DSButton>
            <View className='preview-inline-row'>
              <DSButton variant='mini' active>社牛</DSButton>
              <DSButton variant='mini'>温顺</DSButton>
              <ActionIconButton icon='heart' label='点赞' active tone='rose' />
              <ActionIconButton icon='message' label='评论' tone='cyan' />
              <DSButton variant='circle' tone='pass'><AppIcon name='x' /></DSButton>
              <DSButton variant='circle' tone='super'><AppIcon name='star' /></DSButton>
              <DSButton variant='circle' tone='like'><AppIcon name='check' color='#ffffff' /></DSButton>
            </View>
          </View>
        </View>

        <View className='preview-section'>
          <SectionHeader eyebrow='Components' title='卡片、表单、标签' />
          <SurfaceCard variant='form' className='stack'>
            <Text className='eyebrow tag-yellow'>Form</Text>
            <View className='pet-form-avatar-row'>
              <AvatarUploader />
            </View>
            <Field placeholder='宠物昵称，例如：布丁' />
            <Field placeholder='宠物简介' textarea />
            <View className='chip-row'>
              <Chip label='社牛' active />
              <Chip label='运动健将' tone='cyan' />
              <Chip label='爱飞盘' tone='green' />
            </View>
          </SurfaceCard>

          <SurfaceCard variant='nearby' active className='stack'>
            <View className='card-topline'>
              <View>
                <Text className='card-title'>奶盖 · 比熊</Text>
                <Text className='card-subtitle'>410m · 已遛 9 分钟 · 口袋公园环线</Text>
              </View>
              <Text className='status-pill'>在线</Text>
            </View>
            <View className='tag-cloud'>
              <Tag tone='yellow'>社牛</Tag>
              <Tag tone='cyan'>贴贴怪</Tag>
              <Tag tone='green'>路线重合</Tag>
            </View>
          </SurfaceCard>
        </View>

        <View className='preview-section'>
          <SectionHeader eyebrow='Layout' title='页面级布局' extra='Map' />
          <View className='preview-layout-demo'>
            <View className='marker' style='left:18%;top:28%;'>
              <Text className='marker-label'>约 260m</Text>
              <Text className='marker-avatar'>柴</Text>
              <View className='marker-status' />
            </View>
            <View className='marker' style='left:62%;top:34%;'>
              <Text className='marker-label'>约 410m</Text>
              <Text className='marker-avatar'>比</Text>
              <View className='marker-status marker-status-purple' />
            </View>
            <View className='active-walker' />
            <View className='preview-layout-card'>
              <Text className='card-title'>我在遛</Text>
              <Text className='card-subtitle'>地图背景、图钉、底部状态卡与原型布局保持一致。</Text>
            </View>
          </View>
        </View>

        <View className='preview-section'>
          <SectionHeader eyebrow='Navigation' title='底部导航' extra='Custom' />
          <View className='preview-nav-frame'>
            <BottomNav
              items={[
                { label: '地图', icon: 'map-pin', active: true },
                { label: '圈子', icon: 'message' },
                { label: '偶遇', icon: 'radar', fab: true },
                { label: '组队', icon: 'team' },
                { label: '我的', icon: 'user' },
              ]}
            />
          </View>
        </View>
    </PageShell>
  )
}
