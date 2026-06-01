package model

import "time"

type User struct {
	ID          uint64    `gorm:"primaryKey" json:"id"`
	OpenID      string    `gorm:"uniqueIndex;size:64;not null" json:"-"`
	Phone       string    `gorm:"size:20" json:"phone,omitempty"`
	Nickname    string    `gorm:"size:64" json:"nickname"`
	Avatar      string    `gorm:"size:255" json:"avatar"`
	BoneBalance int64     `gorm:"default:0" json:"boneBalance"`
	CreatedAt   time.Time `json:"createdAt"`
}
