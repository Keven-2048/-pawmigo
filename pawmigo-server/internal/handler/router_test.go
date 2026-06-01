package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"github.com/pawmigo/server/internal/middleware"
	"github.com/pawmigo/server/internal/model"
	"github.com/pawmigo/server/internal/repository"
	"github.com/pawmigo/server/internal/service"
	"github.com/pawmigo/server/internal/wxauth"
)

type fakeWX struct{ openID string }

func (f fakeWX) Code2Session(string) (*wxauth.Session, error) {
	return &wxauth.Session{OpenID: f.openID, SessionKey: "sk"}, nil
}

func setup(t *testing.T) *gin.Engine {
	gin.SetMode(gin.TestMode)
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&model.User{}, &model.Pet{}))

	jwt := middleware.NewJWT("secret")
	userRepo := repository.NewUserRepo(db)
	petSvc := service.NewPetService(repository.NewPetRepo(db))
	authSvc := service.NewAuthService(fakeWX{openID: "ox-1"}, userRepo, jwt)

	return NewRouter(NewAuthHandler(authSvc), NewPetHandler(petSvc, userRepo), jwt)
}

func doJSON(t *testing.T, r *gin.Engine, method, path, token string, body any) *httptest.ResponseRecorder {
	var buf bytes.Buffer
	if body != nil {
		require.NoError(t, json.NewEncoder(&buf).Encode(body))
	}
	req := httptest.NewRequest(method, path, &buf)
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

func TestFullAuthAndPetFlow(t *testing.T) {
	r := setup(t)

	// 1. 登录拿 token
	w := doJSON(t, r, "POST", "/api/v1/auth/wx-login", "", gin.H{"code": "abc"})
	require.Equal(t, http.StatusOK, w.Code)
	var login struct {
		Token string `json:"token"`
	}
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &login))
	require.NotEmpty(t, login.Token)

	// 2. 无 token 访问 /me 被拒
	w = doJSON(t, r, "GET", "/api/v1/me", "", nil)
	assert.Equal(t, http.StatusUnauthorized, w.Code)

	// 3. 带 token 创建宠物
	w = doJSON(t, r, "POST", "/api/v1/pets", login.Token, gin.H{
		"name": "豆豆", "breed": "柯基", "personality": []string{"社牛"},
	})
	require.Equal(t, http.StatusOK, w.Code)

	// 4. /me 返回该宠物
	w = doJSON(t, r, "GET", "/api/v1/me", login.Token, nil)
	require.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "豆豆")
}
