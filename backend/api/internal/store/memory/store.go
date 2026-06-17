package memory

import (
	"errors"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"pawmigo/backend/api/internal/domain"
	storepkg "pawmigo/backend/api/internal/store"
)

var (
	ErrUnauthorized = storepkg.ErrUnauthorized
	ErrNotFound     = storepkg.ErrNotFound
)

type Store struct {
	mu        sync.Mutex
	nextID    int64
	token     string
	tokenUser map[string]int64
	users     []domain.User
	pets      []domain.Pet
	distances map[int64]int
	invites   []domain.Invite
	posts     []domain.Post
	comments  []domain.Comment
	reports   []domain.Report
	blocks    []domain.Block
	liked     map[int64]map[int64]bool
}

func NewStore() *Store {
	now := nowISO()
	privacy := domain.PrivacySettings{
		AllowNearbyVisible:  true,
		AllowStrangerInvite: true,
		AllowComment:        true,
		ShowOwnerName:       true,
		ShowCity:            true,
		NotificationEnabled: true,
	}
	return &Store{
		nextID:    2000,
		token:     "dev-token-pawmigo",
		tokenUser: map[string]int64{"dev-token-pawmigo": 1},
		users: []domain.User{
			{ID: 1, OpenID: "dev-openid-current", Nickname: "小松", AvatarURL: "/assets/mock/pet-owner.jpg", City: "上海", Status: "normal", Privacy: privacy},
			{ID: 2, Nickname: "阿梨", AvatarURL: "/assets/mock/pet-owner.jpg", City: "上海", Status: "normal", Privacy: privacy},
			{ID: 3, Nickname: "岑岑", AvatarURL: "/assets/mock/pet-owner.jpg", City: "上海", Status: "normal", Privacy: domain.PrivacySettings{AllowNearbyVisible: true, AllowStrangerInvite: false, AllowComment: true, ShowOwnerName: true, ShowCity: true, NotificationEnabled: true}},
		},
		pets: []domain.Pet{
			{ID: 101, UserID: 1, Name: "豆包", AvatarURL: "/assets/mock/pet-dog-home.jpg", Type: "dog", Breed: "柯基", Gender: "male", Birthday: "2022-01-18", Weight: 12.4, Sterilized: true, VaccineStatus: "completed", PersonalityTags: []string{"活泼", "亲人"}, InterestTags: []string{"遛弯", "飞盘"}, Description: "短腿但跑得很认真。", IsDefault: true, Visible: true, Status: "normal", CreatedAt: now, UpdatedAt: now},
			{ID: 102, UserID: 2, Name: "豆豆", AvatarURL: "/assets/mock/pet-dog-golden.jpg", Type: "dog", Breed: "金毛", Gender: "female", Birthday: "2023-05-02", Weight: 5.8, Sterilized: false, VaccineStatus: "completed", PersonalityTags: []string{"友好", "粘人"}, InterestTags: []string{"拍照", "遛弯"}, Description: "喜欢坐在窗边看人。", IsDefault: true, Visible: true, Status: "normal", CreatedAt: now, UpdatedAt: now},
			{ID: 103, UserID: 3, Name: "糯米", AvatarURL: "/assets/mock/pet-cat-window.jpg", Type: "cat", Breed: "英短", Gender: "male", Birthday: "2021-08-12", Weight: 6.2, Sterilized: true, VaccineStatus: "completed", PersonalityTags: []string{"安静", "慢热"}, InterestTags: []string{"拍照"}, Description: "只接受远距离欣赏。", IsDefault: true, Visible: true, Status: "normal", CreatedAt: now, UpdatedAt: now},
		},
		distances: map[int64]int{102: 780, 103: 2600},
		invites: []domain.Invite{
			{ID: 501, FromUserID: 2, FromPetID: 102, ToUserID: 1, ToPetID: 101, Type: "walk", Title: "今晚一起遛弯吗？", LocationName: "世纪公园", MeetTime: time.Now().Add(7 * time.Hour).Format(time.RFC3339), Status: "pending", CreatedAt: now, UpdatedAt: now},
		},
		posts: []domain.Post{
			{ID: 801, UserID: 2, PetID: 102, Content: "今天的午后阳光真的很舒服。", Images: []string{"/assets/mock/post-golden-lawn.jpg"}, LocationName: "城市森林公园", City: "上海", TopicTags: []string{"遛弯"}, Visibility: "public", LikeCount: 0, CommentCount: 0, Liked: false, Status: "normal", CreatedAt: now, UpdatedAt: now},
		},
		comments: []domain.Comment{},
		reports:  []domain.Report{},
		blocks:   []domain.Block{},
		liked:    map[int64]map[int64]bool{},
	}
}

func (s *Store) UserIDForToken(token string) (int64, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	id, ok := s.tokenUser[token]
	return id, ok
}

func (s *Store) Login() map[string]any {
	s.mu.Lock()
	defer s.mu.Unlock()
	user := s.mustUser(1)
	hasPet := false
	for _, pet := range s.pets {
		if pet.UserID == 1 && pet.Status == "normal" {
			hasPet = true
			break
		}
	}
	return map[string]any{"token": s.token, "user": user, "hasPet": hasPet}
}

func (s *Store) Me(userID int64) (domain.User, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	user, ok := s.user(userID)
	if !ok {
		return domain.User{}, ErrUnauthorized
	}
	return user, nil
}

func (s *Store) UpdatePrivacy(userID int64, payload domain.PrivacySettings) (domain.User, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for index := range s.users {
		if int64(s.users[index].ID) == userID && s.users[index].Status == "normal" {
			s.users[index].Privacy = payload
			return s.users[index], nil
		}
	}
	return domain.User{}, ErrNotFound
}

func (s *Store) MyPets(userID int64) []domain.Pet {
	s.mu.Lock()
	defer s.mu.Unlock()
	var result []domain.Pet
	for _, pet := range s.pets {
		if int64(pet.UserID) == userID && pet.Status == "normal" {
			result = append(result, s.enrichPet(pet))
		}
	}
	return result
}

type PetPayload = storepkg.PetPayload

func (s *Store) CreatePet(userID int64, payload PetPayload) (domain.Pet, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
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
	hasPet := false
	for _, pet := range s.pets {
		if int64(pet.UserID) == userID && pet.Status == "normal" {
			hasPet = true
			break
		}
	}
	now := nowISO()
	pet := domain.Pet{
		ID:              domain.ID(s.next()),
		UserID:          domain.ID(userID),
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
		IsDefault:       !hasPet,
		Visible:         visible,
		Status:          "normal",
		CreatedAt:       now,
		UpdatedAt:       now,
	}
	s.pets = append([]domain.Pet{pet}, s.pets...)
	return s.enrichPet(pet), nil
}

func (s *Store) UpdatePet(userID int64, id int64, payload PetPayload) (domain.Pet, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if strings.TrimSpace(payload.Name) == "" {
		return domain.Pet{}, errors.New("请填写宠物昵称")
	}
	if err := validatePetPayload(payload); err != nil {
		return domain.Pet{}, err
	}
	for index := range s.pets {
		if int64(s.pets[index].ID) == id && s.pets[index].Status == "normal" {
			if int64(s.pets[index].UserID) != userID {
				return domain.Pet{}, errors.New("只能操作自己的宠物")
			}
			visible := s.pets[index].Visible
			if payload.Visible != nil {
				visible = *payload.Visible
			}
			s.pets[index].Name = strings.TrimSpace(payload.Name)
			s.pets[index].AvatarURL = payload.AvatarURL
			s.pets[index].Type = payload.Type
			s.pets[index].Breed = payload.Breed
			s.pets[index].Gender = payload.Gender
			s.pets[index].Birthday = payload.Birthday
			s.pets[index].Weight = payload.Weight
			s.pets[index].Sterilized = payload.Sterilized
			s.pets[index].VaccineStatus = payload.VaccineStatus
			s.pets[index].PersonalityTags = payload.PersonalityTags
			s.pets[index].InterestTags = payload.InterestTags
			s.pets[index].Description = payload.Description
			s.pets[index].Visible = visible
			s.pets[index].UpdatedAt = nowISO()
			return s.enrichPet(s.pets[index]), nil
		}
	}
	return domain.Pet{}, ErrNotFound
}

func (s *Store) PetDetail(userID int64, id int64) (domain.Pet, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	pet, ok := s.pet(id)
	if !ok || !s.canSeePet(userID, pet) {
		return domain.Pet{}, errors.New("宠物不存在")
	}
	return s.enrichPet(pet), nil
}

func (s *Store) DeletePet(userID int64, id int64) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for index := range s.pets {
		if int64(s.pets[index].ID) == id && s.pets[index].Status == "normal" {
			if int64(s.pets[index].UserID) != userID {
				return errors.New("只能操作自己的宠物")
			}
			wasDefault := s.pets[index].IsDefault
			s.pets[index].Status = "deleted"
			s.pets[index].IsDefault = false
			s.pets[index].UpdatedAt = nowISO()
			if wasDefault {
				for nextIndex := range s.pets {
					if int64(s.pets[nextIndex].UserID) == userID && s.pets[nextIndex].Status == "normal" {
						s.pets[nextIndex].IsDefault = true
						break
					}
				}
			}
			return nil
		}
	}
	return ErrNotFound
}

func (s *Store) SetDefaultPet(userID int64, id int64) (domain.Pet, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	var selected *domain.Pet
	for index := range s.pets {
		if int64(s.pets[index].UserID) == userID && s.pets[index].Status == "normal" {
			s.pets[index].IsDefault = int64(s.pets[index].ID) == id
			if s.pets[index].IsDefault {
				selected = &s.pets[index]
			}
		}
	}
	if selected == nil {
		return domain.Pet{}, ErrNotFound
	}
	return s.enrichPet(*selected), nil
}

func (s *Store) UpdateLocation(userID int64, payload map[string]any) map[string]any {
	s.mu.Lock()
	defer s.mu.Unlock()
	if city, ok := payload["city"].(string); ok {
		for index := range s.users {
			if int64(s.users[index].ID) == userID {
				s.users[index].City = city
			}
		}
	}
	return payload
}

func (s *Store) NearbyPets(userID int64, filter map[string]string, page int, pageSize int) domain.PageResult[domain.NearbyPet] {
	s.mu.Lock()
	defer s.mu.Unlock()
	var list []domain.NearbyPet
	for _, pet := range s.pets {
		if int64(pet.UserID) == userID || !s.canSeePet(userID, pet) {
			continue
		}
		if value := filter["type"]; value != "" && value != "all" && pet.Type != value {
			continue
		}
		if value := filter["gender"]; value != "" && value != "all" && pet.Gender != value {
			continue
		}
		distance := s.distances[int64(pet.ID)]
		if distance == 0 {
			distance = 9000
		}
		nearby := domain.NearbyPet{
			Pet:                 s.enrichPet(pet),
			DistanceValue:       distance,
			CanInvite:           s.canInvitePet(userID, pet),
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

type InvitePayload = storepkg.InvitePayload

func (s *Store) CreateInvite(userID int64, payload InvitePayload) (domain.Invite, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	fromPet, ok := s.pet(payload.FromPetID)
	if !ok || int64(fromPet.UserID) != userID {
		return domain.Invite{}, errors.New("只能操作自己的宠物")
	}
	toPet, ok := s.pet(payload.ToPetID)
	if !ok {
		return domain.Invite{}, errors.New("接收宠物不存在")
	}
	if int64(toPet.UserID) == userID {
		return domain.Invite{}, errors.New("不能邀请自己的宠物")
	}
	if s.isBlockedBetween(userID, int64(toPet.UserID)) {
		return domain.Invite{}, errors.New("你们暂时不能互相邀请")
	}
	owner, _ := s.user(int64(toPet.UserID))
	if !owner.Privacy.AllowStrangerInvite {
		return domain.Invite{}, errors.New("对方暂未开放陌生邀请")
	}
	if isPast(payload.MeetTime) {
		return domain.Invite{}, errors.New("见面时间不能早于当前时间")
	}
	for _, invite := range s.invites {
		if int64(invite.FromUserID) == userID && int64(invite.ToPetID) == payload.ToPetID && invite.Status == "pending" && within24Hours(invite.CreatedAt) {
			return domain.Invite{}, errors.New("24 小时内已经向这只宠物发过邀请")
		}
	}
	if s.dailyInviteCount(userID) >= 10 {
		return domain.Invite{}, errors.New("今天的邀请次数已用完")
	}
	now := nowISO()
	invite := domain.Invite{
		ID:           domain.ID(s.next()),
		FromUserID:   domain.ID(userID),
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
	s.invites = append([]domain.Invite{invite}, s.invites...)
	return s.hydrateInvite(invite), nil
}

func (s *Store) Invites(userID int64, box string, status string) []domain.Invite {
	s.mu.Lock()
	defer s.mu.Unlock()
	var result []domain.Invite
	for _, invite := range s.invites {
		related := (box == "sent" && int64(invite.FromUserID) == userID) || (box != "sent" && int64(invite.ToUserID) == userID)
		if !related || (status != "" && invite.Status != status) {
			continue
		}
		peer := int64(invite.FromUserID)
		if peer == userID {
			peer = int64(invite.ToUserID)
		}
		if s.isBlockedBetween(userID, peer) {
			continue
		}
		result = append(result, s.hydrateInvite(invite))
	}
	return result
}

func (s *Store) InviteDetail(userID int64, id int64) (domain.Invite, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for _, invite := range s.invites {
		if int64(invite.ID) == id && (int64(invite.FromUserID) == userID || int64(invite.ToUserID) == userID) {
			peer := int64(invite.FromUserID)
			if peer == userID {
				peer = int64(invite.ToUserID)
			}
			if s.isBlockedBetween(userID, peer) {
				return domain.Invite{}, ErrNotFound
			}
			return s.hydrateInvite(invite), nil
		}
	}
	return domain.Invite{}, ErrNotFound
}

func (s *Store) UpdateInvite(userID int64, id int64, action string) (domain.Invite, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for index := range s.invites {
		invite := &s.invites[index]
		if int64(invite.ID) != id {
			continue
		}
		peer := int64(invite.FromUserID)
		if peer == userID {
			peer = int64(invite.ToUserID)
		}
		if s.isBlockedBetween(userID, peer) {
			return domain.Invite{}, ErrNotFound
		}
		if invite.Status != "pending" {
			return domain.Invite{}, errors.New("当前邀请状态不可操作")
		}
		if action == "cancel" {
			if int64(invite.FromUserID) != userID {
				return domain.Invite{}, errors.New("只有发起人可以取消邀请")
			}
			invite.Status = "cancelled"
		} else {
			if int64(invite.ToUserID) != userID {
				return domain.Invite{}, errors.New("只有接收人可以处理邀请")
			}
			if action == "accept" {
				invite.Status = "accepted"
			} else {
				invite.Status = "rejected"
			}
		}
		invite.UpdatedAt = nowISO()
		return s.hydrateInvite(*invite), nil
	}
	return domain.Invite{}, ErrNotFound
}

type PostPayload = storepkg.PostPayload

func (s *Store) Posts(userID int64, feed string, page int, pageSize int) domain.PageResult[domain.Post] {
	s.mu.Lock()
	defer s.mu.Unlock()
	var list []domain.Post
	for _, post := range s.posts {
		if post.Status != "normal" || s.isBlockedBetween(userID, int64(post.UserID)) {
			continue
		}
		if post.Visibility == "private" && int64(post.UserID) != userID {
			continue
		}
		if feed == "mine" && int64(post.UserID) != userID {
			continue
		}
		list = append(list, s.hydratePost(post, userID))
	}
	sort.SliceStable(list, func(i, j int) bool {
		return list[i].CreatedAt > list[j].CreatedAt
	})
	return pageResult(list, page, pageSize)
}

func (s *Store) PostDetail(userID int64, id int64) (domain.Post, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	post, ok := s.post(id)
	if !ok || post.Status != "normal" || s.isBlockedBetween(userID, int64(post.UserID)) {
		return domain.Post{}, errors.New("该动态暂不可见")
	}
	return s.hydratePost(post, userID), nil
}

func (s *Store) CreatePost(userID int64, payload PostPayload) (domain.Post, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	pet, ok := s.pet(payload.PetID)
	if !ok || int64(pet.UserID) != userID {
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
	now := nowISO()
	post := domain.Post{
		ID:           domain.ID(s.next()),
		UserID:       domain.ID(userID),
		PetID:        pet.ID,
		Content:      strings.TrimSpace(payload.Content),
		Images:       payload.Images,
		LocationName: payload.LocationName,
		City:         s.mustUser(userID).City,
		TopicTags:    payload.TopicTags,
		Visibility:   payload.Visibility,
		Status:       "normal",
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	s.posts = append([]domain.Post{post}, s.posts...)
	return s.hydratePost(post, userID), nil
}

func (s *Store) DeletePost(userID int64, id int64) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for index := range s.posts {
		if int64(s.posts[index].ID) == id {
			if int64(s.posts[index].UserID) != userID {
				return errors.New("只能删除自己的动态")
			}
			s.posts[index].Status = "deleted"
			return nil
		}
	}
	return ErrNotFound
}

func (s *Store) ToggleLike(userID int64, id int64, liked bool) (domain.Post, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for index := range s.posts {
		if int64(s.posts[index].ID) == id && s.posts[index].Status == "normal" {
			if s.isBlockedBetween(userID, int64(s.posts[index].UserID)) {
				return domain.Post{}, errors.New("该动态暂不可见")
			}
			if s.liked[id] == nil {
				s.liked[id] = map[int64]bool{}
			}
			wasLiked := s.liked[id][userID]
			if liked && !wasLiked {
				s.posts[index].LikeCount++
				s.liked[id][userID] = true
			}
			if !liked && wasLiked {
				s.posts[index].LikeCount--
				delete(s.liked[id], userID)
			}
			return s.hydratePost(s.posts[index], userID), nil
		}
	}
	return domain.Post{}, ErrNotFound
}

func (s *Store) Comments(userID int64, postID int64) ([]domain.Comment, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	post, ok := s.post(postID)
	if !ok || s.isBlockedBetween(userID, int64(post.UserID)) {
		return nil, errors.New("该动态暂不可见")
	}
	var result []domain.Comment
	for _, comment := range s.comments {
		if int64(comment.PostID) == postID && comment.Status == "normal" {
			result = append(result, s.hydrateComment(comment))
		}
	}
	return result, nil
}

func (s *Store) CreateComment(userID int64, postID int64, content string) (domain.Comment, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if strings.TrimSpace(content) == "" {
		return domain.Comment{}, errors.New("请填写评论内容")
	}
	for index := range s.posts {
		if int64(s.posts[index].ID) == postID && s.posts[index].Status == "normal" {
			if s.isBlockedBetween(userID, int64(s.posts[index].UserID)) {
				return domain.Comment{}, errors.New("该动态暂不可见")
			}
			owner, _ := s.user(int64(s.posts[index].UserID))
			if !owner.Privacy.AllowComment && int64(s.posts[index].UserID) != userID {
				return domain.Comment{}, errors.New("对方暂未开放评论")
			}
			now := nowISO()
			comment := domain.Comment{
				ID:        domain.ID(s.next()),
				PostID:    s.posts[index].ID,
				UserID:    domain.ID(userID),
				PetID:     s.defaultPetID(userID),
				Content:   strings.TrimSpace(content),
				Status:    "normal",
				CreatedAt: now,
				UpdatedAt: now,
			}
			s.comments = append(s.comments, comment)
			s.posts[index].CommentCount++
			return s.hydrateComment(comment), nil
		}
	}
	return domain.Comment{}, ErrNotFound
}

func (s *Store) DeleteComment(userID int64, id int64) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for index := range s.comments {
		comment := &s.comments[index]
		if int64(comment.ID) != id || comment.Status != "normal" {
			continue
		}
		post, _ := s.post(int64(comment.PostID))
		if int64(comment.UserID) != userID && int64(post.UserID) != userID {
			return errors.New("无权删除该评论")
		}
		comment.Status = "deleted"
		for postIndex := range s.posts {
			if s.posts[postIndex].ID == comment.PostID && s.posts[postIndex].CommentCount > 0 {
				s.posts[postIndex].CommentCount--
			}
		}
		return nil
	}
	return ErrNotFound
}

type ReportPayload = storepkg.ReportPayload

func (s *Store) CreateReport(userID int64, payload ReportPayload) (domain.Report, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if payload.Reason == "" {
		return domain.Report{}, errors.New("请选择举报原因")
	}
	if !s.canReportTarget(userID, payload.TargetType, payload.TargetID) {
		return domain.Report{}, errors.New("举报目标不存在")
	}
	report := domain.Report{
		ID:             domain.ID(s.next()),
		ReporterUserID: domain.ID(userID),
		TargetType:     payload.TargetType,
		TargetID:       domain.ID(payload.TargetID),
		Reason:         payload.Reason,
		Description:    payload.Description,
		Images:         payload.Images,
		Status:         "pending",
		CreatedAt:      nowISO(),
	}
	s.reports = append([]domain.Report{report}, s.reports...)
	return report, nil
}

type BlockPayload = storepkg.BlockPayload

func (s *Store) CreateBlock(userID int64, payload BlockPayload) (domain.Block, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if payload.BlockedUserID == userID {
		return domain.Block{}, errors.New("不能拉黑自己")
	}
	for _, block := range s.blocks {
		if int64(block.UserID) == userID && int64(block.BlockedUserID) == payload.BlockedUserID {
			return block, nil
		}
	}
	block := domain.Block{
		ID:            domain.ID(s.next()),
		UserID:        domain.ID(userID),
		BlockedUserID: domain.ID(payload.BlockedUserID),
		Reason:        payload.Reason,
		CreatedAt:     nowISO(),
	}
	s.blocks = append([]domain.Block{block}, s.blocks...)
	return block, nil
}

func (s *Store) Blocks(userID int64) []domain.Block {
	s.mu.Lock()
	defer s.mu.Unlock()
	var result []domain.Block
	for _, block := range s.blocks {
		if int64(block.UserID) == userID {
			result = append(result, block)
		}
	}
	return result
}

func (s *Store) next() int64 {
	s.nextID++
	return s.nextID
}

func (s *Store) user(id int64) (domain.User, bool) {
	for _, user := range s.users {
		if int64(user.ID) == id && user.Status == "normal" {
			return user, true
		}
	}
	return domain.User{}, false
}

func (s *Store) mustUser(id int64) domain.User {
	user, _ := s.user(id)
	return user
}

func (s *Store) pet(id int64) (domain.Pet, bool) {
	for _, pet := range s.pets {
		if int64(pet.ID) == id && pet.Status == "normal" {
			return pet, true
		}
	}
	return domain.Pet{}, false
}

func (s *Store) post(id int64) (domain.Post, bool) {
	for _, post := range s.posts {
		if int64(post.ID) == id && post.Status == "normal" {
			return post, true
		}
	}
	return domain.Post{}, false
}

func (s *Store) defaultPetID(userID int64) domain.ID {
	for _, pet := range s.pets {
		if int64(pet.UserID) == userID && pet.IsDefault && pet.Status == "normal" {
			return pet.ID
		}
	}
	return 0
}

func (s *Store) enrichPet(pet domain.Pet) domain.Pet {
	owner, _ := s.user(int64(pet.UserID))
	pet.OwnerName = owner.Nickname
	if !owner.Privacy.ShowOwnerName {
		pet.OwnerName = "宠物主人"
	}
	pet.OwnerAvatarURL = owner.AvatarURL
	return pet
}

func (s *Store) hydrateInvite(invite domain.Invite) domain.Invite {
	if fromPet, ok := s.pet(int64(invite.FromPetID)); ok {
		enriched := s.enrichPet(fromPet)
		invite.FromPet = &enriched
	}
	if toPet, ok := s.pet(int64(invite.ToPetID)); ok {
		enriched := s.enrichPet(toPet)
		invite.ToPet = &enriched
	}
	return invite
}

func (s *Store) hydratePost(post domain.Post, userID int64) domain.Post {
	if pet, ok := s.pet(int64(post.PetID)); ok {
		enriched := s.enrichPet(pet)
		post.Pet = &enriched
	}
	post.Liked = s.liked[int64(post.ID)] != nil && s.liked[int64(post.ID)][userID]
	return post
}

func (s *Store) hydrateComment(comment domain.Comment) domain.Comment {
	if comment.PetID != 0 {
		if pet, ok := s.pet(int64(comment.PetID)); ok {
			enriched := s.enrichPet(pet)
			comment.Pet = &enriched
		}
	}
	return comment
}

func (s *Store) canSeePet(userID int64, pet domain.Pet) bool {
	owner, ok := s.user(int64(pet.UserID))
	if !ok || pet.Status != "normal" {
		return false
	}
	if int64(pet.UserID) == userID {
		return true
	}
	if s.isBlockedBetween(userID, int64(pet.UserID)) {
		return false
	}
	return owner.Privacy.AllowNearbyVisible && pet.Visible
}

func (s *Store) canInvitePet(userID int64, pet domain.Pet) bool {
	owner, ok := s.user(int64(pet.UserID))
	return ok && int64(pet.UserID) != userID && owner.Privacy.AllowStrangerInvite && !s.isBlockedBetween(userID, int64(pet.UserID))
}

func (s *Store) canReportTarget(userID int64, targetType string, targetID int64) bool {
	switch targetType {
	case "user":
		user, ok := s.user(targetID)
		return ok && user.Status == "normal" && !s.isBlockedBetween(userID, targetID)
	case "pet":
		pet, ok := s.pet(targetID)
		return ok && s.canSeePet(userID, pet)
	case "post":
		post, ok := s.post(targetID)
		return ok && s.canSeePost(userID, post)
	case "comment":
		for _, comment := range s.comments {
			if int64(comment.ID) == targetID && comment.Status == "normal" {
				post, ok := s.post(int64(comment.PostID))
				return ok && s.canSeePost(userID, post)
			}
		}
		return false
	case "invite":
		for _, invite := range s.invites {
			if int64(invite.ID) == targetID {
				return s.canSeeInvite(userID, invite)
			}
		}
		return false
	default:
		return false
	}
}

func (s *Store) canSeePost(userID int64, post domain.Post) bool {
	if post.Status != "normal" || s.isBlockedBetween(userID, int64(post.UserID)) {
		return false
	}
	return post.Visibility != "private" || int64(post.UserID) == userID
}

func (s *Store) canSeeInvite(userID int64, invite domain.Invite) bool {
	if int64(invite.FromUserID) != userID && int64(invite.ToUserID) != userID {
		return false
	}
	peer := int64(invite.FromUserID)
	if peer == userID {
		peer = int64(invite.ToUserID)
	}
	return !s.isBlockedBetween(userID, peer)
}

func (s *Store) isBlockedBetween(a int64, b int64) bool {
	for _, block := range s.blocks {
		if (int64(block.UserID) == a && int64(block.BlockedUserID) == b) || (int64(block.UserID) == b && int64(block.BlockedUserID) == a) {
			return true
		}
	}
	return false
}

func (s *Store) dailyInviteCount(userID int64) int {
	count := 0
	for _, invite := range s.invites {
		if int64(invite.FromUserID) == userID && isToday(invite.CreatedAt) {
			count++
		}
	}
	return count
}

func validatePetPayload(payload PetPayload) error {
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
