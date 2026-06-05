declare const process: {
  env?: {
    NODE_ENV?: string
  }
}

const pages = [
  'pages/splash/index',
  'pages/map/index',
  'pages/map-filter/index',
  'pages/feed/index',
  'pages/encounter/index',
  'pages/encounter-guide/index',
  'pages/encounter-settings/index',
  'pages/team/index',
  'pages/team-create/index',
  'pages/profile/index',
  'pages/trophy-wall/index',
  'pages/settings/index',
  'pages/login/index',
  'pages/profile/pet-form',
  'pages/permissions/index',
  'pages/pet-detail/index',
  'pages/encounter-waiting/index',
  'pages/encounter-success/index',
  'pages/meeting-point/index',
  'pages/encounter-ongoing/index',
  'pages/encounter-feedback/index',
  'pages/chat/index',
  'pages/matching-radar/index',
  'pages/match-results/index',
  'pages/team-detail/index',
  'pages/post-flow/index',
  'pages/sticker-edit/index',
  'pages/safety-center/index',
  'pages/safety-privacy/index',
  'pages/emergency/index',
  'pages/notification-settings/index',
  'pages/wallet/index',
  'pages/wallet-tasks/index',
  'pages/reward-shop/index',
]

if (process.env?.NODE_ENV !== 'production') {
  pages.push('pages/design-system/index')
}

export default defineAppConfig({
  pages,
  window: {
    navigationBarTitleText: '遛遛 Pawmigo',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black',
    navigationStyle: 'custom',
  },
  permission: {
    'scope.userLocation': {
      desc: '用于发现附近正在遛狗的伙伴',
    },
  },
})
