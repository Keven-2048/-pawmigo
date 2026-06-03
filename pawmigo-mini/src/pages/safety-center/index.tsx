import { Button, Text, View } from '@tarojs/components'
import { AppBar, IconButton } from '../../components/ui'
import { backOrHome, openPage } from '../../utils/navigation'

const safetyItems = [
  ['实名认证', '已完成', 'ok'],
  ['疫苗记录', '2026.05 已更新', 'ok'],
  ['位置脱敏', '200m 模糊展示', 'ok'],
  ['黑名单与屏蔽', '0 个风险对象', 'ok'],
]

export default function SafetyCenterPage() {
  return (
    <View className='app-screen'>
      <AppBar
        title='安全中心'
        left={<IconButton icon='arrow-left' tone='yellow' onClick={() => backOrHome('/pages/profile/index')} />}
        right={<IconButton icon='shield' tone='rose' onClick={() => openPage('/pages/safety-privacy/index')} />}
      />

      <View className='app-content' style='padding:20px;'>
        <View className='safety-score-card'>
          <Text className='eyebrow'>安全评分</Text>
          <Text className='safety-score'>98</Text>
          <Text className='text-muted' style='font-size:14px;font-weight:800;'>
            当前资料完整，偶遇风险较低
          </Text>
        </View>

        <View className='card' style='padding:0;overflow:hidden;margin-bottom:20px;'>
          {safetyItems.map(([title, meta, state]) => (
            <View className='safety-item' key={title}>
              <View className='row' style='gap:12px;'>
                <View className={state === 'ok' ? 'safety-dot safety-dot-ok' : 'safety-dot'} />
                <View className='stack' style='gap:2px;'>
                  <Text style='font-size:16px;font-weight:900;'>{title}</Text>
                  <Text className='text-xs text-muted'>{meta}</Text>
                </View>
              </View>
              <Text style='font-size:20px;font-weight:900;'>›</Text>
            </View>
          ))}
        </View>

        <View
          className='card'
          style='background:#f8fafc;border-style:dashed;'
          onClick={() => openPage('/pages/safety-privacy/index')}
        >
          <Text style='display:block;font-size:18px;font-weight:900;margin-bottom:10px;'>偶遇守则</Text>
          <Text className='text-sm text-muted' style='font-weight:700;line-height:1.8;'>
            首次见面请选择公开场地。系统只展示模糊距离，不暴露实时精确坐标。遇到异常可一键求助或举报。
          </Text>
        </View>
      </View>

      <View className='emergency-bar'>
        <Button className='danger-button' hoverClass='button-hover' onClick={() => openPage('/pages/emergency/index')}>
          紧急求助
        </Button>
      </View>
    </View>
  )
}
