package gormstore

import (
	"math"
	"strconv"
	"strings"
	"time"

	"pawmigo/backend/api/internal/domain"

	"gorm.io/gorm"
)

func nowISO() string {
	return time.Now().Format(time.RFC3339)
}

func isPast(value string) bool {
	parsed, err := time.Parse(time.RFC3339, value)
	return err == nil && parsed.Before(time.Now())
}

func within24Hours(value string) bool {
	parsed, err := time.Parse(time.RFC3339, value)
	return err == nil && time.Since(parsed) < 24*time.Hour
}

func isToday(value string) bool {
	parsed, err := time.Parse(time.RFC3339, value)
	if err != nil {
		return false
	}
	now := time.Now()
	start := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	return !parsed.Before(start)
}

func distanceText(value int) string {
	if value < 1000 {
		return "1km 内"
	}
	text := strconv.FormatFloat(float64(value)/1000, 'f', 1, 64)
	return strings.TrimSuffix(strings.TrimSuffix(text, "0"), ".") + "km"
}

func pageResult[T any](list []T, page int, pageSize int) domain.PageResult[T] {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	start := (page - 1) * pageSize
	if start >= len(list) {
		return domain.PageResult[T]{List: []T{}, Page: page, PageSize: pageSize, Total: len(list)}
	}
	end := start + pageSize
	if end > len(list) {
		end = len(list)
	}
	return domain.PageResult[T]{List: list[start:end], Page: page, PageSize: pageSize, Total: len(list)}
}

func userToDomain(user User) domain.User {
	return domain.User{
		ID:        domain.ID(user.ID),
		OpenID:    user.OpenID,
		Nickname:  user.Nickname,
		AvatarURL: user.AvatarURL,
		City:      user.City,
		Status:    user.Status,
		Privacy: domain.PrivacySettings{
			AllowNearbyVisible:  user.AllowNearbyVisible,
			AllowStrangerInvite: user.AllowStrangerInvite,
			AllowComment:        user.AllowComment,
			ShowOwnerName:       user.ShowOwnerName,
			ShowCity:            user.ShowCity,
			NotificationEnabled: user.NotificationEnabled,
		},
	}
}

func petToDomain(pet Pet) domain.Pet {
	return domain.Pet{
		ID:              domain.ID(pet.ID),
		UserID:          domain.ID(pet.UserID),
		Name:            pet.Name,
		AvatarURL:       pet.AvatarURL,
		Type:            pet.Type,
		Breed:           pet.Breed,
		Gender:          pet.Gender,
		Birthday:        pet.Birthday,
		Weight:          pet.Weight,
		Sterilized:      pet.Sterilized,
		VaccineStatus:   pet.VaccineStatus,
		PersonalityTags: pet.PersonalityTags,
		InterestTags:    pet.InterestTags,
		Description:     pet.Description,
		IsDefault:       pet.IsDefault,
		Visible:         pet.Visible,
		Status:          pet.Status,
		CreatedAt:       pet.CreatedAt,
		UpdatedAt:       pet.UpdatedAt,
	}
}

func inviteToDomain(invite Invite) domain.Invite {
	return domain.Invite{
		ID:           domain.ID(invite.ID),
		FromUserID:   domain.ID(invite.FromUserID),
		FromPetID:    domain.ID(invite.FromPetID),
		ToUserID:     domain.ID(invite.ToUserID),
		ToPetID:      domain.ID(invite.ToPetID),
		Type:         invite.Type,
		Title:        invite.Title,
		Description:  invite.Description,
		LocationName: invite.LocationName,
		MeetTime:     invite.MeetTime,
		Status:       invite.Status,
		CreatedAt:    invite.CreatedAt,
		UpdatedAt:    invite.UpdatedAt,
	}
}

func postToDomain(post Post) domain.Post {
	return domain.Post{
		ID:           domain.ID(post.ID),
		UserID:       domain.ID(post.UserID),
		PetID:        domain.ID(post.PetID),
		Content:      post.Content,
		Images:       post.Images,
		LocationName: post.LocationName,
		City:         post.City,
		TopicTags:    post.TopicTags,
		Visibility:   post.Visibility,
		LikeCount:    post.LikeCount,
		CommentCount: post.CommentCount,
		Status:       post.Status,
		CreatedAt:    post.CreatedAt,
		UpdatedAt:    post.UpdatedAt,
	}
}

func commentToDomain(comment Comment) domain.Comment {
	return domain.Comment{
		ID:        domain.ID(comment.ID),
		PostID:    domain.ID(comment.PostID),
		UserID:    domain.ID(comment.UserID),
		PetID:     domain.ID(comment.PetID),
		Content:   comment.Content,
		Status:    comment.Status,
		CreatedAt: comment.CreatedAt,
		UpdatedAt: comment.UpdatedAt,
	}
}

func reportToDomain(report Report) domain.Report {
	return domain.Report{
		ID:             domain.ID(report.ID),
		ReporterUserID: domain.ID(report.ReporterUserID),
		TargetType:     report.TargetType,
		TargetID:       domain.ID(report.TargetID),
		Reason:         report.Reason,
		Description:    report.Description,
		Images:         report.Images,
		Status:         report.Status,
		CreatedAt:      report.CreatedAt,
	}
}

func blockToDomain(block Block) domain.Block {
	return domain.Block{
		ID:            domain.ID(block.ID),
		UserID:        domain.ID(block.UserID),
		BlockedUserID: domain.ID(block.BlockedUserID),
		Reason:        block.Reason,
		CreatedAt:     block.CreatedAt,
	}
}

func enrichPet(db *gorm.DB, pet Pet) domain.Pet {
	result := petToDomain(pet)
	var owner User
	if err := db.Where("id = ? AND status = ?", pet.UserID, "normal").First(&owner).Error; err == nil {
		result.OwnerName = owner.Nickname
		if !owner.ShowOwnerName {
			result.OwnerName = "宠物主人"
		}
		result.OwnerAvatarURL = owner.AvatarURL
	}
	return result
}

func hydrateInvite(db *gorm.DB, invite Invite) domain.Invite {
	result := inviteToDomain(invite)
	if fromPet, ok := pet(db, invite.FromPetID); ok {
		enriched := enrichPet(db, fromPet)
		result.FromPet = &enriched
	}
	if toPet, ok := pet(db, invite.ToPetID); ok {
		enriched := enrichPet(db, toPet)
		result.ToPet = &enriched
	}
	return result
}

func hydratePost(db *gorm.DB, post Post, userID int64) domain.Post {
	result := postToDomain(post)
	if pet, ok := pet(db, post.PetID); ok {
		enriched := enrichPet(db, pet)
		result.Pet = &enriched
	}
	var count int64
	db.Model(&Like{}).Where("user_id = ? AND target_type = ? AND target_id = ?", userID, "post", post.ID).Count(&count)
	result.Liked = count > 0
	return result
}

func hydrateComment(db *gorm.DB, comment Comment) domain.Comment {
	result := commentToDomain(comment)
	if comment.PetID != 0 {
		if pet, ok := pet(db, comment.PetID); ok {
			enriched := enrichPet(db, pet)
			result.Pet = &enriched
		}
	}
	return result
}

func haversineMeters(a UserLocation, b UserLocation) int {
	const earthMeters = 6371000
	lat1 := a.Latitude * math.Pi / 180
	lat2 := b.Latitude * math.Pi / 180
	dLat := (b.Latitude - a.Latitude) * math.Pi / 180
	dLon := (b.Longitude - a.Longitude) * math.Pi / 180
	sinLat := math.Sin(dLat / 2)
	sinLon := math.Sin(dLon / 2)
	value := sinLat*sinLat + math.Cos(lat1)*math.Cos(lat2)*sinLon*sinLon
	return int(math.Round(earthMeters * 2 * math.Atan2(math.Sqrt(value), math.Sqrt(1-value))))
}
