import { PageContainer, StatisticCard } from '@ant-design/pro-components'
import { Alert, Col, Row, Spin } from 'antd'
import { useEffect, useState } from 'react'

import { dashboardService } from '../../services'
import type { DashboardStats } from '../../services/contracts'

const statItems: Array<{
  key: keyof DashboardStats
  title: string
  suffix: string
}> = [
  { key: 'totalUsers', title: '总用户', suffix: '人' },
  { key: 'totalPets', title: '总宠物', suffix: '只' },
  { key: 'totalPosts', title: '总动态', suffix: '条' },
  { key: 'pendingReports', title: '待处理举报', suffix: '件' },
]

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    dashboardService
      .stats()
      .then((result) => {
        if (!cancelled) {
          setStats(result)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '仪表盘加载失败')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <PageContainer title="仪表盘">
      {error ? <Alert showIcon type="error" message={error} /> : null}
      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {statItems.map((item) => (
            <Col key={item.key} xs={24} sm={12} xl={6}>
              <StatisticCard
                statistic={{
                  title: item.title,
                  value: stats?.[item.key] ?? 0,
                  suffix: item.suffix,
                }}
              />
            </Col>
          ))}
        </Row>
      </Spin>
    </PageContainer>
  )
}
