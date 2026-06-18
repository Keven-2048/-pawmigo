import { useState } from 'react'
import { chooseImage, navigateBack, useRouter } from '@tarojs/taro'
import { Image, Text, Textarea, View } from '@tarojs/components'
import { Button } from '@/components/NutUI'
import { MOCK_IMAGES } from '@/constants/assets'
import { REPORT_REASONS } from '@/constants/options'
import { EmptyState } from '@/components/EmptyState'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { reportService, uploadService } from '@/services'
import type { ReportTargetType } from '@/types/domain'
import { showToast } from '@/utils/navigation'
import { isReportTargetType, parseRouteId } from '@/utils/route'
import './index.scss'

const TARGET_LABEL: Record<ReportTargetType, string> = {
  user: '用户',
  pet: '宠物',
  post: '动态',
  comment: '评论',
  invite: '邀请'
}

export default function ReportPage() {
  const ready = useAuthGuard()
  const router = useRouter()
  const targetType = isReportTargetType(router.params.targetType) ? router.params.targetType : undefined
  const targetId = parseRouteId(router.params.targetId)
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const pickEvidence = async () => {
    if (images.length >= 3) {
      showToast('图片最多 3 张')
      return
    }
    try {
      const res = await chooseImage({ count: 3 - images.length })
      const paths = (res.tempFilePaths || []) as string[]
      const uploaded: string[] = []
      for (const path of paths) {
        uploaded.push(await uploadService.uploadImage(path))
      }
      setImages((prev) => [...prev, ...uploaded].slice(0, 3))
    } catch (error) {
      showToast(error instanceof Error ? error.message : '图片上传失败')
    }
  }

  const submit = async () => {
    if (submitting) return
    if (!targetType || !targetId) {
      showToast('举报参数无效')
      return
    }
    if (!reason) {
      showToast('请先选择一个举报理由')
      return
    }
    setSubmitting(true)
    try {
      await reportService.create({
        targetType,
        targetId,
        reason,
        description,
        images
      })
      showToast('举报已提交', 'success')
      navigateBack()
    } catch (error) {
      showToast(error instanceof Error ? error.message : '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (!ready) {
    return (
      <View className="page report-page">
        <EmptyState title="正在进入举报" />
      </View>
    )
  }

  if (!targetType || !targetId) {
    return (
      <View className="page report-page">
        <EmptyState title="举报参数无效" description="请返回内容页后重新发起举报。" />
      </View>
    )
  }

  return (
    <View className="page report-page">
      <View className="report-page__topbar">
        <View className="report-page__back ui-icon ui-icon--back" onClick={() => navigateBack()} />
        <Text className="report-page__title">举报</Text>
        <Text className="report-page__spacer" />
      </View>

      <View className="report-target-card card">
        <View className="report-target-card__avatar">
          <Image className="report-target-card__image" src={MOCK_IMAGES.dog} mode="aspectFill" />
        </View>
        <View className="report-target-card__copy">
          <Text className="report-target-card__badge">{TARGET_LABEL[targetType]}举报</Text>
          <Text className="report-target-card__title">{TARGET_LABEL[targetType]}举报</Text>
          <Text className="report-target-card__desc">目标 ID #{targetId} · 平台会优先保护用户和宠物安全</Text>
        </View>
      </View>

      <View className="report-section">
        <View className="report-section__heading">
          <View className="report-section__icon ui-icon ui-icon--flag" />
          <Text className="report-section__title">请选择举报理由</Text>
        </View>
        <View className="report-reason-grid">
          {REPORT_REASONS.map((item) => (
            <View
              className={`report-reason-grid__item ${reason === item ? 'report-reason-grid__item--active' : ''}`}
              key={item}
              onClick={() => setReason(item)}
            >
              <Text>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className="report-section">
        <View className="report-section__heading">
          <View className="report-section__icon ui-icon ui-icon--badge" />
          <Text className="report-section__title">举报详情 (选填)</Text>
        </View>
        <Textarea className="report-card__textarea" maxlength={500} value={description} placeholder="请详细描述举报原因，以便我们更快处理..." onInput={(event) => setDescription(event.detail.value)} />
      </View>

      <View className="report-section">
        <View className="report-section__heading">
          <View className="report-section__icon ui-icon ui-icon--camera" />
          <Text className="report-section__title">证据截图 (最多3张)</Text>
        </View>
        <View className="report-evidence-grid">
          {images.map((image) => (
            <Image className="report-evidence__thumb" key={image} src={image} mode="aspectFill" onClick={() => setImages(images.filter((item) => item !== image))} />
          ))}
          <View className="report-evidence" onClick={pickEvidence}>
            <View className="report-evidence__plus ui-icon ui-icon--add" />
            <Text className="report-evidence__copy">上传图片</Text>
          </View>
        </View>
        <Text className="report-section__hint">支持 jpg、png 等格式，单张图片不超过 5MB</Text>
      </View>

      <Button className="report-submit" loading={submitting} disabled={submitting} onClick={submit}>提交举报</Button>
    </View>
  )
}
