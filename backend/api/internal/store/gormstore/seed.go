package gormstore

import (
	"time"

	"gorm.io/gorm"
)

func SeedIfEmpty(db *gorm.DB) {
	var count int64
	db.Model(&User{}).Count(&count)
	if count == 0 {
		Seed(db)
	}
}

func Seed(db *gorm.DB) {
	now := nowISO()
	db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create([]User{
			{ID: 1, OpenID: "dev-openid-current", Nickname: "小松", AvatarURL: "/assets/mock/pet-owner.jpg", City: "上海", Status: "normal", AllowNearbyVisible: true, AllowStrangerInvite: true, AllowComment: true, ShowOwnerName: true, ShowCity: true, NotificationEnabled: true, CreatedAt: now, UpdatedAt: now},
			{ID: 2, OpenID: "dev-openid-user-2", Nickname: "阿梨", AvatarURL: "/assets/mock/pet-owner.jpg", City: "上海", Status: "normal", AllowNearbyVisible: true, AllowStrangerInvite: true, AllowComment: true, ShowOwnerName: true, ShowCity: true, NotificationEnabled: true, CreatedAt: now, UpdatedAt: now},
			{ID: 3, OpenID: "dev-openid-user-3", Nickname: "岑岑", AvatarURL: "/assets/mock/pet-owner.jpg", City: "上海", Status: "normal", AllowNearbyVisible: true, AllowStrangerInvite: false, AllowComment: true, ShowOwnerName: true, ShowCity: true, NotificationEnabled: true, CreatedAt: now, UpdatedAt: now},
		}).Error; err != nil {
			return err
		}
		if err := tx.Create([]Pet{
			{ID: 101, UserID: 1, Name: "豆包", AvatarURL: "/assets/mock/pet-dog-home.jpg", Type: "dog", Breed: "柯基", Gender: "male", Birthday: "2022-01-18", Weight: 12.4, Sterilized: true, VaccineStatus: "completed", PersonalityTags: []string{"活泼", "亲人"}, InterestTags: []string{"遛弯", "飞盘"}, Description: "短腿但跑得很认真。", IsDefault: true, Visible: true, Status: "normal", CreatedAt: now, UpdatedAt: now},
			{ID: 102, UserID: 2, Name: "豆豆", AvatarURL: "/assets/mock/pet-dog-golden.jpg", Type: "dog", Breed: "金毛", Gender: "female", Birthday: "2023-05-02", Weight: 5.8, Sterilized: false, VaccineStatus: "completed", PersonalityTags: []string{"友好", "粘人"}, InterestTags: []string{"拍照", "遛弯"}, Description: "喜欢坐在窗边看人。", IsDefault: true, Visible: true, Status: "normal", CreatedAt: now, UpdatedAt: now},
			{ID: 103, UserID: 3, Name: "糯米", AvatarURL: "/assets/mock/pet-cat-window.jpg", Type: "cat", Breed: "英短", Gender: "male", Birthday: "2021-08-12", Weight: 6.2, Sterilized: true, VaccineStatus: "completed", PersonalityTags: []string{"安静", "慢热"}, InterestTags: []string{"拍照"}, Description: "只接受远距离欣赏。", IsDefault: true, Visible: true, Status: "normal", CreatedAt: now, UpdatedAt: now},
		}).Error; err != nil {
			return err
		}
		if err := tx.Create([]UserLocation{
			{ID: 1, UserID: 1, Latitude: 31.2243000, Longitude: 121.4691000, City: "上海", District: "黄浦", Visible: true, UpdatedAt: now},
			{ID: 2, UserID: 2, Latitude: 31.2296800, Longitude: 121.4743600, City: "上海", District: "黄浦", Visible: true, UpdatedAt: now},
			{ID: 3, UserID: 3, Latitude: 31.2423800, Longitude: 121.4866000, City: "上海", District: "浦东", Visible: true, UpdatedAt: now},
		}).Error; err != nil {
			return err
		}
		if err := tx.Create(&Invite{ID: 501, FromUserID: 2, FromPetID: 102, ToUserID: 1, ToPetID: 101, Type: "walk", Title: "今晚一起遛弯吗？", LocationName: "世纪公园", MeetTime: time.Now().Add(7 * time.Hour).Format(time.RFC3339), Status: "pending", CreatedAt: now, UpdatedAt: now}).Error; err != nil {
			return err
		}
		return tx.Create(&Post{ID: 801, UserID: 2, PetID: 102, Content: "今天的午后阳光真的很舒服。", Images: []string{"/assets/mock/post-golden-lawn.jpg"}, LocationName: "城市森林公园", City: "上海", TopicTags: []string{"遛弯"}, Visibility: "public", LikeCount: 0, CommentCount: 0, Status: "normal", CreatedAt: now, UpdatedAt: now}).Error
	})
}
