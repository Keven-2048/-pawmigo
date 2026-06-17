package gormstore

import (
	"errors"
	"sort"
	"strings"

	"pawmigo/backend/api/internal/domain"
	storepkg "pawmigo/backend/api/internal/store"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type Store struct {
	db *gorm.DB
}

func New(db *gorm.DB) storepkg.Store {
	return &Store{db: db}
}

func (s *Store) Ping() error {
	db, err := s.db.DB()
	if err != nil {
		return err
	}
	return db.Ping()
}

func (s *Store) UserIDForToken(token string) (int64, bool) {
	if token == "dev-token-pawmigo" {
		return 1, true
	}
	return 0, false
}

func (s *Store) Login() map[string]any {
	user, _ := getUser(s.db, 1)
	var count int64
	s.db.Model(&Pet{}).Where("user_id = ? AND status = ?", 1, "normal").Count(&count)
	return map[string]any{"token": "dev-token-pawmigo", "user": userToDomain(user), "hasPet": count > 0}
}

func (s *Store) EnsureUserByOpenID(openid string) (domain.User, bool, error) {
	openid = strings.TrimSpace(openid)
	if openid == "" {
		return domain.User{}, false, errors.New("openid 不能为空")
	}

	var user User
	result := s.db.Where("open_id = ? AND status = ?", openid, "normal").Limit(1).Find(&user)
	if result.Error != nil {
		return domain.User{}, false, result.Error
	}
	if result.RowsAffected == 0 {
		now := nowISO()
		user = User{
			OpenID:              openid,
			Nickname:            "宠友",
			Status:              "normal",
			AllowNearbyVisible:  true,
			AllowStrangerInvite: true,
			AllowComment:        true,
			ShowOwnerName:       true,
			ShowCity:            true,
			NotificationEnabled: true,
			CreatedAt:           now,
			UpdatedAt:           now,
		}
		if err := s.db.Create(&user).Error; err != nil {
			return domain.User{}, false, err
		}
	}

	var count int64
	s.db.Model(&Pet{}).Where("user_id = ? AND status = ?", user.ID, "normal").Count(&count)
	return userToDomain(user), count > 0, nil
}

func (s *Store) Me(userID int64) (domain.User, error) {
	user, ok := getUser(s.db, userID)
	if !ok {
		return domain.User{}, storepkg.ErrUnauthorized
	}
	return userToDomain(user), nil
}

func (s *Store) UpdatePrivacy(userID int64, payload domain.PrivacySettings) (domain.User, error) {
	user, ok := getUser(s.db, userID)
	if !ok {
		return domain.User{}, storepkg.ErrNotFound
	}
	user.AllowNearbyVisible = payload.AllowNearbyVisible
	user.AllowStrangerInvite = payload.AllowStrangerInvite
	user.AllowComment = payload.AllowComment
	user.ShowOwnerName = payload.ShowOwnerName
	user.ShowCity = payload.ShowCity
	user.NotificationEnabled = payload.NotificationEnabled
	user.UpdatedAt = nowISO()
	if err := s.db.Save(&user).Error; err != nil {
		return domain.User{}, err
	}
	return userToDomain(user), nil
}

func (s *Store) MyPets(userID int64) []domain.Pet {
	var pets []Pet
	s.db.Where("user_id = ? AND status = ?", userID, "normal").Order("id DESC").Find(&pets)
	result := make([]domain.Pet, 0, len(pets))
	for _, pet := range pets {
		result = append(result, enrichPet(s.db, pet))
	}
	return result
}

func (s *Store) CreatePet(userID int64, payload storepkg.PetPayload) (domain.Pet, error) {
	if strings.TrimSpace(payload.Name) == "" {
		return domain.Pet{}, errors.New("请填写宠物昵称")
	}
	if err := validatePetPayload(payload); err != nil {
		return domain.Pet{}, err
	}
	visible := true
	if payload.Visible != nil {
		visible = *payload.Visible
	}
	var created Pet
	err := s.db.Transaction(func(tx *gorm.DB) error {
		var count int64
		tx.Model(&Pet{}).Where("user_id = ? AND status = ?", userID, "normal").Count(&count)
		now := nowISO()
		created = Pet{
			UserID:          userID,
			Name:            strings.TrimSpace(payload.Name),
			AvatarURL:       payload.AvatarURL,
			Type:            payload.Type,
			Breed:           payload.Breed,
			Gender:          payload.Gender,
			Birthday:        payload.Birthday,
			Weight:          payload.Weight,
			Sterilized:      payload.Sterilized,
			VaccineStatus:   payload.VaccineStatus,
			PersonalityTags: payload.PersonalityTags,
			InterestTags:    payload.InterestTags,
			Description:     payload.Description,
			IsDefault:       count == 0,
			Visible:         visible,
			Status:          "normal",
			CreatedAt:       now,
			UpdatedAt:       now,
		}
		return tx.Create(&created).Error
	})
	if err != nil {
		return domain.Pet{}, err
	}
	return enrichPet(s.db, created), nil
}

func (s *Store) UpdatePet(userID int64, id int64, payload storepkg.PetPayload) (domain.Pet, error) {
	if strings.TrimSpace(payload.Name) == "" {
		return domain.Pet{}, errors.New("请填写宠物昵称")
	}
	if err := validatePetPayload(payload); err != nil {
		return domain.Pet{}, err
	}
	pet, ok := getPet(s.db, id)
	if !ok {
		return domain.Pet{}, storepkg.ErrNotFound
	}
	if pet.UserID != userID {
		return domain.Pet{}, errors.New("只能操作自己的宠物")
	}
	visible := pet.Visible
	if payload.Visible != nil {
		visible = *payload.Visible
	}
	pet.Name = strings.TrimSpace(payload.Name)
	pet.AvatarURL = payload.AvatarURL
	pet.Type = payload.Type
	pet.Breed = payload.Breed
	pet.Gender = payload.Gender
	pet.Birthday = payload.Birthday
	pet.Weight = payload.Weight
	pet.Sterilized = payload.Sterilized
	pet.VaccineStatus = payload.VaccineStatus
	pet.PersonalityTags = payload.PersonalityTags
	pet.InterestTags = payload.InterestTags
	pet.Description = payload.Description
	pet.Visible = visible
	pet.UpdatedAt = nowISO()
	if err := s.db.Save(&pet).Error; err != nil {
		return domain.Pet{}, err
	}
	return enrichPet(s.db, pet), nil
}

func (s *Store) PetDetail(userID int64, id int64) (domain.Pet, error) {
	pet, ok := getPet(s.db, id)
	if !ok || !canSeePet(s.db, userID, pet) {
		return domain.Pet{}, errors.New("宠物不存在")
	}
	return enrichPet(s.db, pet), nil
}

func (s *Store) DeletePet(userID int64, id int64) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		pet, ok := getPet(tx, id)
		if !ok {
			return storepkg.ErrNotFound
		}
		if pet.UserID != userID {
			return errors.New("只能操作自己的宠物")
		}
		wasDefault := pet.IsDefault
		pet.Status = "deleted"
		pet.IsDefault = false
		pet.UpdatedAt = nowISO()
		if err := tx.Save(&pet).Error; err != nil {
			return err
		}
		if wasDefault {
			var next Pet
			if err := tx.Where("user_id = ? AND status = ?", userID, "normal").Order("id DESC").First(&next).Error; err == nil {
				next.IsDefault = true
				next.UpdatedAt = nowISO()
				return tx.Save(&next).Error
			}
		}
		return nil
	})
}

func (s *Store) SetDefaultPet(userID int64, id int64) (domain.Pet, error) {
	var selected Pet
	err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("id = ? AND user_id = ? AND status = ?", id, userID, "normal").First(&selected).Error; err != nil {
			return storepkg.ErrNotFound
		}
		if err := tx.Model(&Pet{}).Where("user_id = ? AND status = ?", userID, "normal").Update("is_default", false).Error; err != nil {
			return err
		}
		selected.IsDefault = true
		selected.UpdatedAt = nowISO()
		return tx.Save(&selected).Error
	})
	if err != nil {
		return domain.Pet{}, err
	}
	return enrichPet(s.db, selected), nil
}

func (s *Store) UpdateLocation(userID int64, payload map[string]any) map[string]any {
	now := nowISO()
	if city, ok := payload["city"].(string); ok {
		s.db.Model(&User{}).Where("id = ?", userID).Updates(map[string]any{"city": city, "updated_at": now})
	}
	lat, hasLat := numberValue(payload["latitude"])
	lng, hasLng := numberValue(payload["longitude"])
	if hasLat && hasLng {
		location := UserLocation{UserID: userID, Latitude: lat, Longitude: lng, Visible: true, UpdatedAt: now}
		if city, ok := payload["city"].(string); ok {
			location.City = city
		}
		if district, ok := payload["district"].(string); ok {
			location.District = district
		}
		s.db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "user_id"}},
			DoUpdates: clause.AssignmentColumns([]string{"latitude", "longitude", "city", "district", "visible", "updated_at"}),
		}).Create(&location)
	}
	return payload
}

func (s *Store) NearbyPets(userID int64, filter map[string]string, page int, pageSize int) domain.PageResult[domain.NearbyPet] {
	var pets []Pet
	s.db.Where("status = ?", "normal").Order("id ASC").Find(&pets)
	var currentLocation UserLocation
	hasCurrentLocation := s.db.Where("user_id = ?", userID).First(&currentLocation).Error == nil
	list := make([]domain.NearbyPet, 0)
	for _, pet := range pets {
		if pet.UserID == userID || !canSeePet(s.db, userID, pet) {
			continue
		}
		if value := filter["type"]; value != "" && value != "all" && pet.Type != value {
			continue
		}
		if value := filter["gender"]; value != "" && value != "all" && pet.Gender != value {
			continue
		}
		distance := 9000
		if hasCurrentLocation {
			var peerLocation UserLocation
			if err := s.db.Where("user_id = ?", pet.UserID).First(&peerLocation).Error; err == nil {
				distance = haversineMeters(currentLocation, peerLocation)
			}
		}
		nearby := domain.NearbyPet{
			Pet:                 enrichPet(s.db, pet),
			DistanceValue:       distance,
			CanInvite:           canInvitePet(s.db, userID, pet),
			CommonInterestCount: 0,
		}
		nearby.DistanceText = distanceText(distance)
		nearby.ActiveText = "最近活跃"
		list = append(list, nearby)
	}
	sort.SliceStable(list, func(i, j int) bool {
		return list[i].DistanceValue < list[j].DistanceValue
	})
	return pageResult(list, page, pageSize)
}

func (s *Store) CreateInvite(userID int64, payload storepkg.InvitePayload) (domain.Invite, error) {
	fromPet, ok := getPet(s.db, payload.FromPetID)
	if !ok || fromPet.UserID != userID {
		return domain.Invite{}, errors.New("只能操作自己的宠物")
	}
	toPet, ok := getPet(s.db, payload.ToPetID)
	if !ok {
		return domain.Invite{}, errors.New("接收宠物不存在")
	}
	if toPet.UserID == userID {
		return domain.Invite{}, errors.New("不能邀请自己的宠物")
	}
	if isBlockedBetween(s.db, userID, toPet.UserID) {
		return domain.Invite{}, errors.New("你们暂时不能互相邀请")
	}
	owner, _ := getUser(s.db, toPet.UserID)
	if !owner.AllowStrangerInvite {
		return domain.Invite{}, errors.New("对方暂未开放陌生邀请")
	}
	if isPast(payload.MeetTime) {
		return domain.Invite{}, errors.New("见面时间不能早于当前时间")
	}
	var invites []Invite
	s.db.Where("from_user_id = ? AND to_pet_id = ? AND status = ?", userID, payload.ToPetID, "pending").Find(&invites)
	for _, invite := range invites {
		if within24Hours(invite.CreatedAt) {
			return domain.Invite{}, errors.New("24 小时内已经向这只宠物发过邀请")
		}
	}
	if dailyInviteCount(s.db, userID) >= 10 {
		return domain.Invite{}, errors.New("今天的邀请次数已用完")
	}
	now := nowISO()
	invite := Invite{
		FromUserID:   userID,
		FromPetID:    fromPet.ID,
		ToUserID:     toPet.UserID,
		ToPetID:      toPet.ID,
		Type:         payload.Type,
		Title:        payload.Title,
		Description:  payload.Description,
		LocationName: payload.LocationName,
		MeetTime:     payload.MeetTime,
		Status:       "pending",
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	if err := s.db.Create(&invite).Error; err != nil {
		return domain.Invite{}, err
	}
	return hydrateInvite(s.db, invite), nil
}

func (s *Store) Invites(userID int64, box string, status string) []domain.Invite {
	var invites []Invite
	query := s.db
	if box == "sent" {
		query = query.Where("from_user_id = ?", userID)
	} else {
		query = query.Where("to_user_id = ?", userID)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}
	query.Order("id DESC").Find(&invites)
	result := make([]domain.Invite, 0, len(invites))
	for _, invite := range invites {
		peer := invite.FromUserID
		if peer == userID {
			peer = invite.ToUserID
		}
		if isBlockedBetween(s.db, userID, peer) {
			continue
		}
		result = append(result, hydrateInvite(s.db, invite))
	}
	return result
}

func (s *Store) InviteDetail(userID int64, id int64) (domain.Invite, error) {
	var invite Invite
	if err := s.db.Where("id = ? AND (from_user_id = ? OR to_user_id = ?)", id, userID, userID).First(&invite).Error; err != nil {
		return domain.Invite{}, storepkg.ErrNotFound
	}
	peer := invite.FromUserID
	if peer == userID {
		peer = invite.ToUserID
	}
	if isBlockedBetween(s.db, userID, peer) {
		return domain.Invite{}, storepkg.ErrNotFound
	}
	return hydrateInvite(s.db, invite), nil
}

func (s *Store) UpdateInvite(userID int64, id int64, action string) (domain.Invite, error) {
	var invite Invite
	err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("id = ?", id).First(&invite).Error; err != nil {
			return storepkg.ErrNotFound
		}
		peer := invite.FromUserID
		if peer == userID {
			peer = invite.ToUserID
		}
		if isBlockedBetween(tx, userID, peer) {
			return storepkg.ErrNotFound
		}
		if invite.Status != "pending" {
			return errors.New("当前邀请状态不可操作")
		}
		if action == "cancel" {
			if invite.FromUserID != userID {
				return errors.New("只有发起人可以取消邀请")
			}
			invite.Status = "cancelled"
		} else {
			if invite.ToUserID != userID {
				return errors.New("只有接收人可以处理邀请")
			}
			if action == "accept" {
				invite.Status = "accepted"
			} else {
				invite.Status = "rejected"
			}
		}
		invite.UpdatedAt = nowISO()
		return tx.Save(&invite).Error
	})
	if err != nil {
		return domain.Invite{}, err
	}
	return hydrateInvite(s.db, invite), nil
}

func (s *Store) Posts(userID int64, feed string, page int, pageSize int) domain.PageResult[domain.Post] {
	var posts []Post
	query := s.db.Where("status = ?", "normal")
	if feed == "mine" {
		query = query.Where("user_id = ?", userID)
	}
	query.Order("created_at DESC").Find(&posts)
	list := make([]domain.Post, 0, len(posts))
	for _, post := range posts {
		if isBlockedBetween(s.db, userID, post.UserID) {
			continue
		}
		if post.Visibility == "private" && post.UserID != userID {
			continue
		}
		list = append(list, hydratePost(s.db, post, userID))
	}
	return pageResult(list, page, pageSize)
}

func (s *Store) PostDetail(userID int64, id int64) (domain.Post, error) {
	post, ok := getPost(s.db, id)
	if !ok || isBlockedBetween(s.db, userID, post.UserID) {
		return domain.Post{}, errors.New("该动态暂不可见")
	}
	return hydratePost(s.db, post, userID), nil
}

func (s *Store) CreatePost(userID int64, payload storepkg.PostPayload) (domain.Post, error) {
	pet, ok := getPet(s.db, payload.PetID)
	if !ok || pet.UserID != userID {
		return domain.Post{}, errors.New("只能使用自己的宠物发布")
	}
	if strings.TrimSpace(payload.Content) == "" && len(payload.Images) == 0 {
		return domain.Post{}, errors.New("请填写文字或选择图片")
	}
	if len(payload.Images) > 9 {
		return domain.Post{}, errors.New("图片最多 9 张")
	}
	if len([]rune(strings.TrimSpace(payload.Content))) > 1000 {
		return domain.Post{}, errors.New("动态内容最多 1000 字")
	}
	user, _ := getUser(s.db, userID)
	now := nowISO()
	post := Post{
		UserID:       userID,
		PetID:        pet.ID,
		Content:      strings.TrimSpace(payload.Content),
		Images:       payload.Images,
		LocationName: payload.LocationName,
		City:         user.City,
		TopicTags:    payload.TopicTags,
		Visibility:   payload.Visibility,
		Status:       "normal",
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	if err := s.db.Create(&post).Error; err != nil {
		return domain.Post{}, err
	}
	return hydratePost(s.db, post, userID), nil
}

func (s *Store) DeletePost(userID int64, id int64) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		post, ok := getPost(tx, id)
		if !ok {
			return storepkg.ErrNotFound
		}
		if post.UserID != userID {
			return errors.New("只能删除自己的动态")
		}
		now := nowISO()
		post.Status = "deleted"
		post.CommentCount = 0
		post.UpdatedAt = now
		if err := tx.Save(&post).Error; err != nil {
			return err
		}
		return tx.Model(&Comment{}).Where("post_id = ? AND status = ?", id, "normal").Updates(map[string]any{"status": "deleted", "updated_at": now}).Error
	})
}

func (s *Store) ToggleLike(userID int64, id int64, liked bool) (domain.Post, error) {
	var post Post
	err := s.db.Transaction(func(tx *gorm.DB) error {
		var err error
		post, err = getPostForUpdate(tx, id)
		if err != nil {
			return storepkg.ErrNotFound
		}
		if isBlockedBetween(tx, userID, post.UserID) {
			return errors.New("该动态暂不可见")
		}
		var count int64
		tx.Model(&Like{}).Where("user_id = ? AND target_type = ? AND target_id = ?", userID, "post", id).Count(&count)
		wasLiked := count > 0
		if liked && !wasLiked {
			if err := tx.Create(&Like{UserID: userID, TargetType: "post", TargetID: id, CreatedAt: nowISO()}).Error; err != nil {
				return err
			}
			post.LikeCount++
		}
		if !liked && wasLiked {
			if err := tx.Where("user_id = ? AND target_type = ? AND target_id = ?", userID, "post", id).Delete(&Like{}).Error; err != nil {
				return err
			}
			post.LikeCount--
		}
		post.UpdatedAt = nowISO()
		return tx.Save(&post).Error
	})
	if err != nil {
		return domain.Post{}, err
	}
	return hydratePost(s.db, post, userID), nil
}

func (s *Store) Comments(userID int64, postID int64) ([]domain.Comment, error) {
	post, ok := getPost(s.db, postID)
	if !ok || isBlockedBetween(s.db, userID, post.UserID) {
		return nil, errors.New("该动态暂不可见")
	}
	var comments []Comment
	s.db.Where("post_id = ? AND status = ?", postID, "normal").Order("id ASC").Find(&comments)
	result := make([]domain.Comment, 0, len(comments))
	for _, comment := range comments {
		result = append(result, hydrateComment(s.db, comment))
	}
	return result, nil
}

func (s *Store) CreateComment(userID int64, postID int64, content string) (domain.Comment, error) {
	if strings.TrimSpace(content) == "" {
		return domain.Comment{}, errors.New("请填写评论内容")
	}
	var comment Comment
	err := s.db.Transaction(func(tx *gorm.DB) error {
		post, err := getPostForUpdate(tx, postID)
		if err != nil {
			return storepkg.ErrNotFound
		}
		if isBlockedBetween(tx, userID, post.UserID) {
			return errors.New("该动态暂不可见")
		}
		owner, _ := getUser(tx, post.UserID)
		if !owner.AllowComment && post.UserID != userID {
			return errors.New("对方暂未开放评论")
		}
		now := nowISO()
		comment = Comment{
			PostID:    post.ID,
			UserID:    userID,
			PetID:     defaultPetID(tx, userID),
			Content:   strings.TrimSpace(content),
			Status:    "normal",
			CreatedAt: now,
			UpdatedAt: now,
		}
		if err := tx.Create(&comment).Error; err != nil {
			return err
		}
		post.CommentCount++
		post.UpdatedAt = now
		return tx.Save(&post).Error
	})
	if err != nil {
		return domain.Comment{}, err
	}
	return hydrateComment(s.db, comment), nil
}

func (s *Store) DeleteComment(userID int64, id int64) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		var comment Comment
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ? AND status = ?", id, "normal").First(&comment).Error; err != nil {
			return storepkg.ErrNotFound
		}
		post, ok := getPost(tx, comment.PostID)
		if comment.UserID != userID && (!ok || post.UserID != userID) {
			return errors.New("无权删除该评论")
		}
		now := nowISO()
		comment.Status = "deleted"
		comment.UpdatedAt = now
		if err := tx.Save(&comment).Error; err != nil {
			return err
		}
		if post.CommentCount > 0 {
			post.CommentCount--
			post.UpdatedAt = now
			return tx.Save(&post).Error
		}
		return nil
	})
}

func (s *Store) CreateReport(userID int64, payload storepkg.ReportPayload) (domain.Report, error) {
	if payload.Reason == "" {
		return domain.Report{}, errors.New("请选择举报原因")
	}
	if !canReportTarget(s.db, userID, payload.TargetType, payload.TargetID) {
		return domain.Report{}, errors.New("举报目标不存在")
	}
	report := Report{
		ReporterUserID: userID,
		TargetType:     payload.TargetType,
		TargetID:       payload.TargetID,
		Reason:         payload.Reason,
		Description:    payload.Description,
		Images:         payload.Images,
		Status:         "pending",
		CreatedAt:      nowISO(),
	}
	if err := s.db.Create(&report).Error; err != nil {
		return domain.Report{}, err
	}
	return reportToDomain(report), nil
}

func (s *Store) CreateBlock(userID int64, payload storepkg.BlockPayload) (domain.Block, error) {
	if payload.BlockedUserID == userID {
		return domain.Block{}, errors.New("不能拉黑自己")
	}
	var existing Block
	if err := s.db.Where("user_id = ? AND blocked_user_id = ?", userID, payload.BlockedUserID).First(&existing).Error; err == nil {
		return blockToDomain(existing), nil
	}
	block := Block{UserID: userID, BlockedUserID: payload.BlockedUserID, Reason: payload.Reason, CreatedAt: nowISO()}
	if err := s.db.Create(&block).Error; err != nil {
		return domain.Block{}, err
	}
	return blockToDomain(block), nil
}

func (s *Store) Blocks(userID int64) []domain.Block {
	var blocks []Block
	s.db.Where("user_id = ?", userID).Order("id ASC").Find(&blocks)
	result := make([]domain.Block, 0, len(blocks))
	for _, block := range blocks {
		result = append(result, blockToDomain(block))
	}
	return result
}

func getUser(db *gorm.DB, id int64) (User, bool) {
	var user User
	if err := db.Where("id = ? AND status = ?", id, "normal").First(&user).Error; err != nil {
		return User{}, false
	}
	return user, true
}

func getPet(db *gorm.DB, id int64) (Pet, bool) {
	var pet Pet
	if err := db.Where("id = ? AND status = ?", id, "normal").First(&pet).Error; err != nil {
		return Pet{}, false
	}
	return pet, true
}

func getPost(db *gorm.DB, id int64) (Post, bool) {
	var post Post
	if err := db.Where("id = ? AND status = ?", id, "normal").First(&post).Error; err != nil {
		return Post{}, false
	}
	return post, true
}

func getPostForUpdate(db *gorm.DB, id int64) (Post, error) {
	var post Post
	err := db.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ? AND status = ?", id, "normal").First(&post).Error
	return post, err
}

func pet(db *gorm.DB, id int64) (Pet, bool) {
	return getPet(db, id)
}

func defaultPetID(db *gorm.DB, userID int64) int64 {
	var pet Pet
	if err := db.Where("user_id = ? AND is_default = ? AND status = ?", userID, true, "normal").First(&pet).Error; err != nil {
		return 0
	}
	return pet.ID
}

func canSeePet(db *gorm.DB, userID int64, pet Pet) bool {
	owner, ok := getUser(db, pet.UserID)
	if !ok || pet.Status != "normal" {
		return false
	}
	if pet.UserID == userID {
		return true
	}
	if isBlockedBetween(db, userID, pet.UserID) {
		return false
	}
	return owner.AllowNearbyVisible && pet.Visible
}

func canInvitePet(db *gorm.DB, userID int64, pet Pet) bool {
	owner, ok := getUser(db, pet.UserID)
	return ok && pet.UserID != userID && owner.AllowStrangerInvite && !isBlockedBetween(db, userID, pet.UserID)
}

func canReportTarget(db *gorm.DB, userID int64, targetType string, targetID int64) bool {
	switch targetType {
	case "user":
		user, ok := getUser(db, targetID)
		return ok && user.Status == "normal" && !isBlockedBetween(db, userID, targetID)
	case "pet":
		pet, ok := getPet(db, targetID)
		return ok && canSeePet(db, userID, pet)
	case "post":
		post, ok := getPost(db, targetID)
		return ok && canSeePost(db, userID, post)
	case "comment":
		var comment Comment
		if err := db.Where("id = ? AND status = ?", targetID, "normal").First(&comment).Error; err != nil {
			return false
		}
		post, ok := getPost(db, comment.PostID)
		return ok && canSeePost(db, userID, post)
	case "invite":
		var invite Invite
		if err := db.Where("id = ?", targetID).First(&invite).Error; err != nil {
			return false
		}
		return canSeeInvite(db, userID, invite)
	default:
		return false
	}
}

func canSeePost(db *gorm.DB, userID int64, post Post) bool {
	if post.Status != "normal" || isBlockedBetween(db, userID, post.UserID) {
		return false
	}
	return post.Visibility != "private" || post.UserID == userID
}

func canSeeInvite(db *gorm.DB, userID int64, invite Invite) bool {
	if invite.FromUserID != userID && invite.ToUserID != userID {
		return false
	}
	peer := invite.FromUserID
	if peer == userID {
		peer = invite.ToUserID
	}
	return !isBlockedBetween(db, userID, peer)
}

func isBlockedBetween(db *gorm.DB, a int64, b int64) bool {
	var count int64
	db.Model(&Block{}).Where("(user_id = ? AND blocked_user_id = ?) OR (user_id = ? AND blocked_user_id = ?)", a, b, b, a).Count(&count)
	return count > 0
}

func dailyInviteCount(db *gorm.DB, userID int64) int64 {
	var invites []Invite
	db.Where("from_user_id = ?", userID).Find(&invites)
	var count int64
	for _, invite := range invites {
		if isToday(invite.CreatedAt) {
			count++
		}
	}
	return count
}

func validatePetPayload(payload storepkg.PetPayload) error {
	if len(payload.PersonalityTags) > 10 {
		return errors.New("性格标签最多 10 个")
	}
	if len(payload.InterestTags) > 10 {
		return errors.New("兴趣标签最多 10 个")
	}
	if len([]rune(payload.Description)) > 500 {
		return errors.New("简介最多 500 字")
	}
	return nil
}

func numberValue(value any) (float64, bool) {
	switch v := value.(type) {
	case float64:
		return v, true
	case float32:
		return float64(v), true
	case int:
		return float64(v), true
	case int64:
		return float64(v), true
	case int32:
		return float64(v), true
	default:
		return 0, false
	}
}
