import { Image, Text, View } from '@tarojs/components'
import { GENDER_LABEL, PET_TYPE_LABEL } from '@/constants/options'
import type { NearbyPet, Pet } from '@/types/domain'
import { getPetSummary } from '@/utils/format'
import { TagList } from '../TagList'

interface PetCardProps {
  pet: Pet | NearbyPet
  compact?: boolean
  onOpen?: () => void
  onInvite?: () => void
}

function isNearby(pet: Pet | NearbyPet): pet is NearbyPet {
  return 'canInvite' in pet
}

export function PetCard({ pet, compact, onOpen, onInvite }: PetCardProps) {
  const nearby = isNearby(pet)

  return (
    <View className={`pet-card ${compact ? 'pet-card--compact' : ''}`} onClick={onOpen}>
      <View className="pet-card__media">
        <Image className="pet-card__image" src={pet.avatarUrl} mode="aspectFill" />
        {nearby ? <Text className="pet-card__status">{pet.activeText}</Text> : null}
      </View>
      <View className="pet-card__body">
        <View className="pet-card__title-row">
          <View className="pet-card__name-wrap">
            <Text className="pet-card__name">{pet.name}</Text>
            <View className="pet-card__meta-row">
              <View className="pet-card__line-icon ui-icon ui-icon--user" />
              <Text className="pet-card__meta">
                {PET_TYPE_LABEL[pet.type]} · {GENDER_LABEL[pet.gender]} · {getPetSummary(pet)}
              </Text>
            </View>
          </View>
          {nearby ? <Text className="pet-card__distance">{pet.distanceText}</Text> : null}
        </View>
        <Text className="pet-card__desc">{pet.description}</Text>
        <TagList tags={pet.personalityTags} max={3} />
        <View className="pet-card__footer">
          <Text className="pet-card__owner">{pet.ownerName ? `${pet.ownerName} · ` : ''}{nearby ? pet.activeText : pet.visible ? '附近可见' : '已隐藏'}</Text>
          {nearby && onInvite ? (
            <View className="pet-card__actions">
              <View
                className={`pet-card__invite ui-button ${pet.canInvite ? 'ui-button--primary' : 'ui-button--disabled'}`}
                onClick={(event) => {
                  event.stopPropagation()
                  if (pet.canInvite) onInvite()
                }}
              >
                {pet.canInvite ? '邀请' : '暂不可邀'}
              </View>
              <View
                className="pet-card__view ui-button ui-button--secondary"
                onClick={(event) => {
                  event.stopPropagation()
                  onOpen?.()
                }}
              >
                查看
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  )
}
