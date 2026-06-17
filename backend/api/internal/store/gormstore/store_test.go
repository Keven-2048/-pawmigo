package gormstore

import (
	"bytes"
	"encoding/json"
	"errors"
	"testing"
	"time"

	"pawmigo/backend/api/internal/domain"
	storepkg "pawmigo/backend/api/internal/store"

	"gorm.io/gorm"
)

func newSeededStore(t *testing.T) (*Store, *gorm.DB) {
	t.Helper()

	db := OpenForTest()
	Seed(db)
	store, ok := New(db).(*Store)
	if !ok {
		t.Fatal("New did not return *Store")
	}
	return store, db
}

func petPayload(name string) storepkg.PetPayload {
	visible := true
	return storepkg.PetPayload{
		Name:            name,
		AvatarURL:       "/assets/mock/pet-cat-window.jpg",
		Type:            "cat",
		Breed:           "狸花",
		Gender:          "female",
		Birthday:        "2024-01-01",
		Weight:          4.2,
		Sterilized:      true,
		VaccineStatus:   "completed",
		PersonalityTags: []string{"安静"},
		InterestTags:    []string{"拍照"},
		Description:     "喜欢晒太阳",
		Visible:         &visible,
	}
}

func futureInvitePayload() storepkg.InvitePayload {
	return storepkg.InvitePayload{
		FromPetID:    101,
		ToPetID:      102,
		Type:         "walk",
		Title:        "一起散步",
		Description:  "今晚慢慢走一圈",
		LocationName: "社区花园",
		MeetTime:     time.Now().Add(3 * time.Hour).Format(time.RFC3339),
	}
}

func postPayload(content string, images []string) storepkg.PostPayload {
	return storepkg.PostPayload{
		PetID:        101,
		Content:      content,
		Images:       images,
		LocationName: "社区花园",
		TopicTags:    []string{"遛弯"},
		Visibility:   "public",
	}
}

func requireErrorMessage(t *testing.T, err error, message string) {
	t.Helper()
	if err == nil {
		t.Fatalf("expected error %q, got nil", message)
	}
	if err.Error() != message {
		t.Fatalf("expected error %q, got %q", message, err.Error())
	}
}

func TestAuthAndMe(t *testing.T) {
	t.Run("token lookup and current user", func(t *testing.T) {
		s, _ := newSeededStore(t)

		userID, ok := s.UserIDForToken("dev-token-pawmigo")
		if !ok || userID != 1 {
			t.Fatalf("expected dev token to resolve user 1, got userID=%d ok=%v", userID, ok)
		}
		if userID, ok := s.UserIDForToken("unknown-token"); ok || userID != 0 {
			t.Fatalf("expected unknown token to fail, got userID=%d ok=%v", userID, ok)
		}

		me, err := s.Me(1)
		if err != nil {
			t.Fatalf("Me(1) error: %v", err)
		}
		if me.ID != 1 || me.Nickname == "" {
			t.Fatalf("unexpected Me(1): %+v", me)
		}

		if _, err := s.Me(999); !errors.Is(err, storepkg.ErrUnauthorized) {
			t.Fatalf("expected ErrUnauthorized for Me(999), got %v", err)
		}
	})
}

func TestPetDefaultsAndDelete(t *testing.T) {
	t.Run("existing default remains after second pet creation", func(t *testing.T) {
		s, _ := newSeededStore(t)

		pets := s.MyPets(1)
		if len(pets) != 1 || pets[0].ID != 101 || !pets[0].IsDefault {
			t.Fatalf("expected seeded default pet 101, got %+v", pets)
		}

		created, err := s.CreatePet(1, petPayload("栗子"))
		if err != nil {
			t.Fatalf("CreatePet error: %v", err)
		}
		if created.IsDefault {
			t.Fatalf("created second pet should not be default: %+v", created)
		}

		pets = s.MyPets(1)
		defaults := make([]domain.ID, 0)
		for _, pet := range pets {
			if pet.IsDefault {
				defaults = append(defaults, pet.ID)
			}
		}
		if len(defaults) != 1 || defaults[0] != 101 {
			t.Fatalf("expected only pet 101 to remain default, got pets=%+v defaults=%+v", pets, defaults)
		}
	})

	t.Run("deleting default promotes remaining pet", func(t *testing.T) {
		s, _ := newSeededStore(t)

		created, err := s.CreatePet(1, petPayload("栗子"))
		if err != nil {
			t.Fatalf("CreatePet error: %v", err)
		}
		if err := s.DeletePet(1, 101); err != nil {
			t.Fatalf("DeletePet error: %v", err)
		}

		pets := s.MyPets(1)
		if len(pets) != 1 || pets[0].ID != created.ID || !pets[0].IsDefault {
			t.Fatalf("expected remaining created pet to become default, got %+v created=%+v", pets, created)
		}
	})
}

func TestNearbyPetsAndBlockVisibility(t *testing.T) {
	t.Run("nearby hides self and coordinates but keeps distance and invite state", func(t *testing.T) {
		s, _ := newSeededStore(t)

		nearby := s.NearbyPets(1, map[string]string{"type": "dog"}, 1, 20)
		if nearby.Total != 1 || len(nearby.List) != 1 {
			t.Fatalf("expected one nearby dog, got %+v", nearby)
		}
		item := nearby.List[0]
		if item.ID != 102 || item.UserID == 1 {
			t.Fatalf("expected other user's pet 102, got %+v", item)
		}
		if item.DistanceText == "" || !item.CanInvite {
			t.Fatalf("expected distance text and canInvite=true, got %+v", item)
		}
		raw, err := json.Marshal(nearby)
		if err != nil {
			t.Fatalf("marshal nearby: %v", err)
		}
		if bytes.Contains(raw, []byte("latitude")) || bytes.Contains(raw, []byte("longitude")) {
			t.Fatalf("nearby leaked raw coordinates: %s", string(raw))
		}
	})

	t.Run("blocking removes user from nearby", func(t *testing.T) {
		s, _ := newSeededStore(t)

		if _, err := s.CreateBlock(1, storepkg.BlockPayload{BlockedUserID: 2, Reason: "不想互动"}); err != nil {
			t.Fatalf("CreateBlock error: %v", err)
		}
		nearby := s.NearbyPets(1, map[string]string{"type": "dog"}, 1, 20)
		if nearby.Total != 0 || len(nearby.List) != 0 {
			t.Fatalf("expected blocked user2 pet to disappear, got %+v", nearby)
		}
	})
}

func TestInviteValidation(t *testing.T) {
	t.Run("self invite is rejected", func(t *testing.T) {
		s, _ := newSeededStore(t)

		payload := futureInvitePayload()
		payload.ToPetID = 101
		payload.Title = "自己约自己"
		_, err := s.CreateInvite(1, payload)
		requireErrorMessage(t, err, "不能邀请自己的宠物")
	})

	t.Run("past meet time is rejected", func(t *testing.T) {
		s, _ := newSeededStore(t)

		payload := futureInvitePayload()
		payload.Title = "迟到邀请"
		payload.MeetTime = time.Now().Add(-time.Hour).Format(time.RFC3339)
		_, err := s.CreateInvite(1, payload)
		requireErrorMessage(t, err, "见面时间不能早于当前时间")
	})

	t.Run("duplicate invite within 24 hours is rejected", func(t *testing.T) {
		s, _ := newSeededStore(t)

		payload := futureInvitePayload()
		if _, err := s.CreateInvite(1, payload); err != nil {
			t.Fatalf("first CreateInvite error: %v", err)
		}
		_, err := s.CreateInvite(1, payload)
		requireErrorMessage(t, err, "24 小时内已经向这只宠物发过邀请")
	})
}

func TestInviteVisibilityAndOwnership(t *testing.T) {
	t.Run("invite detail is visible until blocked", func(t *testing.T) {
		s, _ := newSeededStore(t)

		invite, err := s.InviteDetail(1, 501)
		if err != nil {
			t.Fatalf("InviteDetail error: %v", err)
		}
		if invite.ID != 501 || invite.FromUserID != 2 || invite.ToUserID != 1 {
			t.Fatalf("unexpected invite detail: %+v", invite)
		}

		if _, err := s.CreateBlock(1, storepkg.BlockPayload{BlockedUserID: 2}); err != nil {
			t.Fatalf("CreateBlock error: %v", err)
		}
		if _, err := s.InviteDetail(1, 501); !errors.Is(err, storepkg.ErrNotFound) {
			t.Fatalf("expected ErrNotFound after block, got %v", err)
		}
	})

	t.Run("only receiver can accept", func(t *testing.T) {
		s, _ := newSeededStore(t)

		_, err := s.UpdateInvite(2, 501, "accept")
		requireErrorMessage(t, err, "只有接收人可以处理邀请")

		invite, err := s.UpdateInvite(1, 501, "accept")
		if err != nil {
			t.Fatalf("receiver accept error: %v", err)
		}
		if invite.Status != "accepted" {
			t.Fatalf("expected accepted, got %+v", invite)
		}
	})

	t.Run("only receiver can reject", func(t *testing.T) {
		s, _ := newSeededStore(t)

		_, err := s.UpdateInvite(2, 501, "reject")
		requireErrorMessage(t, err, "只有接收人可以处理邀请")

		invite, err := s.UpdateInvite(1, 501, "reject")
		if err != nil {
			t.Fatalf("receiver reject error: %v", err)
		}
		if invite.Status != "rejected" {
			t.Fatalf("expected rejected, got %+v", invite)
		}
	})

	t.Run("only sender can cancel", func(t *testing.T) {
		s, _ := newSeededStore(t)

		_, err := s.UpdateInvite(1, 501, "cancel")
		requireErrorMessage(t, err, "只有发起人可以取消邀请")

		invite, err := s.UpdateInvite(2, 501, "cancel")
		if err != nil {
			t.Fatalf("sender cancel error: %v", err)
		}
		if invite.Status != "cancelled" {
			t.Fatalf("expected cancelled, got %+v", invite)
		}
	})
}

func TestPostsCommentsAndDelete(t *testing.T) {
	t.Run("post validation and successful creation", func(t *testing.T) {
		s, _ := newSeededStore(t)

		_, err := s.CreatePost(1, postPayload("   ", []string{}))
		requireErrorMessage(t, err, "请填写文字或选择图片")

		_, err = s.CreatePost(1, postPayload("图片太多", []string{"1", "2", "3", "4", "5", "6", "7", "8", "9", "10"}))
		requireErrorMessage(t, err, "图片最多 9 张")

		post, err := s.CreatePost(1, postPayload("今天很开心", []string{}))
		if err != nil {
			t.Fatalf("CreatePost error: %v", err)
		}
		if post.ID == 0 || post.Content != "今天很开心" || post.LikeCount != 0 || post.CommentCount != 0 {
			t.Fatalf("unexpected created post: %+v", post)
		}
	})

	t.Run("like and comment counters follow memory contract", func(t *testing.T) {
		s, _ := newSeededStore(t)

		post, err := s.CreatePost(1, postPayload("今天很开心", []string{}))
		if err != nil {
			t.Fatalf("CreatePost error: %v", err)
		}

		liked, err := s.ToggleLike(1, int64(post.ID), true)
		if err != nil {
			t.Fatalf("first ToggleLike error: %v", err)
		}
		liked, err = s.ToggleLike(1, int64(post.ID), true)
		if err != nil {
			t.Fatalf("second ToggleLike error: %v", err)
		}
		if liked.LikeCount != 1 || !liked.Liked {
			t.Fatalf("like should be idempotent at 1, got %+v", liked)
		}

		if _, err := s.CreateComment(1, int64(post.ID), "太可爱了"); err != nil {
			t.Fatalf("CreateComment error: %v", err)
		}
		updated, err := s.PostDetail(1, int64(post.ID))
		if err != nil {
			t.Fatalf("PostDetail error: %v", err)
		}
		if updated.CommentCount != 1 {
			t.Fatalf("expected comment count 1, got %+v", updated)
		}
	})

	t.Run("deleting a post hides comments and resets comment count", func(t *testing.T) {
		s, handle := newSeededStore(t)

		post, err := s.CreatePost(1, postPayload("今天很开心", []string{}))
		if err != nil {
			t.Fatalf("CreatePost error: %v", err)
		}
		if _, err := s.CreateComment(1, int64(post.ID), "太可爱了"); err != nil {
			t.Fatalf("CreateComment error: %v", err)
		}
		if err := s.DeletePost(1, int64(post.ID)); err != nil {
			t.Fatalf("DeletePost error: %v", err)
		}

		if _, err := s.Comments(1, int64(post.ID)); err == nil || err.Error() != "该动态暂不可见" {
			t.Fatalf("expected deleted post comments hidden, got %v", err)
		}

		var stored Post
		if err := handle.First(&stored, "id = ?", int64(post.ID)).Error; err != nil {
			t.Fatalf("load stored post: %v", err)
		}
		if stored.CommentCount != 0 {
			t.Fatalf("expected deleted post comment count reset to 0, got %+v", stored)
		}
		var normalComments int64
		if err := handle.Model(&Comment{}).Where("post_id = ? AND status = ?", int64(post.ID), "normal").Count(&normalComments).Error; err != nil {
			t.Fatalf("count normal comments: %v", err)
		}
		if normalComments != 0 {
			t.Fatalf("expected normal comments to be hidden/deleted, got %d", normalComments)
		}
	})
}

func TestBlockPiercesPostComments(t *testing.T) {
	t.Run("blocked post comments are inaccessible", func(t *testing.T) {
		s, _ := newSeededStore(t)

		if _, err := s.CreateBlock(1, storepkg.BlockPayload{BlockedUserID: 2}); err != nil {
			t.Fatalf("CreateBlock error: %v", err)
		}

		if _, err := s.Comments(1, 801); err == nil || err.Error() != "该动态暂不可见" {
			t.Fatalf("expected Comments to be blocked, got %v", err)
		}
		if _, err := s.CreateComment(1, 801, "太可爱了"); err == nil || err.Error() != "该动态暂不可见" {
			t.Fatalf("expected CreateComment to be blocked, got %v", err)
		}
	})
}

func TestPrivacyPersistence(t *testing.T) {
	t.Run("privacy update is reflected by Me", func(t *testing.T) {
		s, _ := newSeededStore(t)

		next := domain.PrivacySettings{
			AllowNearbyVisible:  false,
			AllowStrangerInvite: false,
			AllowComment:        true,
			ShowOwnerName:       false,
			ShowCity:            false,
			NotificationEnabled: false,
		}
		updated, err := s.UpdatePrivacy(1, next)
		if err != nil {
			t.Fatalf("UpdatePrivacy error: %v", err)
		}
		if updated.Privacy != next {
			t.Fatalf("UpdatePrivacy returned %+v, want %+v", updated.Privacy, next)
		}
		me, err := s.Me(1)
		if err != nil {
			t.Fatalf("Me error: %v", err)
		}
		if me.Privacy != next {
			t.Fatalf("Me privacy %+v, want %+v", me.Privacy, next)
		}
	})
}
