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
  h5: {},
} satisfies UserConfigExport
