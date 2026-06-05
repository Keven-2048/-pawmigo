import { ReactNode } from 'react'
import { Button, Input, Text, Textarea, View } from '@tarojs/components'
import { openPage } from '../utils/navigation'
import { AppIcon, IconName } from './icons'

type Tone = 'yellow' | 'cyan' | 'purple' | 'rose' | 'green' | 'plain'

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ')
}

interface PageShellProps {
  children: ReactNode
  appBar?: ReactNode
  className?: string
  contentClassName?: string
  contentStyle?: string
}

export function PageShell({ children, appBar, className, contentClassName, contentStyle }: PageShellProps) {
  return (
    <View className={cx('app-screen', className)}>
      {appBar}
      <View className={cx('app-content', contentClassName)} style={contentStyle}>
        {children}
      </View>
    </View>
  )
}

interface AppBarProps {
  title: string
  left?: ReactNode
  right?: ReactNode
  className?: string
}

export function AppBar({ title, left, right, className }: AppBarProps) {
  return (
    <View className={cx('app-bar', className)}>
      <View className='app-bar-slot'>{left}</View>
      <Text className='app-bar-title'>{title}</Text>
      <View className='app-bar-slot app-bar-slot-right'>{right}</View>
    </View>
  )
}

interface IconButtonProps {
  label?: string
  icon?: IconName
  tone?: Tone
  onClick?: () => void
  className?: string
}

export function IconButton({ label, icon, tone = 'yellow', onClick, className }: IconButtonProps) {
  const iconColor = tone === 'purple' ? '#ffffff' : '#000000'

  return (
    <Button
      className={cx(`icon-button icon-button-${tone}`, className)}
      hoverClass='button-hover'
      plain
      onClick={onClick}
    >
      {icon ? <AppIcon name={icon} color={iconColor} /> : label}
    </Button>
  )
}

interface ActionIconButtonProps {
  icon: IconName
  label: string
  active?: boolean
  tone?: Extract<Tone, 'yellow' | 'cyan' | 'rose' | 'green' | 'plain'>
  onClick?: () => void
  className?: string
}

export function ActionIconButton({
  icon,
  label,
  active,
  tone = 'plain',
  onClick,
  className,
}: ActionIconButtonProps) {
  return (
    <View
      className={cx(
        'action-icon-button',
        active && 'action-icon-button-active',
        tone !== 'plain' && `action-icon-button-${tone === 'cyan' ? 'blue' : tone}`,
        className,
      )}
      onClick={onClick}
    >
      <AppIcon name={icon} color={active ? '#ffffff' : '#000000'} />
      <Text className='visually-hidden'>{label}</Text>
    </View>
  )
}

interface AvatarUploaderProps {
  icon?: IconName
  onClick?: () => void
}

export function AvatarUploader({ icon = 'dog', onClick }: AvatarUploaderProps) {
  return (
    <View className='avatar-uploader' onClick={onClick}>
      <AppIcon name={icon} color='#6b7280' className='avatar-uploader-icon' />
      <View className='avatar-uploader-badge'>
        <AppIcon name='camera' color='#ffffff' />
      </View>
    </View>
  )
}

interface SectionHeaderProps {
  eyebrow?: string
  title: string
  extra?: string
  className?: string
}

export function SectionHeader({ eyebrow, title, extra, className }: SectionHeaderProps) {
  return (
    <View className={cx('section-header', className)}>
      <View>
        {eyebrow && <Text className='eyebrow'>{eyebrow}</Text>}
        <Text className='section-title'>{title}</Text>
      </View>
      {extra && <Text className='section-extra'>{extra}</Text>}
    </View>
  )
}

interface ChipProps {
  label: string
  active?: boolean
  tone?: Extract<Tone, 'yellow' | 'cyan' | 'rose' | 'green' | 'plain'>
  onClick?: () => void
  className?: string
}

export function Chip({ label, active, tone = 'plain', onClick, className }: ChipProps) {
  return (
    <View
      className={cx(
        'chip',
        active && 'chip-active',
        tone !== 'plain' && `tag-${tone === 'cyan' ? 'blue' : tone}`,
        className,
      )}
      onClick={onClick}
    >
      <Text>{label}</Text>
    </View>
  )
}

interface TagProps {
  children: ReactNode
  tone?: Extract<Tone, 'yellow' | 'cyan' | 'rose' | 'green' | 'plain'>
  className?: string
}

export function Tag({ children, tone = 'plain', className }: TagProps) {
  return (
    <Text className={cx('tag', tone !== 'plain' && `tag-${tone === 'cyan' ? 'blue' : tone}`, className)}>
      {children}
    </Text>
  )
}

interface StatTileProps {
  value: string | number
  label: string
}

export function StatTile({ value, label }: StatTileProps) {
  return (
    <View className='stat-tile'>
      <Text className='stat-value'>{value}</Text>
      <Text className='stat-label'>{label}</Text>
    </View>
  )
}

interface MiniButtonProps {
  children: ReactNode
  active?: boolean
  onClick?: () => void
  className?: string
}

export function MiniButton({ children, active, onClick, className }: MiniButtonProps) {
  return (
    <Button
      className={cx('mini-button', active && 'mini-button-active', className)}
      hoverClass='button-hover'
      plain
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

interface DSButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'mini' | 'circle'
  tone?: 'pass' | 'super' | 'like'
  active?: boolean
  formType?: 'submit' | 'reset'
  onClick?: () => void
  className?: string
}

export function DSButton({
  children,
  variant = 'primary',
  tone,
  active,
  formType,
  onClick,
  className,
}: DSButtonProps) {
  const buttonClass =
    variant === 'primary'
      ? 'primary-button'
      : variant === 'secondary'
        ? 'secondary-button'
        : variant === 'circle'
          ? cx('circle-button', tone && `circle-button-${tone}`)
          : cx('mini-button', active && 'mini-button-active')

  return (
    <Button
      className={cx(buttonClass, className)}
      hoverClass='button-hover'
      type={variant === 'primary' ? 'primary' : 'default'}
      formType={formType}
      plain={variant !== 'primary'}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

interface SurfaceCardProps {
  children: ReactNode
  variant?: 'panel' | 'card' | 'form' | 'team' | 'match' | 'nearby'
  active?: boolean
  className?: string
  style?: string
}

export function SurfaceCard({
  children,
  variant = 'panel',
  active,
  className,
  style,
}: SurfaceCardProps) {
  const baseClass =
    variant === 'form'
      ? 'form-card'
      : variant === 'team'
        ? 'team-card'
        : variant === 'match'
          ? 'match-card'
          : variant === 'nearby'
            ? 'nearby-card'
            : variant

  return (
    <View
      className={cx(
        baseClass,
        active && `${baseClass}-active`,
        className,
      )}
      style={style}
    >
      {children}
    </View>
  )
}

interface FieldProps {
  placeholder?: string
  value?: string
  type?: 'text' | 'number' | 'idcard' | 'digit' | 'safe-password' | 'nickname'
  textarea?: boolean
  className?: string
  onInput?: (value: string) => void
}

export function Field({
  placeholder,
  value,
  type = 'text',
  textarea,
  className,
  onInput,
}: FieldProps) {
  if (textarea) {
    return (
      <Textarea
        className={cx('textarea', className)}
        placeholder={placeholder}
        value={value}
        adjustPosition={false}
        onInput={(event) => onInput?.(event.detail.value)}
      />
    )
  }

  return (
    <Input
      className={cx('input', className)}
      type={type}
      placeholder={placeholder}
      value={value}
      adjustPosition={false}
      onInput={(event) => onInput?.(event.detail.value)}
    />
  )
}

interface PetAvatarProps {
  text: string
  active?: boolean
}

export function PetAvatar({ text, active }: PetAvatarProps) {
  return (
    <View className={active ? 'pet-avatar pet-avatar-active' : 'pet-avatar'}>
      <Text>{text.slice(0, 1)}</Text>
    </View>
  )
}

interface BottomNavItem {
  label: string
  icon: IconName
  url?: string
  active?: boolean
  fab?: boolean
  onClick?: () => void
}

interface BottomNavProps {
  items: BottomNavItem[]
  className?: string
}

export function BottomNav({ items, className }: BottomNavProps) {
  const go = (item: BottomNavItem) => {
    if (item.onClick) {
      item.onClick()
      return
    }

    if (item.url) {
      openPage(item.url, { replace: true })
    }
  }

  return (
    <View className={cx('nav-bar', className)}>
      {items.map((item) => (
        <View
          className={cx('nav-item', item.active && 'active')}
          key={item.label}
          onClick={() => go(item)}
        >
          {item.fab ? (
            <View className='nav-fab'>
              <AppIcon name={item.icon} />
            </View>
          ) : (
            <View className='nav-icon'>
              <AppIcon name={item.icon} color={item.active ? '#ffffff' : '#000000'} />
            </View>
          )}
          <Text>{item.label}</Text>
        </View>
      ))}
    </View>
  )
}

export function MainNav({ active }: { active: 'map' | 'feed' | 'encounter' | 'team' | 'profile' }) {
  return (
    <BottomNav
      items={[
        { label: '地图', icon: 'map-pin', url: '/pages/map/index', active: active === 'map' },
        { label: '圈子', icon: 'message', url: '/pages/feed/index', active: active === 'feed' },
        { label: '偶遇', icon: 'radar', url: '/pages/encounter/index', active: active === 'encounter', fab: true },
        { label: '组队', icon: 'team', url: '/pages/team/index', active: active === 'team' },
        { label: '我的', icon: 'user', url: '/pages/profile/index', active: active === 'profile' },
      ]}
    />
  )
}
