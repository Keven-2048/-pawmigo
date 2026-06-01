package repository

import (
	"gorm.io/gorm"

	"github.com/pawmigo/server/internal/model"
)

type UserRepo struct{ db *gorm.DB }

func NewUserRepo(db *gorm.DB) *UserRepo { return &UserRepo{db: db} }

// FindOrCreateByOpenID 登录时按 openid 取用户，没有则建。
func (r *UserRepo) FindOrCreateByOpenID(openID string) (*model.User, error) {
	var u model.User
	err := r.db.Where("open_id = ?", openID).First(&u).Error
	if err == gorm.ErrRecordNotFound {
		u = model.User{OpenID: openID, Nickname: "毛孩子主人"}
		if err := r.db.Create(&u).Error; err != nil {
			return nil, err
		}
		return &u, nil
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepo) FindByID(id uint64) (*model.User, error) {
	var u model.User
	if err := r.db.First(&u, id).Error; err != nil {
		return nil, err
	}
	return &u, nil
}
