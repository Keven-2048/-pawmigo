import { Image } from '@tarojs/components'

export type IconName =
  | 'arrow-left'
  | 'bell'
  | 'bone'
  | 'camera'
  | 'check'
  | 'chevron-right'
  | 'circle'
  | 'dog'
  | 'edit'
  | 'heart'
  | 'home'
  | 'info'
  | 'map-pin'
  | 'map'
  | 'menu'
  | 'message'
  | 'paw'
  | 'phone'
  | 'plus'
  | 'radar'
  | 'search'
  | 'settings'
  | 'shield'
  | 'star'
  | 'team'
  | 'trophy'
  | 'user'
  | 'wallet'
  | 'wechat'
  | 'x'

const paths: Record<IconName, string> = {
  'arrow-left': '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/>',
  bone: '<path d="M7.5 7.5a3 3 0 1 1 4-4l1 1 1-1a3 3 0 1 1 4 4l-10 10a3 3 0 1 1-4-4l1-1-1-1a3 3 0 1 1 4-4Z"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4Z"/><circle cx="12" cy="13" r="3"/>',
  check: '<path d="m20 6-11 11-5-5"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  circle: '<circle cx="12" cy="12" r="8"/><path d="M9 11h.01"/><path d="M15 11h.01"/><path d="M9.5 15c1.5 1 3.5 1 5 0"/>',
  dog: '<path d="M5 11V8l3-2 4 3 4-3 3 2v3"/><path d="M6 11v5a5 5 0 0 0 5 5h2a5 5 0 0 0 5-5v-5"/><path d="M9 14h.01"/><path d="M15 14h.01"/><path d="M11 17h2"/>',
  edit: '<path d="M4 20h4l11-11-4-4L4 16Z"/><path d="m14 6 4 4"/>',
  heart: '<path d="M20.8 8.6a5.2 5.2 0 0 0-8.8-3.7 5.2 5.2 0 0 0-8.8 3.7c0 5.2 8.8 10.4 8.8 10.4s8.8-5.2 8.8-10.4Z"/>',
  home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 10v6"/><path d="M12 7h.01"/>',
  map: '<path d="m4 6 5-2 6 2 5-2v14l-5 2-6-2-5 2Z"/><path d="M9 4v14"/><path d="M15 6v14"/>',
  'map-pin': '<path d="M12 22s7-5.4 7-12A7 7 0 0 0 5 10c0 6.6 7 12 7 12Z"/><circle cx="12" cy="10" r="2.5"/>',
  menu: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
  message: '<path d="M4 5h16v11H8l-4 4Z"/><path d="M8 9h8"/><path d="M8 13h5"/>',
  paw: '<circle cx="7" cy="9" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="17" cy="9" r="2"/><path d="M7.5 16.5c.8-3 2.4-5 4.5-5s3.7 2 4.5 5c.5 2-1 3.5-2.7 2.6a4.2 4.2 0 0 0-3.6 0c-1.7.9-3.2-.6-2.7-2.6Z"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2.1Z"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  radar: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 12 18 6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 0 0-1.7-1L14.5 3h-5l-.3 3a7 7 0 0 0-1.7 1L5.1 6l-2 3.5 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.5 2.4-1a7 7 0 0 0 1.7 1l.3 3h5l.3-3a7 7 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5c.1-.3.1-.7.1-1Z"/>',
  shield: '<path d="M12 3 20 6v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6Z"/><path d="m9 12 2 2 4-5"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.1-5.6-2.9-5.6 2.9 1.1-6.1L3 9.6l6.2-.9Z"/>',
  team: '<path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
  trophy: '<path d="M8 4h8v4a4 4 0 0 1-8 0Z"/><path d="M8 6H4a4 4 0 0 0 4 4"/><path d="M16 6h4a4 4 0 0 1-4 4"/><path d="M12 12v5"/><path d="M8 21h8"/><path d="M9 17h6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  wallet: '<path d="M3 7h18v12H3Z"/><path d="M3 7l3-4h12l3 4"/><path d="M16 13h5"/><path d="M18 13h.01"/>',
  wechat: '<path d="M10 6a7 5.5 0 0 0-7 5.5c0 1.8 1.2 3.4 3 4.4L5 19l3.2-1.7c.6.1 1.2.2 1.8.2a7 5.5 0 0 0 7-5.5A7 5.5 0 0 0 10 6Z"/><path d="M15 12a5.5 4.5 0 0 1 5.5 4.5c0 1.3-.8 2.5-2.1 3.3l.7 2.2-2.5-1.3c-.5.1-1 .2-1.6.2a5.5 4.5 0 0 1-5.5-4.5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
}

interface AppIconProps {
  name: IconName
  color?: string
  className?: string
}

function svgData(name: IconName, color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function AppIcon({ name, color = '#000000', className }: AppIconProps) {
  return <Image className={className || 'app-icon'} src={svgData(name, color)} mode='aspectFit' />
}
