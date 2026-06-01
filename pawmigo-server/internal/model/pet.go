package model

import (
	"time"

	"gorm.io/datatypes"
)

type Pet struct {
	ID          uint64         `gorm:"primaryKey" json:"id"`
	OwnerID     uint64         `gorm:"index;not null" json:"ownerId"`
	Name        string         `gorm:"size:64;not null" json:"name"`
	Breed       string         `gorm:"size:64" json:"breed"`
	Gender      string         `gorm:"size:8" json:"gender"`
	Age         int            `json:"age"`
	Personality datatypes.JSON `gorm:"type:json" json:"personality"` // ["社牛","运动健将"]
	Bio         string         `gorm:"size:255" json:"bio"`
	BoneCount   int64          `gorm:"default:0" json:"boneCount"`
	CreatedAt   time.Time      `json:"createdAt"`
}
