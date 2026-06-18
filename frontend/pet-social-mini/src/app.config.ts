export default defineAppConfig({
  pages: [
    'pages/login/index',
    'pages/nearby/index',
    'pages/feed/index',
    'pages/invite/index',
    'pages/mine/index'
  ],
  subpackages: [
    {
      root: 'subpackages/pet',
      pages: ['create/index', 'edit/index', 'detail/index', 'manage/index']
    },
    {
      root: 'subpackages/post',
      pages: ['create/index', 'detail/index']
    },
    {
      root: 'subpackages/invite',
      pages: ['create/index', 'detail/index']
    },
    {
      root: 'subpackages/settings',
      pages: ['privacy/index', 'report/index', 'block/index']
    }
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#f7fbed',
    navigationBarTitleText: '宠友圈',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f7fbed',
    navigationStyle: 'custom'
  },
  tabBar: {
    color: '#727a68',
    selectedColor: '#326b00',
    backgroundColor: '#f7fbed',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/nearby/index',
        text: '附近',
        iconPath: 'assets/tabbar/nearby-stitch-v2.png',
        selectedIconPath: 'assets/tabbar/nearby-stitch-v2-active.png'
      },
      {
        pagePath: 'pages/feed/index',
        text: '社交圈',
        iconPath: 'assets/tabbar/feed-stitch-v3.png',
        selectedIconPath: 'assets/tabbar/feed-stitch-v3-active.png'
      },
      {
        pagePath: 'pages/invite/index',
        text: '邀请',
        iconPath: 'assets/tabbar/invite-stitch-v2.png',
        selectedIconPath: 'assets/tabbar/invite-stitch-v2-active.png'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的',
        iconPath: 'assets/tabbar/mine-stitch-v2.png',
        selectedIconPath: 'assets/tabbar/mine-stitch-v2-active.png'
      }
    ]
  },
  permission: {
    'scope.userLocation': {
      desc: '用于为你展示附近宠友，仅展示模糊距离'
    }
  }
})
