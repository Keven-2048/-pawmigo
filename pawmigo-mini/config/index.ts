import { UserConfigExport } from '@tarojs/cli'

export default {
  projectName: 'pawmigo-mini',
  date: '2026-06-02',
  designWidth: 390,
  deviceRatio: {
    390: 750 / 390,
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2,
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  framework: 'react',
  compiler: 'webpack5',
  copy: {
    patterns: [
      {
        from: 'src/assets/map-marker.png',
        to: 'dist/assets/map-marker.png',
      },
    ],
    options: {},
  },
  mini: {
    postcss: {
      pxtransform: {
        enable: true,
        config: {},
      },
      cssModules: {
        enable: false,
        config: {
          namingPattern: 'module',
          generateScopedName: '[name]__[local]___[hash:base64:5]',
        },
      },
    },
  },
  h5: {
    publicPath: '/',
    router: {
      mode: 'hash',
    },
    devServer: {
      host: '127.0.0.1',
      port: 10086,
      open: false,
    },
  },
} satisfies UserConfigExport
