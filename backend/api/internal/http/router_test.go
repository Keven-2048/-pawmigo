package http_test

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"os"
	"strconv"
	"strings"
	"testing"
	"time"

	pawmigohttp "pawmigo/backend/api/internal/http"
	storepkg "pawmigo/backend/api/internal/store"
	"pawmigo/backend/api/internal/store/gormstore"
	"pawmigo/backend/api/internal/store/memory"
	"pawmigo/backend/api/internal/wechat"
)

type apiResponse struct {
	Code    int             `json:"code"`
	Message string          `json:"message"`
	Data    json.RawMessage `json:"data"`
}

type testBackend struct {
	name     string
	newStore func() storepkg.Store
}

type unreadyStore struct {
	storepkg.Store
}

func (unreadyStore) Ping() error {
	return errors.New("db down")
}

type stubWeChatClient struct {
	result wechat.Code2SessionResult
	err    error
}

func (s stubWeChatClient) Code2Session(ctx context.Context, code string) (wechat.Code2SessionResult, error) {
	if s.err != nil {
		return wechat.Code2SessionResult{}, s.err
	}
	return s.result, nil
}

func TestMain(m *testing.M) {
	_ = os.Unsetenv("WECHAT_APP_ID")
	_ = os.Unsetenv("WECHAT_APP_SECRET")
	os.Exit(m.Run())
}

var testBackends = []testBackend{
	{
		name: "memory",
		newStore: func() storepkg.Store {
			return memory.NewStore()
		},
	},
	{
		name: "gorm",
		newStore: func() storepkg.Store {
			db := gormstore.OpenForTest()
			gormstore.Seed(db)
			return gormstore.New(db)
		},
	},
}

func newTestServer(store storepkg.Store) http.Handler {
	return pawmigohttp.NewRouter(store)
}

func eachBackend(t *testing.T, run func(t *testing.T, router http.Handler)) {
	t.Helper()
	for _, backend := range testBackends {
		backend := backend
		t.Run(backend.name, func(t *testing.T) {
			run(t, newTestServer(backend.newStore()))
		})
	}
}

func requestJSON(t *testing.T, router http.Handler, method string, path string, token string, body any) (int, apiResponse) {
	t.Helper()

	var payload []byte
	if body != nil {
		var err error
		payload, err = json.Marshal(body)
		if err != nil {
			t.Fatal(err)
		}
	}

	req := httptest.NewRequest(method, path, bytes.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	var result apiResponse
	if strings.TrimSpace(rec.Body.String()) != "" {
		if err := json.Unmarshal(rec.Body.Bytes(), &result); err != nil {
			t.Fatalf("decode response: %v body=%s", err, rec.Body.String())
		}
	}

	return rec.Code, result
}

func decodeData[T any](t *testing.T, response apiResponse) T {
	t.Helper()
	var value T
	if err := json.Unmarshal(response.Data, &value); err != nil {
		t.Fatalf("decode data: %v raw=%s", err, string(response.Data))
	}
	return value
}

func login(t *testing.T, router http.Handler) string {
	t.Helper()
	status, response := requestJSON(t, router, http.MethodPost, "/api/v1/auth/wechat-login", "", map[string]any{
		"code": "dev-login-code",
	})
	if status != http.StatusOK {
		t.Fatalf("login status=%d message=%s", status, response.Message)
	}
	data := decodeData[struct {
		Token string `json:"token"`
	}](t, response)
	if data.Token == "" {
		t.Fatal("login returned empty token")
	}
	return data.Token
}

func TestHealthAndAuth(t *testing.T) {
	eachBackend(t, func(t *testing.T, router http.Handler) {

		status, response := requestJSON(t, router, http.MethodGet, "/healthz", "", nil)
		if status != http.StatusOK || response.Code != 0 {
			t.Fatalf("health status=%d response=%+v", status, response)
		}

		status, response = requestJSON(t, router, http.MethodGet, "/api/v1/user/me", "", nil)
		if status != http.StatusUnauthorized || response.Message != "用户未登录" {
			t.Fatalf("expected unauthorized, got status=%d response=%+v", status, response)
		}

		token := login(t, router)
		status, response = requestJSON(t, router, http.MethodGet, "/api/v1/user/me", token, nil)
		if status != http.StatusOK {
			t.Fatalf("me status=%d response=%+v", status, response)
		}
		user := decodeData[struct {
			ID       int    `json:"id"`
			Nickname string `json:"nickname"`
		}](t, response)
		if user.ID != 1 || user.Nickname == "" {
			t.Fatalf("unexpected user %+v", user)
		}
	})
}

func TestWeChatLoginUsesInjectedClient(t *testing.T) {
	for _, backend := range testBackends {
		backend := backend
		t.Run(backend.name, func(t *testing.T) {
			store := backend.newStore()
			router := pawmigohttp.NewRouter(store, pawmigohttp.WithWeChatClient(stubWeChatClient{
				result: wechat.Code2SessionResult{OpenID: "openid-router-new-" + backend.name},
			}))

			status, response := requestJSON(t, router, http.MethodPost, "/api/v1/auth/wechat-login", "", map[string]any{"code": "x"})
			if status != http.StatusOK {
				t.Fatalf("wechat login status=%d response=%+v", status, response)
			}
			data := decodeData[struct {
				Token  string `json:"token"`
				HasPet bool   `json:"hasPet"`
				User   struct {
					ID     int    `json:"id"`
					OpenID string `json:"openid"`
				} `json:"user"`
			}](t, response)
			wantOpenID := "openid-router-new-" + backend.name
			if data.Token == "" || data.User.OpenID != wantOpenID || data.HasPet {
				t.Fatalf("unexpected wechat login data %+v", data)
			}

			status, response = requestJSON(t, router, http.MethodGet, "/api/v1/user/me", data.Token, nil)
			if status != http.StatusOK {
				t.Fatalf("me after wechat login status=%d response=%+v", status, response)
			}
			me := decodeData[struct {
				ID     int    `json:"id"`
				OpenID string `json:"openid"`
			}](t, response)
			if me.ID != data.User.ID || me.OpenID != wantOpenID {
				t.Fatalf("unexpected authenticated user %+v, want ID=%d %s", me, data.User.ID, wantOpenID)
			}
		})
	}
}

func TestWeChatLoginRejectsMissingCode(t *testing.T) {
	router := pawmigohttp.NewRouter(memory.NewStore(), pawmigohttp.WithWeChatClient(stubWeChatClient{
		result: wechat.Code2SessionResult{OpenID: "openid-router-new"},
	}))

	status, response := requestJSON(t, router, http.MethodPost, "/api/v1/auth/wechat-login", "", map[string]any{})
	if status != http.StatusBadRequest || response.Message != "缺少 code" {
		t.Fatalf("expected missing code 400, got status=%d response=%+v", status, response)
	}
}

func TestWeChatLoginRejectsStubError(t *testing.T) {
	router := pawmigohttp.NewRouter(memory.NewStore(), pawmigohttp.WithWeChatClient(stubWeChatClient{
		err: errors.New("invalid code"),
	}))

	status, response := requestJSON(t, router, http.MethodPost, "/api/v1/auth/wechat-login", "", map[string]any{"code": "bad"})
	if status != http.StatusUnauthorized || response.Message != "微信登录失败" {
		t.Fatalf("expected stub error 401, got status=%d response=%+v", status, response)
	}
}

func TestLoginFallsBackToDevWhenWeChatUnconfigured(t *testing.T) {
	eachBackend(t, func(t *testing.T, router http.Handler) {
		token := login(t, router)
		status, response := requestJSON(t, router, http.MethodGet, "/api/v1/user/me", token, nil)
		if status != http.StatusOK {
			t.Fatalf("dev fallback me status=%d response=%+v", status, response)
		}
		user := decodeData[struct {
			ID int `json:"id"`
		}](t, response)
		if user.ID != 1 {
			t.Fatalf("expected dev fallback user 1, got %+v", user)
		}
	})
}

func TestReadyzReturns200WhenStoreHealthy(t *testing.T) {
	eachBackend(t, func(t *testing.T, router http.Handler) {
		status, response := requestJSON(t, router, http.MethodGet, "/readyz", "", nil)
		if status != http.StatusOK || response.Code != 0 {
			t.Fatalf("readyz status=%d response=%+v", status, response)
		}
		data := decodeData[struct {
			Status string `json:"status"`
		}](t, response)
		if data.Status != "ready" {
			t.Fatalf("expected ready status, got %+v", data)
		}
	})
}

func TestReadyzReturns503WhenStoreUnavailable(t *testing.T) {
	router := newTestServer(unreadyStore{Store: memory.NewStore()})

	status, response := requestJSON(t, router, http.MethodGet, "/readyz", "", nil)
	if status != http.StatusServiceUnavailable || response.Message != "数据库不可用" {
		t.Fatalf("expected unavailable readyz, got status=%d response=%+v", status, response)
	}
}

func TestPetDefaultsAndNearbyPrivacy(t *testing.T) {
	eachBackend(t, func(t *testing.T, router http.Handler) {
		token := login(t, router)

		status, response := requestJSON(t, router, http.MethodPost, "/api/v1/pets", token, map[string]any{
			"name":            "栗子",
			"avatarUrl":       "",
			"type":            "cat",
			"breed":           "狸花",
			"gender":          "female",
			"sterilized":      true,
			"vaccineStatus":   "completed",
			"personalityTags": []string{"安静"},
			"interestTags":    []string{"拍照"},
			"description":     "喜欢晒太阳",
			"visible":         true,
		})
		if status != http.StatusOK {
			t.Fatalf("create pet status=%d response=%+v", status, response)
		}
		created := decodeData[struct {
			ID        int  `json:"id"`
			IsDefault bool `json:"isDefault"`
		}](t, response)
		if created.IsDefault {
			t.Fatal("second pet should not become default while first pet exists")
		}

		status, response = requestJSON(t, router, http.MethodDelete, "/api/v1/pets/101", token, nil)
		if status != http.StatusOK {
			t.Fatalf("delete pet status=%d response=%+v", status, response)
		}

		status, response = requestJSON(t, router, http.MethodGet, "/api/v1/pets/my", token, nil)
		if status != http.StatusOK {
			t.Fatalf("my pets status=%d response=%+v", status, response)
		}
		pets := decodeData[[]struct {
			ID        int  `json:"id"`
			IsDefault bool `json:"isDefault"`
		}](t, response)
		if len(pets) != 1 || pets[0].ID != created.ID || !pets[0].IsDefault {
			t.Fatalf("expected remaining pet to become default, got %+v", pets)
		}

		status, response = requestJSON(t, router, http.MethodGet, "/api/v1/nearby/pets?page=1&page_size=20", token, nil)
		if status != http.StatusOK {
			t.Fatalf("nearby status=%d response=%+v", status, response)
		}
		if bytes.Contains(response.Data, []byte("latitude")) || bytes.Contains(response.Data, []byte("longitude")) {
			t.Fatalf("nearby leaked raw coordinates: %s", string(response.Data))
		}
	})
}

func TestInviteAndPrivacyRules(t *testing.T) {
	eachBackend(t, func(t *testing.T, router http.Handler) {
		token := login(t, router)
		future := time.Now().Add(2 * time.Hour).Format(time.RFC3339)
		past := time.Now().Add(-time.Hour).Format(time.RFC3339)

		status, response := requestJSON(t, router, http.MethodPost, "/api/v1/invites", token, map[string]any{
			"fromPetId":    101,
			"toPetId":      101,
			"type":         "walk",
			"title":        "自己约自己",
			"description":  "",
			"locationName": "社区花园",
			"meetTime":     future,
		})
		if status != http.StatusBadRequest || response.Message != "不能邀请自己的宠物" {
			t.Fatalf("self invite status=%d response=%+v", status, response)
		}

		status, response = requestJSON(t, router, http.MethodPost, "/api/v1/invites", token, map[string]any{
			"fromPetId":    101,
			"toPetId":      102,
			"type":         "walk",
			"title":        "迟到邀请",
			"description":  "",
			"locationName": "社区花园",
			"meetTime":     past,
		})
		if status != http.StatusBadRequest || response.Message != "见面时间不能早于当前时间" {
			t.Fatalf("past invite status=%d response=%+v", status, response)
		}

		payload := map[string]any{
			"fromPetId":    101,
			"toPetId":      102,
			"type":         "walk",
			"title":        "一起散步",
			"description":  "",
			"locationName": "社区花园",
			"meetTime":     future,
		}
		status, response = requestJSON(t, router, http.MethodPost, "/api/v1/invites", token, payload)
		if status != http.StatusOK {
			t.Fatalf("create invite status=%d response=%+v", status, response)
		}
		status, response = requestJSON(t, router, http.MethodPost, "/api/v1/invites", token, payload)
		if status != http.StatusBadRequest || response.Message != "24 小时内已经向这只宠物发过邀请" {
			t.Fatalf("duplicate invite status=%d response=%+v", status, response)
		}

		status, response = requestJSON(t, router, http.MethodPut, "/api/v1/user/privacy", token, map[string]any{
			"allowNearbyVisible":  false,
			"allowStrangerInvite": false,
			"allowComment":        true,
			"showOwnerName":       true,
			"showCity":            true,
			"notificationEnabled": true,
		})
		if status != http.StatusOK {
			t.Fatalf("privacy status=%d response=%+v", status, response)
		}
	})
}

func TestPostsCommentsReportsAndBlocks(t *testing.T) {
	eachBackend(t, func(t *testing.T, router http.Handler) {
		token := login(t, router)

		status, response := requestJSON(t, router, http.MethodPost, "/api/v1/posts", token, map[string]any{
			"petId":        101,
			"content":      "   ",
			"images":       []string{},
			"locationName": "",
			"topicTags":    []string{},
			"visibility":   "public",
		})
		if status != http.StatusBadRequest || response.Message != "请填写文字或选择图片" {
			t.Fatalf("empty post status=%d response=%+v", status, response)
		}

		status, response = requestJSON(t, router, http.MethodPost, "/api/v1/posts", token, map[string]any{
			"petId":        101,
			"content":      "图片太多",
			"images":       []string{"1", "2", "3", "4", "5", "6", "7", "8", "9", "10"},
			"locationName": "",
			"topicTags":    []string{},
			"visibility":   "public",
		})
		if status != http.StatusBadRequest || response.Message != "图片最多 9 张" {
			t.Fatalf("too many images status=%d response=%+v", status, response)
		}

		status, response = requestJSON(t, router, http.MethodPost, "/api/v1/posts", token, map[string]any{
			"petId":        101,
			"content":      "今天很开心",
			"images":       []string{},
			"locationName": "社区花园",
			"topicTags":    []string{"遛弯"},
			"visibility":   "public",
		})
		if status != http.StatusOK {
			t.Fatalf("create post status=%d response=%+v", status, response)
		}
		post := decodeData[struct {
			ID           int `json:"id"`
			LikeCount    int `json:"likeCount"`
			CommentCount int `json:"commentCount"`
		}](t, response)

		for i := 0; i < 2; i++ {
			status, response = requestJSON(t, router, http.MethodPost, "/api/v1/posts/"+strconv.Itoa(post.ID)+"/like", token, nil)
			if status != http.StatusOK {
				t.Fatalf("like status=%d response=%+v", status, response)
			}
		}
		liked := decodeData[struct {
			LikeCount int `json:"likeCount"`
		}](t, response)
		if liked.LikeCount != 1 {
			t.Fatalf("like should be idempotent, got %d", liked.LikeCount)
		}

		status, response = requestJSON(t, router, http.MethodPost, "/api/v1/posts/"+strconv.Itoa(post.ID)+"/comments", token, map[string]any{
			"content": "太可爱了",
		})
		if status != http.StatusOK {
			t.Fatalf("comment status=%d response=%+v", status, response)
		}
		status, response = requestJSON(t, router, http.MethodGet, "/api/v1/posts/"+strconv.Itoa(post.ID), token, nil)
		if status != http.StatusOK {
			t.Fatalf("post detail status=%d response=%+v", status, response)
		}
		updated := decodeData[struct {
			CommentCount int `json:"commentCount"`
		}](t, response)
		if updated.CommentCount != 1 {
			t.Fatalf("comment count=%d", updated.CommentCount)
		}

		status, response = requestJSON(t, router, http.MethodPost, "/api/v1/reports", token, map[string]any{
			"targetType":  "post",
			"targetId":    post.ID,
			"reason":      "广告营销",
			"description": "",
			"images":      []string{},
		})
		if status != http.StatusOK {
			t.Fatalf("report status=%d response=%+v", status, response)
		}

		status, response = requestJSON(t, router, http.MethodPost, "/api/v1/blocks", token, map[string]any{
			"blockedUserId": 2,
			"reason":        "不想互动",
		})
		if status != http.StatusOK {
			t.Fatalf("block status=%d response=%+v", status, response)
		}
		status, response = requestJSON(t, router, http.MethodGet, "/api/v1/nearby/pets", token, nil)
		if status != http.StatusOK {
			t.Fatalf("nearby after block status=%d response=%+v", status, response)
		}
		if bytes.Contains(response.Data, []byte(`"userId":2`)) {
			t.Fatalf("blocked user still visible: %s", string(response.Data))
		}

		status, response = requestJSON(t, router, http.MethodGet, "/api/v1/invites/501", token, nil)
		if status != http.StatusNotFound {
			t.Fatalf("blocked invite detail should be hidden, status=%d response=%+v", status, response)
		}

		status, response = requestJSON(t, router, http.MethodPost, "/api/v1/posts/801/comments", token, map[string]any{
			"content": "不该穿透拉黑关系",
		})
		if status != http.StatusBadRequest || response.Message != "该动态暂不可见" {
			t.Fatalf("blocked post comment status=%d response=%+v", status, response)
		}
	})
}

func TestPetCreateRejectsOversizedProfileFieldsWith400(t *testing.T) {
	eachBackend(t, func(t *testing.T, router http.Handler) {
		token := login(t, router)

		tests := []struct {
			name    string
			payload map[string]any
			message string
		}{
			{
				name: "personality tags",
				payload: petRequestPayload(map[string]any{
					"personalityTags": []string{"1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"},
				}),
				message: "性格标签最多 10 个",
			},
			{
				name: "interest tags",
				payload: petRequestPayload(map[string]any{
					"interestTags": []string{"1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"},
				}),
				message: "兴趣标签最多 10 个",
			},
			{
				name: "description",
				payload: petRequestPayload(map[string]any{
					"description": strings.Repeat("介", 501),
				}),
				message: "简介最多 500 字",
			},
		}

		for _, tt := range tests {
			tt := tt
			t.Run(tt.name, func(t *testing.T) {
				status, response := requestJSON(t, router, http.MethodPost, "/api/v1/pets", token, tt.payload)
				assertBadRequestMessage(t, status, response, tt.message)
			})
		}
	})
}

func TestPetUpdateRejectsOversizedDescriptionWith400(t *testing.T) {
	eachBackend(t, func(t *testing.T, router http.Handler) {
		token := login(t, router)

		status, response := requestJSON(t, router, http.MethodPut, "/api/v1/pets/101", token, petRequestPayload(map[string]any{
			"description": strings.Repeat("介", 501),
		}))
		assertBadRequestMessage(t, status, response, "简介最多 500 字")
	})
}

func TestInviteCreateRejectsDailyLimitWith400(t *testing.T) {
	for _, backend := range testBackends {
		backend := backend
		t.Run(backend.name, func(t *testing.T) {
			store := backend.newStore()
			router := newTestServer(store)
			token := login(t, router)

			targetPetIDs := []int64{102}
			for len(targetPetIDs) < 11 {
				pet, err := store.CreatePet(2, storepkg.PetPayload{
					Name:            "日限目标" + strconv.Itoa(len(targetPetIDs)),
					AvatarURL:       "/assets/mock/pet-dog-golden.jpg",
					Type:            "dog",
					Breed:           "金毛",
					Gender:          "female",
					Sterilized:      false,
					VaccineStatus:   "completed",
					PersonalityTags: []string{"友好"},
					InterestTags:    []string{"遛弯"},
					Description:     "用于邀请日限 HTTP 测试",
					Visible:         boolPointer(true),
				})
				if err != nil {
					t.Fatalf("seed target pet: %v", err)
				}
				targetPetIDs = append(targetPetIDs, int64(pet.ID))
			}

			for index, targetPetID := range targetPetIDs[:10] {
				status, response := requestJSON(t, router, http.MethodPost, "/api/v1/invites", token, inviteRequestPayload(targetPetID))
				if status != http.StatusOK {
					t.Fatalf("invite %d targetPetID=%d status=%d response=%+v", index+1, targetPetID, status, response)
				}
			}

			status, response := requestJSON(t, router, http.MethodPost, "/api/v1/invites", token, inviteRequestPayload(targetPetIDs[10]))
			assertBadRequestMessage(t, status, response, "今天的邀请次数已用完")
		})
	}
}

func TestPostCreateRejectsOversizedContentWith400(t *testing.T) {
	eachBackend(t, func(t *testing.T, router http.Handler) {
		token := login(t, router)

		status, response := requestJSON(t, router, http.MethodPost, "/api/v1/posts", token, map[string]any{
			"petId":        101,
			"content":      strings.Repeat("动", 1001),
			"images":       []string{},
			"locationName": "",
			"topicTags":    []string{},
			"visibility":   "public",
		})
		assertBadRequestMessage(t, status, response, "动态内容最多 1000 字")
	})
}

func TestReportCreateRejectsInvisibleTargetWith400(t *testing.T) {
	eachBackend(t, func(t *testing.T, router http.Handler) {
		token := login(t, router)

		status, response := requestJSON(t, router, http.MethodPost, "/api/v1/reports", token, map[string]any{
			"targetType":  "post",
			"targetId":    999999,
			"reason":      "广告营销",
			"description": "",
			"images":      []string{},
		})
		assertBadRequestMessage(t, status, response, "举报目标不存在")
	})
}

func assertBadRequestMessage(t *testing.T, status int, response apiResponse, message string) {
	t.Helper()
	if status != http.StatusBadRequest || response.Message != message {
		t.Fatalf("expected 400 %q, got status=%d response=%+v", message, status, response)
	}
}

func petRequestPayload(overrides map[string]any) map[string]any {
	payload := map[string]any{
		"name":            "栗子",
		"avatarUrl":       "",
		"type":            "cat",
		"breed":           "狸花",
		"gender":          "female",
		"sterilized":      true,
		"vaccineStatus":   "completed",
		"personalityTags": []string{"安静"},
		"interestTags":    []string{"拍照"},
		"description":     "喜欢晒太阳",
		"visible":         true,
	}
	for key, value := range overrides {
		payload[key] = value
	}
	return payload
}

func inviteRequestPayload(toPetID int64) map[string]any {
	return map[string]any{
		"fromPetId":    101,
		"toPetId":      toPetID,
		"type":         "walk",
		"title":        "一起散步",
		"description":  "",
		"locationName": "社区花园",
		"meetTime":     time.Now().Add(2 * time.Hour).Format(time.RFC3339),
	}
}

func boolPointer(value bool) *bool {
	return &value
}
