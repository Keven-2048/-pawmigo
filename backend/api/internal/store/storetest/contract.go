package storetest

import (
	"errors"
	"strings"
	"testing"
	"time"

	"pawmigo/backend/api/internal/domain"
	"pawmigo/backend/api/internal/store"
)

func RunContract(t *testing.T, newStore func(t *testing.T) store.Store) {
	t.Helper()

	t.Run("rejects unknown users and returns current user profile", func(t *testing.T) {
		s := newStore(t)

		if userID, ok := s.UserIDForToken("missing-token"); ok || userID != 0 {
			t.Fatalf("expected missing token to be rejected, got userID=%d ok=%v", userID, ok)
		}
		userID, ok := s.UserIDForToken("dev-token-pawmigo")
		if !ok || userID != 1 {
			t.Fatalf("expected dev token to resolve user 1, got userID=%d ok=%v", userID, ok)
		}
		me, err := s.Me(userID)
		if err != nil {
			t.Fatalf("Me(%d) error: %v", userID, err)
		}
		if me.ID != 1 || me.Nickname == "" {
			t.Fatalf("unexpected current user profile: %+v", me)
		}
		if _, err := s.Me(999); !errors.Is(err, store.ErrUnauthorized) {
			t.Fatalf("expected ErrUnauthorized for unknown user, got %v", err)
		}
	})

	t.Run("creates pets and validates required names", func(t *testing.T) {
		s := newStore(t)

		created, err := s.CreatePet(1, petPayload("栗子"))
		if err != nil {
			t.Fatalf("CreatePet error: %v", err)
		}
		if created.ID == 0 || created.UserID != 1 || created.Name != "栗子" {
			t.Fatalf("unexpected created pet: %+v", created)
		}
		if _, err := s.CreatePet(1, petPayload("  ")); err == nil {
			t.Fatal("expected empty CreatePet name to be rejected")
		}
		updatedPayload := petPayload("  ")
		if _, err := s.UpdatePet(1, int64(created.ID), updatedPayload); err == nil {
			t.Fatal("expected empty UpdatePet name to be rejected")
		}
	})

	t.Run("documents pending pet payload size validation contract", func(t *testing.T) {
		t.Skip("pending contract: both current store implementations accept oversized tag and description payloads; do not change behavior in this test-only task")
	})

	t.Run("reassigns the default pet after deleting the current default", func(t *testing.T) {
		s := newStore(t)

		created, err := s.CreatePet(1, petPayload("栗子"))
		if err != nil {
			t.Fatalf("CreatePet error: %v", err)
		}
		if err := s.DeletePet(1, 101); err != nil {
			t.Fatalf("DeletePet default error: %v", err)
		}
		pets := s.MyPets(1)
		if len(pets) != 1 {
			t.Fatalf("expected one remaining pet, got %+v", pets)
		}
		if pets[0].ID != created.ID || !pets[0].IsDefault {
			t.Fatalf("expected remaining pet %d to become default, got %+v", created.ID, pets)
		}
	})

	t.Run("creates invites and rejects duplicates and past meet times", func(t *testing.T) {
		s := newStore(t)

		payload := futureInvitePayload()
		invite, err := s.CreateInvite(1, payload)
		if err != nil {
			t.Fatalf("CreateInvite error: %v", err)
		}
		if invite.ID == 0 || invite.FromUserID != 1 || invite.ToUserID != 2 || invite.Status != "pending" {
			t.Fatalf("unexpected created invite: %+v", invite)
		}
		if _, err := s.CreateInvite(1, payload); err == nil {
			t.Fatal("expected duplicate invite to be rejected")
		}
		past := futureInvitePayload()
		past.ToPetID = 103
		past.MeetTime = time.Now().Add(-time.Hour).Format(time.RFC3339)
		if _, err := s.CreateInvite(1, past); err == nil {
			t.Fatal("expected past meet time to be rejected")
		}
	})

	t.Run("documents pending daily invite limit contract", func(t *testing.T) {
		t.Skip("pending contract: current store implementations enforce duplicate pending invites but not a cross-pet daily invite limit")
	})

	t.Run("rejects invite actions from non owners", func(t *testing.T) {
		s := newStore(t)

		if _, err := s.UpdateInvite(2, 501, "accept"); err == nil {
			t.Fatal("expected sender to be unable to accept their own outgoing invite")
		}
		if _, err := s.UpdateInvite(1, 501, "cancel"); err == nil {
			t.Fatal("expected receiver to be unable to cancel another user's invite")
		}
		accepted, err := s.UpdateInvite(1, 501, "accept")
		if err != nil {
			t.Fatalf("receiver accept error: %v", err)
		}
		if accepted.Status != "accepted" {
			t.Fatalf("expected accepted invite, got %+v", accepted)
		}
	})

	t.Run("creates posts and applies like and comment counters", func(t *testing.T) {
		s := newStore(t)

		post, err := s.CreatePost(1, postPayload("今天很开心"))
		if err != nil {
			t.Fatalf("CreatePost error: %v", err)
		}
		if post.ID == 0 || post.UserID != 1 || post.Content != "今天很开心" {
			t.Fatalf("unexpected created post: %+v", post)
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
			t.Fatalf("expected idempotent like count 1 and liked=true, got %+v", liked)
		}
		comment, err := s.CreateComment(1, int64(post.ID), "太可爱了")
		if err != nil {
			t.Fatalf("CreateComment error: %v", err)
		}
		withComment, err := s.PostDetail(1, int64(post.ID))
		if err != nil {
			t.Fatalf("PostDetail after comment error: %v", err)
		}
		if withComment.CommentCount != 1 {
			t.Fatalf("expected comment count 1, got %+v", withComment)
		}
		if err := s.DeleteComment(1, int64(comment.ID)); err != nil {
			t.Fatalf("DeleteComment error: %v", err)
		}
		afterDelete, err := s.PostDetail(1, int64(post.ID))
		if err != nil {
			t.Fatalf("PostDetail after delete comment error: %v", err)
		}
		if afterDelete.CommentCount != 0 {
			t.Fatalf("expected comment count 0 after deleting comment, got %+v", afterDelete)
		}
	})

	t.Run("documents pending daily post limit contract", func(t *testing.T) {
		t.Skip("pending contract: current store implementations validate empty content and image count, but do not enforce a daily post limit")
	})

	t.Run("hides deleted post comments and resets the public comment count", func(t *testing.T) {
		s := newStore(t)

		post, err := s.CreatePost(1, postPayload("准备删除的动态"))
		if err != nil {
			t.Fatalf("CreatePost error: %v", err)
		}
		if _, err := s.CreateComment(1, int64(post.ID), "先留个评论"); err != nil {
			t.Fatalf("CreateComment error: %v", err)
		}
		if err := s.DeletePost(1, int64(post.ID)); err != nil {
			t.Fatalf("DeletePost error: %v", err)
		}
		if _, err := s.Comments(1, int64(post.ID)); err == nil {
			t.Fatal("expected comments for a deleted post to be hidden")
		}
		if _, err := s.PostDetail(1, int64(post.ID)); err == nil {
			t.Fatal("expected deleted post detail to be hidden")
		}
	})

	t.Run("hides blocked users from post and invite lists", func(t *testing.T) {
		s := newStore(t)

		ownPost, err := s.CreatePost(1, postPayload("拉黑后对方不可见"))
		if err != nil {
			t.Fatalf("CreatePost before block error: %v", err)
		}
		ownInvite, err := s.CreateInvite(1, futureInvitePayload())
		if err != nil {
			t.Fatalf("CreateInvite before block error: %v", err)
		}
		if posts := s.Posts(1, "all", 1, 20); !hasPost(posts.List, 801) {
			t.Fatalf("expected seeded post 801 before blocking, got %+v", posts.List)
		}
		if invites := s.Invites(1, "received", "pending"); !hasInvite(invites, 501) {
			t.Fatalf("expected seeded invite 501 before blocking, got %+v", invites)
		}
		if _, err := s.CreateBlock(1, store.BlockPayload{BlockedUserID: 2, Reason: "不想互动"}); err != nil {
			t.Fatalf("CreateBlock error: %v", err)
		}
		if posts := s.Posts(1, "all", 1, 20); hasPost(posts.List, 801) {
			t.Fatalf("expected blocked user's post 801 to be hidden, got %+v", posts.List)
		}
		if invites := s.Invites(1, "received", "pending"); hasInvite(invites, 501) {
			t.Fatalf("expected blocked user's invite 501 to be hidden, got %+v", invites)
		}
		if reversePosts := s.Posts(2, "all", 1, 20); hasPost(reversePosts.List, int64(ownPost.ID)) {
			t.Fatalf("expected blocker user's post %d to be hidden from blocked peer, got %+v", ownPost.ID, reversePosts.List)
		}
		if reverseInvites := s.Invites(2, "received", "pending"); hasInvite(reverseInvites, int64(ownInvite.ID)) {
			t.Fatalf("expected blocker user's invite %d to be hidden from blocked peer, got %+v", ownInvite.ID, reverseInvites)
		}
	})

	t.Run("blocks direct invite detail and post comment lookup by id", func(t *testing.T) {
		s := newStore(t)

		if _, err := s.CreateBlock(1, store.BlockPayload{BlockedUserID: 2}); err != nil {
			t.Fatalf("CreateBlock error: %v", err)
		}
		if _, err := s.InviteDetail(1, 501); !errors.Is(err, store.ErrNotFound) {
			t.Fatalf("expected blocked invite detail to return ErrNotFound, got %v", err)
		}
		if _, err := s.Comments(1, 801); err == nil || !strings.Contains(err.Error(), "暂不可见") {
			t.Fatalf("expected blocked post comments to be unavailable, got %v", err)
		}
		if _, err := s.CreateComment(1, 801, "还能评论吗"); err == nil || !strings.Contains(err.Error(), "暂不可见") {
			t.Fatalf("expected blocked post comment creation to be unavailable, got %v", err)
		}
	})

	t.Run("persists reports for visible targets", func(t *testing.T) {
		s := newStore(t)

		report, err := s.CreateReport(1, store.ReportPayload{
			TargetType:  "post",
			TargetID:    801,
			Reason:      "spam",
			Description: "疑似广告",
			Images:      []string{"/assets/mock/evidence.jpg"},
		})
		if err != nil {
			t.Fatalf("CreateReport visible target error: %v", err)
		}
		if report.ID == 0 || report.ReporterUserID != 1 || report.TargetType != "post" || report.TargetID != 801 || report.Status != "pending" {
			t.Fatalf("unexpected persisted report: %+v", report)
		}
	})

	t.Run("documents pending report target validation contract", func(t *testing.T) {
		t.Skip("pending contract: current store implementations persist reports without checking target existence or block visibility")
	})
}

func petPayload(name string) store.PetPayload {
	visible := true
	return store.PetPayload{
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

func futureInvitePayload() store.InvitePayload {
	return store.InvitePayload{
		FromPetID:    101,
		ToPetID:      102,
		Type:         "walk",
		Title:        "一起散步",
		Description:  "今晚慢慢走一圈",
		LocationName: "社区花园",
		MeetTime:     time.Now().Add(3 * time.Hour).Format(time.RFC3339),
	}
}

func postPayload(content string) store.PostPayload {
	return store.PostPayload{
		PetID:        101,
		Content:      content,
		Images:       []string{},
		LocationName: "社区花园",
		TopicTags:    []string{"遛弯"},
		Visibility:   "public",
	}
}

func hasInvite(invites []domain.Invite, id int64) bool {
	for _, invite := range invites {
		if int64(invite.ID) == id {
			return true
		}
	}
	return false
}

func hasPost(posts []domain.Post, id int64) bool {
	for _, post := range posts {
		if int64(post.ID) == id {
			return true
		}
	}
	return false
}
