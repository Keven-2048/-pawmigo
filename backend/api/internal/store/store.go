package store

import (
	"errors"

	"pawmigo/backend/api/internal/domain"
)

var (
	ErrUnauthorized = errors.New("用户未登录")
	ErrNotFound     = errors.New("资源不存在")
)

type Store interface {
	Ping() error
	UserIDForToken(token string) (int64, bool)
	Login() map[string]any
	EnsureUserByOpenID(openid string) (domain.User, bool, error)
	Me(userID int64) (domain.User, error)
	UpdatePrivacy(userID int64, payload domain.PrivacySettings) (domain.User, error)
	MyPets(userID int64) []domain.Pet
	CreatePet(userID int64, payload PetPayload) (domain.Pet, error)
	UpdatePet(userID int64, id int64, payload PetPayload) (domain.Pet, error)
	PetDetail(userID int64, id int64) (domain.Pet, error)
	DeletePet(userID int64, id int64) error
	SetDefaultPet(userID int64, id int64) (domain.Pet, error)
	UpdateLocation(userID int64, payload map[string]any) map[string]any
	NearbyPets(userID int64, filter map[string]string, page int, pageSize int) domain.PageResult[domain.NearbyPet]
	CreateInvite(userID int64, payload InvitePayload) (domain.Invite, error)
	Invites(userID int64, box string, status string) []domain.Invite
	InviteDetail(userID int64, id int64) (domain.Invite, error)
	UpdateInvite(userID int64, id int64, action string) (domain.Invite, error)
	Posts(userID int64, feed string, page int, pageSize int) domain.PageResult[domain.Post]
	PostDetail(userID int64, id int64) (domain.Post, error)
	CreatePost(userID int64, payload PostPayload) (domain.Post, error)
	DeletePost(userID int64, id int64) error
	ToggleLike(userID int64, id int64, liked bool) (domain.Post, error)
	Comments(userID int64, postID int64) ([]domain.Comment, error)
	CreateComment(userID int64, postID int64, content string) (domain.Comment, error)
	DeleteComment(userID int64, id int64) error
	CreateReport(userID int64, payload ReportPayload) (domain.Report, error)
	CreateBlock(userID int64, payload BlockPayload) (domain.Block, error)
	Blocks(userID int64) []domain.Block
}

type PetPayload struct {
	Name            string   `json:"name"`
	AvatarURL       string   `json:"avatarUrl"`
	Type            string   `json:"type"`
	Breed           string   `json:"breed"`
	Gender          string   `json:"gender"`
	Birthday        string   `json:"birthday"`
	Weight          float64  `json:"weight"`
	Sterilized      bool     `json:"sterilized"`
	VaccineStatus   string   `json:"vaccineStatus"`
	PersonalityTags []string `json:"personalityTags"`
	InterestTags    []string `json:"interestTags"`
	Description     string   `json:"description"`
	Visible         *bool    `json:"visible"`
}

type InvitePayload struct {
	FromPetID    int64  `json:"fromPetId"`
	ToPetID      int64  `json:"toPetId"`
	Type         string `json:"type"`
	Title        string `json:"title"`
	Description  string `json:"description"`
	LocationName string `json:"locationName"`
	MeetTime     string `json:"meetTime"`
}

type PostPayload struct {
	PetID        int64    `json:"petId"`
	Content      string   `json:"content"`
	Images       []string `json:"images"`
	LocationName string   `json:"locationName"`
	TopicTags    []string `json:"topicTags"`
	Visibility   string   `json:"visibility"`
}

type ReportPayload struct {
	TargetType  string   `json:"targetType"`
	TargetID    int64    `json:"targetId"`
	Reason      string   `json:"reason"`
	Description string   `json:"description"`
	Images      []string `json:"images"`
}

type BlockPayload struct {
	BlockedUserID int64  `json:"blockedUserId"`
	Reason        string `json:"reason"`
}
