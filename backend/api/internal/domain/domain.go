package domain

type ID int64

type PrivacySettings struct {
	AllowNearbyVisible  bool `json:"allowNearbyVisible"`
	AllowStrangerInvite bool `json:"allowStrangerInvite"`
	AllowComment        bool `json:"allowComment"`
	ShowOwnerName       bool `json:"showOwnerName"`
	ShowCity            bool `json:"showCity"`
	NotificationEnabled bool `json:"notificationEnabled"`
}

type User struct {
	ID        ID              `json:"id"`
	OpenID    string          `json:"openid,omitempty"`
	Nickname  string          `json:"nickname"`
	AvatarURL string          `json:"avatarUrl"`
	City      string          `json:"city"`
	Status    string          `json:"status"`
	Privacy   PrivacySettings `json:"privacy"`
}

type Pet struct {
	ID              ID       `json:"id"`
	UserID          ID       `json:"userId"`
	Name            string   `json:"name"`
	AvatarURL       string   `json:"avatarUrl"`
	Type            string   `json:"type"`
	Breed           string   `json:"breed"`
	Gender          string   `json:"gender"`
	Birthday        string   `json:"birthday,omitempty"`
	Weight          float64  `json:"weight,omitempty"`
	Sterilized      bool     `json:"sterilized"`
	VaccineStatus   string   `json:"vaccineStatus"`
	PersonalityTags []string `json:"personalityTags"`
	InterestTags    []string `json:"interestTags"`
	Description     string   `json:"description"`
	IsDefault       bool     `json:"isDefault"`
	Visible         bool     `json:"visible"`
	Status          string   `json:"status"`
	CreatedAt       string   `json:"createdAt"`
	UpdatedAt       string   `json:"updatedAt"`
	OwnerName       string   `json:"ownerName,omitempty"`
	OwnerAvatarURL  string   `json:"ownerAvatarUrl,omitempty"`
	DistanceText    string   `json:"distanceText,omitempty"`
	ActiveText      string   `json:"activeText,omitempty"`
}

type NearbyPet struct {
	Pet
	DistanceValue       int  `json:"distanceValue"`
	CanInvite           bool `json:"canInvite"`
	CommonInterestCount int  `json:"commonInterestCount"`
}

type Invite struct {
	ID           ID     `json:"id"`
	FromUserID   ID     `json:"fromUserId"`
	FromPetID    ID     `json:"fromPetId"`
	ToUserID     ID     `json:"toUserId"`
	ToPetID      ID     `json:"toPetId"`
	Type         string `json:"type"`
	Title        string `json:"title"`
	Description  string `json:"description"`
	LocationName string `json:"locationName"`
	MeetTime     string `json:"meetTime"`
	Status       string `json:"status"`
	CreatedAt    string `json:"createdAt"`
	UpdatedAt    string `json:"updatedAt"`
	FromPet      *Pet   `json:"fromPet,omitempty"`
	ToPet        *Pet   `json:"toPet,omitempty"`
}

type Post struct {
	ID           ID       `json:"id"`
	UserID       ID       `json:"userId"`
	PetID        ID       `json:"petId"`
	Pet          *Pet     `json:"pet,omitempty"`
	Content      string   `json:"content"`
	Images       []string `json:"images"`
	LocationName string   `json:"locationName"`
	City         string   `json:"city"`
	TopicTags    []string `json:"topicTags"`
	Visibility   string   `json:"visibility"`
	LikeCount    int      `json:"likeCount"`
	CommentCount int      `json:"commentCount"`
	Liked        bool     `json:"liked"`
	Status       string   `json:"status"`
	CreatedAt    string   `json:"createdAt"`
	UpdatedAt    string   `json:"updatedAt"`
}

type Comment struct {
	ID        ID     `json:"id"`
	PostID    ID     `json:"postId"`
	UserID    ID     `json:"userId"`
	PetID     ID     `json:"petId,omitempty"`
	Pet       *Pet   `json:"pet,omitempty"`
	Content   string `json:"content"`
	Status    string `json:"status"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
}

type Report struct {
	ID             ID       `json:"id"`
	ReporterUserID ID       `json:"reporterUserId"`
	TargetType     string   `json:"targetType"`
	TargetID       ID       `json:"targetId"`
	Reason         string   `json:"reason"`
	Description    string   `json:"description"`
	Images         []string `json:"images"`
	Status         string   `json:"status"`
	CreatedAt      string   `json:"createdAt"`
}

type Block struct {
	ID            ID     `json:"id"`
	UserID        ID     `json:"userId"`
	BlockedUserID ID     `json:"blockedUserId"`
	Reason        string `json:"reason"`
	CreatedAt     string `json:"createdAt"`
}

type PageResult[T any] struct {
	List     []T `json:"list"`
	Page     int `json:"page"`
	PageSize int `json:"pageSize"`
	Total    int `json:"total"`
}
