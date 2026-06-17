package gormstore

type User struct {
	ID                  int64  `gorm:"primaryKey;autoIncrement"`
	OpenID              string `gorm:"size:128;not null;uniqueIndex;index:idx_openid"`
	UnionID             string `gorm:"size:128"`
	Nickname            string `gorm:"size:64;default:''"`
	AvatarURL           string `gorm:"size:512;default:''"`
	Phone               string `gorm:"size:32;default:''"`
	Gender              string `gorm:"size:16;default:'unknown'"`
	City                string `gorm:"size:64;default:''"`
	Status              string `gorm:"size:32;default:'normal';index:idx_users_status"`
	AllowNearbyVisible  bool   `gorm:"default:true"`
	AllowStrangerInvite bool   `gorm:"default:true"`
	AllowComment        bool   `gorm:"default:true"`
	ShowOwnerName       bool   `gorm:"default:true"`
	ShowCity            bool   `gorm:"default:true"`
	NotificationEnabled bool   `gorm:"default:true"`
	LastLoginAt         string
	CreatedAt           string `gorm:"not null"`
	UpdatedAt           string `gorm:"not null"`
	DeletedAt           string
}

func (User) TableName() string { return "users" }

type Pet struct {
	ID              int64  `gorm:"primaryKey;autoIncrement"`
	UserID          int64  `gorm:"not null;index:idx_pets_user_id"`
	Name            string `gorm:"size:64;not null"`
	AvatarURL       string `gorm:"size:512;default:''"`
	Type            string `gorm:"size:32;not null;index:idx_pets_type"`
	Breed           string `gorm:"size:64;default:''"`
	Gender          string `gorm:"size:16;default:'unknown'"`
	Birthday        string
	Weight          float64
	Sterilized      bool     `gorm:"default:false"`
	VaccineStatus   string   `gorm:"size:32;default:'unknown'"`
	PersonalityTags []string `gorm:"serializer:json"`
	InterestTags    []string `gorm:"serializer:json"`
	Description     string   `gorm:"size:500;default:''"`
	IsDefault       bool     `gorm:"default:false"`
	Visible         bool     `gorm:"default:true;index:idx_pets_visible"`
	Status          string   `gorm:"size:32;default:'normal';index:idx_pets_status"`
	CreatedAt       string   `gorm:"not null"`
	UpdatedAt       string   `gorm:"not null"`
	DeletedAt       string
}

func (Pet) TableName() string { return "pets" }

type UserLocation struct {
	ID        int64   `gorm:"primaryKey;autoIncrement"`
	UserID    int64   `gorm:"not null;uniqueIndex"`
	Latitude  float64 `gorm:"not null"`
	Longitude float64 `gorm:"not null"`
	Geohash   string  `gorm:"size:32;default:'';index:idx_geohash"`
	City      string  `gorm:"size:64;default:''"`
	District  string  `gorm:"size:64;default:''"`
	Visible   bool    `gorm:"default:true;index:idx_user_locations_visible"`
	UpdatedAt string  `gorm:"not null"`
}

func (UserLocation) TableName() string { return "user_locations" }

type Invite struct {
	ID           int64  `gorm:"primaryKey;autoIncrement"`
	FromUserID   int64  `gorm:"not null;index:idx_invites_from_user"`
	FromPetID    int64  `gorm:"not null"`
	ToUserID     int64  `gorm:"not null;index:idx_invites_to_user"`
	ToPetID      int64  `gorm:"not null"`
	Type         string `gorm:"size:32;not null"`
	Title        string `gorm:"size:100;not null"`
	Description  string `gorm:"size:500;default:''"`
	LocationName string `gorm:"size:128;default:''"`
	MeetTime     string `gorm:"index:idx_invites_meet_time"`
	Status       string `gorm:"size:32;not null;default:'pending';index:idx_invites_status"`
	CreatedAt    string `gorm:"not null"`
	UpdatedAt    string `gorm:"not null"`
}

func (Invite) TableName() string { return "invites" }

type Post struct {
	ID           int64 `gorm:"primaryKey;autoIncrement"`
	UserID       int64 `gorm:"not null;index:idx_posts_user_id"`
	PetID        int64 `gorm:"not null;index:idx_posts_pet_id"`
	Content      string
	Images       []string `gorm:"serializer:json"`
	LocationName string   `gorm:"size:128;default:''"`
	City         string   `gorm:"size:64;default:'';index:idx_posts_city"`
	TopicTags    []string `gorm:"serializer:json"`
	Visibility   string   `gorm:"size:32;default:'public'"`
	LikeCount    int      `gorm:"default:0"`
	CommentCount int      `gorm:"default:0"`
	Status       string   `gorm:"size:32;default:'normal';index:idx_posts_status"`
	CreatedAt    string   `gorm:"not null;index:idx_posts_created_at"`
	UpdatedAt    string   `gorm:"not null"`
	DeletedAt    string
}

func (Post) TableName() string { return "posts" }

type Comment struct {
	ID        int64 `gorm:"primaryKey;autoIncrement"`
	PostID    int64 `gorm:"not null;index:idx_comments_post_id"`
	UserID    int64 `gorm:"not null;index:idx_comments_user_id"`
	PetID     int64
	ParentID  int64  `gorm:"default:0;index:idx_comments_parent_id"`
	Content   string `gorm:"size:500;not null"`
	Status    string `gorm:"size:32;default:'normal';index:idx_comments_status"`
	CreatedAt string `gorm:"not null"`
	UpdatedAt string `gorm:"not null"`
	DeletedAt string
}

func (Comment) TableName() string { return "comments" }

type Like struct {
	ID         int64  `gorm:"primaryKey;autoIncrement"`
	UserID     int64  `gorm:"not null;uniqueIndex:uk_user_target"`
	TargetType string `gorm:"size:32;not null;uniqueIndex:uk_user_target;index:idx_likes_target"`
	TargetID   int64  `gorm:"not null;uniqueIndex:uk_user_target;index:idx_likes_target"`
	CreatedAt  string `gorm:"not null"`
}

func (Like) TableName() string { return "likes" }

type Block struct {
	ID            int64  `gorm:"primaryKey;autoIncrement"`
	UserID        int64  `gorm:"not null;uniqueIndex:uk_block"`
	BlockedUserID int64  `gorm:"not null;uniqueIndex:uk_block"`
	Reason        string `gorm:"size:255;default:''"`
	CreatedAt     string `gorm:"not null"`
}

func (Block) TableName() string { return "blocks" }

type Report struct {
	ID             int64    `gorm:"primaryKey;autoIncrement"`
	ReporterUserID int64    `gorm:"not null"`
	TargetType     string   `gorm:"size:32;not null;index:idx_reports_target"`
	TargetID       int64    `gorm:"not null;index:idx_reports_target"`
	Reason         string   `gorm:"size:64;not null"`
	Description    string   `gorm:"size:500;default:''"`
	Images         []string `gorm:"serializer:json"`
	Status         string   `gorm:"size:32;default:'pending';index:idx_reports_status"`
	HandledBy      int64
	HandleNote     string `gorm:"size:500;default:''"`
	HandledAt      string
	CreatedAt      string `gorm:"not null"`
}

func (Report) TableName() string { return "reports" }
