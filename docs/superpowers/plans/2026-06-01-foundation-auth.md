# Plan 1 · 基建与认证 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭起 Go/Gin + MySQL + Redis 后端骨架与 Taro 小程序骨架，跑通"微信登录 → JWT → 创建/管理宠物档案"闭环。

**Architecture:** 后端按 handler/service/repository 分层，依赖通过构造函数注入以便测试；微信 API 调用抽象为 interface，测试时用 fake 实现。前端 Taro + Zustand，API 层统一封装请求与 JWT 注入。

**Tech Stack:** Go 1.22 / Gin / gorm(MySQL) / go-redis / golang-jwt；Taro 3.6 + React + TypeScript + Zustand。

---

## File Structure

### 后端 `pawmigo-server/`

```
cmd/server/main.go                  # 装配 & 启动
internal/config/config.go           # 读环境变量
internal/model/user.go              # User 实体
internal/model/pet.go               # Pet 实体
internal/repository/db.go           # MySQL/Redis 连接
internal/repository/user_repo.go    # User 持久化
internal/repository/pet_repo.go     # Pet 持久化
internal/wxauth/client.go           # 微信 code2session 接口 + 真实实现
internal/service/auth_service.go    # 登录逻辑（code→user→jwt）
internal/service/pet_service.go     # 宠物档案逻辑
internal/middleware/jwt.go          # JWT 签发/校验 + Gin 中间件
internal/handler/auth_handler.go    # POST /auth/wx-login
internal/handler/pet_handler.go     # /pets CRUD + /me
internal/handler/router.go          # 路由注册
migrations/0001_init.sql            # User/Pet 建表
docker-compose.yml                  # mysql + redis
.env.example
go.mod
```

### 前端 `pawmigo-mini/`

```
src/app.config.ts                   # 5 个 tab
src/app.tsx
src/services/request.ts             # 封装 Taro.request + JWT
src/services/api.ts                 # 业务接口
src/store/authStore.ts              # zustand：user/pet/jwt/wxLogin
src/pages/login/index.tsx           # 授权登录
src/pages/profile/index.tsx         # 我的（宠物档案）
src/pages/profile/pet-form.tsx      # 创建/编辑宠物
src/pages/map/index.tsx             # 占位
src/pages/feed/index.tsx            # 占位
src/pages/encounter/index.tsx       # 占位
src/pages/team/index.tsx            # 占位
```

---

## Phase A · 后端基建

### Task 1: 初始化 Go 项目与配置

**Files:**
- Create: `pawmigo-server/go.mod`
- Create: `pawmigo-server/internal/config/config.go`
- Create: `pawmigo-server/internal/config/config_test.go`
- Create: `pawmigo-server/.env.example`

- [ ] **Step 1: 初始化模块**

Run:
```bash
cd pawmigo-server && go mod init github.com/pawmigo/server
go get github.com/gin-gonic/gin@v1.10.0
go get gorm.io/gorm@v1.25.12 gorm.io/driver/mysql@v1.5.7
go get github.com/redis/go-redis/v9@v9.7.0
go get github.com/golang-jwt/jwt/v5@v5.2.1
go get github.com/stretchr/testify@v1.9.0
```

- [ ] **Step 2: 写失败测试**

`internal/config/config_test.go`:
```go
package config

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestLoadFromEnv(t *testing.T) {
	os.Setenv("MYSQL_DSN", "user:pass@tcp(localhost:3306)/pawmigo")
	os.Setenv("REDIS_ADDR", "localhost:6379")
	os.Setenv("JWT_SECRET", "s3cret")
	os.Setenv("WX_APPID", "wxapp")
	os.Setenv("WX_SECRET", "wxsecret")
	defer os.Clearenv()

	cfg := Load()

	assert.Equal(t, "user:pass@tcp(localhost:3306)/pawmigo", cfg.MySQLDSN)
	assert.Equal(t, "localhost:6379", cfg.RedisAddr)
	assert.Equal(t, "s3cret", cfg.JWTSecret)
	assert.Equal(t, "wxapp", cfg.WXAppID)
	assert.Equal(t, "wxsecret", cfg.WXSecret)
	assert.Equal(t, "8080", cfg.Port) // 默认值
}
```

- [ ] **Step 3: 运行测试确认失败**

Run: `go test ./internal/config/ -run TestLoadFromEnv -v`
Expected: FAIL（`Load` 未定义）

- [ ] **Step 4: 实现 config**

`internal/config/config.go`:
```go
package config

import "os"

type Config struct {
	Port      string
	MySQLDSN  string
	RedisAddr string
	JWTSecret string
	WXAppID   string
	WXSecret  string
}

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func Load() Config {
	return Config{
		Port:      getEnv("PORT", "8080"),
		MySQLDSN:  getEnv("MYSQL_DSN", ""),
		RedisAddr: getEnv("REDIS_ADDR", ""),
		JWTSecret: getEnv("JWT_SECRET", ""),
		WXAppID:   getEnv("WX_APPID", ""),
		WXSecret:  getEnv("WX_SECRET", ""),
	}
}
```

- [ ] **Step 5: 运行测试确认通过**

Run: `go test ./internal/config/ -v`
Expected: PASS

- [ ] **Step 6: 写 .env.example**

`.env.example`:
```
PORT=8080
MYSQL_DSN=pawmigo:pawmigo@tcp(localhost:3306)/pawmigo?charset=utf8mb4&parseTime=true&loc=Local
REDIS_ADDR=localhost:6379
JWT_SECRET=change-me-in-prod
WX_APPID=your_wx_appid
WX_SECRET=your_wx_secret
```

- [ ] **Step 7: 提交**

```bash
git add pawmigo-server/
git commit -m "feat(server): init go module and config loader"
```

---

### Task 2: 数据模型与建表脚本

**Files:**
- Create: `pawmigo-server/internal/model/user.go`
- Create: `pawmigo-server/internal/model/pet.go`
- Create: `pawmigo-server/migrations/0001_init.sql`
- Create: `pawmigo-server/docker-compose.yml`

- [ ] **Step 1: 写 User 模型**

`internal/model/user.go`:
```go
package model

import "time"

type User struct {
	ID          uint64    `gorm:"primaryKey" json:"id"`
	OpenID      string    `gorm:"uniqueIndex;size:64;not null" json:"-"`
	Phone       string    `gorm:"size:20" json:"phone,omitempty"`
	Nickname    string    `gorm:"size:64" json:"nickname"`
	Avatar      string    `gorm:"size:255" json:"avatar"`
	BoneBalance int64     `gorm:"default:0" json:"boneBalance"`
	CreatedAt   time.Time `json:"createdAt"`
}
```

- [ ] **Step 2: 写 Pet 模型**

`internal/model/pet.go`:
```go
package model

import (
	"time"

	"gorm.io/datatypes"
)

type Pet struct {
	ID          uint64         `gorm:"primaryKey" json:"id"`
	OwnerID     uint64         `gorm:"index;not null" json:"ownerId"`
	Name        string         `gorm:"size:64;not null" json:"name"`
	Breed       string         `gorm:"size:64" json:"breed"`
	Gender      string         `gorm:"size:8" json:"gender"`
	Age         int            `json:"age"`
	Personality datatypes.JSON `gorm:"type:json" json:"personality"` // ["社牛","运动健将"]
	Bio         string         `gorm:"size:255" json:"bio"`
	BoneCount   int64          `gorm:"default:0" json:"boneCount"`
	CreatedAt   time.Time      `json:"createdAt"`
}
```

Run: `go get gorm.io/datatypes@v1.2.1`

- [ ] **Step 3: 写建表 SQL**

`migrations/0001_init.sql`:
```sql
CREATE TABLE IF NOT EXISTS users (
  id           BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  open_id      VARCHAR(64)  NOT NULL UNIQUE,
  phone        VARCHAR(20)  DEFAULT '',
  nickname     VARCHAR(64)  DEFAULT '',
  avatar       VARCHAR(255) DEFAULT '',
  bone_balance BIGINT       NOT NULL DEFAULT 0,
  created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pets (
  id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  owner_id    BIGINT UNSIGNED NOT NULL,
  name        VARCHAR(64)  NOT NULL,
  breed       VARCHAR(64)  DEFAULT '',
  gender      VARCHAR(8)   DEFAULT '',
  age         INT          DEFAULT 0,
  personality JSON,
  bio         VARCHAR(255) DEFAULT '',
  bone_count  BIGINT       NOT NULL DEFAULT 0,
  created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_owner (owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

- [ ] **Step 4: 写 docker-compose**

`docker-compose.yml`:
```yaml
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: pawmigo
      MYSQL_USER: pawmigo
      MYSQL_PASSWORD: pawmigo
    ports: ["3306:3306"]
    volumes:
      - ./migrations:/docker-entrypoint-initdb.d
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
```

- [ ] **Step 5: 编译确认无误**

Run: `go build ./...`
Expected: 无输出（成功）

- [ ] **Step 6: 提交**

```bash
git add pawmigo-server/
git commit -m "feat(server): add User/Pet models, migrations, docker-compose"
```

---

### Task 3: 仓储层（gorm + AutoMigrate）

**Files:**
- Create: `pawmigo-server/internal/repository/db.go`
- Create: `pawmigo-server/internal/repository/user_repo.go`
- Create: `pawmigo-server/internal/repository/pet_repo.go`
- Create: `pawmigo-server/internal/repository/pet_repo_test.go`

> 测试用 SQLite 内存库验证仓储逻辑，避免 CI 依赖 MySQL。
> Run: `go get gorm.io/driver/sqlite@v1.5.6`

- [ ] **Step 1: 写连接构造**

`internal/repository/db.go`:
```go
package repository

import (
	"github.com/redis/go-redis/v9"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	"github.com/pawmigo/server/internal/model"
)

func OpenMySQL(dsn string) (*gorm.DB, error) {
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}
	if err := db.AutoMigrate(&model.User{}, &model.Pet{}); err != nil {
		return nil, err
	}
	return db, nil
}

func OpenRedis(addr string) *redis.Client {
	return redis.NewClient(&redis.Options{Addr: addr})
}
```

- [ ] **Step 2: 写 UserRepo**

`internal/repository/user_repo.go`:
```go
package repository

import (
	"gorm.io/gorm"

	"github.com/pawmigo/server/internal/model"
)

type UserRepo struct{ db *gorm.DB }

func NewUserRepo(db *gorm.DB) *UserRepo { return &UserRepo{db: db} }

// FindOrCreateByOpenID 登录时按 openid 取用户，没有则建。
func (r *UserRepo) FindOrCreateByOpenID(openID string) (*model.User, error) {
	var u model.User
	err := r.db.Where("open_id = ?", openID).First(&u).Error
	if err == gorm.ErrRecordNotFound {
		u = model.User{OpenID: openID, Nickname: "毛孩子主人"}
		if err := r.db.Create(&u).Error; err != nil {
			return nil, err
		}
		return &u, nil
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepo) FindByID(id uint64) (*model.User, error) {
	var u model.User
	if err := r.db.First(&u, id).Error; err != nil {
		return nil, err
	}
	return &u, nil
}
```

- [ ] **Step 3: 写 PetRepo**

`internal/repository/pet_repo.go`:
```go
package repository

import (
	"gorm.io/gorm"

	"github.com/pawmigo/server/internal/model"
)

type PetRepo struct{ db *gorm.DB }

func NewPetRepo(db *gorm.DB) *PetRepo { return &PetRepo{db: db} }

func (r *PetRepo) Create(p *model.Pet) error { return r.db.Create(p).Error }

func (r *PetRepo) Update(p *model.Pet) error { return r.db.Save(p).Error }

func (r *PetRepo) FindByID(id uint64) (*model.Pet, error) {
	var p model.Pet
	if err := r.db.First(&p, id).Error; err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *PetRepo) ListByOwner(ownerID uint64) ([]model.Pet, error) {
	var pets []model.Pet
	if err := r.db.Where("owner_id = ?", ownerID).Find(&pets).Error; err != nil {
		return nil, err
	}
	return pets, nil
}
```

- [ ] **Step 4: 写仓储测试（SQLite 内存）**

`internal/repository/pet_repo_test.go`:
```go
package repository

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"github.com/pawmigo/server/internal/model"
)

func newTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&model.User{}, &model.Pet{}))
	return db
}

func TestUserFindOrCreate(t *testing.T) {
	repo := NewUserRepo(newTestDB(t))

	u1, err := repo.FindOrCreateByOpenID("openid-1")
	require.NoError(t, err)
	assert.NotZero(t, u1.ID)

	u2, err := repo.FindOrCreateByOpenID("openid-1")
	require.NoError(t, err)
	assert.Equal(t, u1.ID, u2.ID) // 同一 openid 不重复建

	u3, err := repo.FindOrCreateByOpenID("openid-2")
	require.NoError(t, err)
	assert.NotEqual(t, u1.ID, u3.ID)
}

func TestPetCRUD(t *testing.T) {
	db := newTestDB(t)
	repo := NewPetRepo(db)

	p := &model.Pet{OwnerID: 1, Name: "豆豆", Breed: "柯基"}
	require.NoError(t, repo.Create(p))
	assert.NotZero(t, p.ID)

	got, err := repo.FindByID(p.ID)
	require.NoError(t, err)
	assert.Equal(t, "豆豆", got.Name)

	got.Bio = "爱拆家"
	require.NoError(t, repo.Update(got))

	list, err := repo.ListByOwner(1)
	require.NoError(t, err)
	assert.Len(t, list, 1)
	assert.Equal(t, "爱拆家", list[0].Bio)
}
```

- [ ] **Step 5: 运行测试**

Run: `go test ./internal/repository/ -v`
Expected: PASS（TestUserFindOrCreate, TestPetCRUD）

- [ ] **Step 6: 提交**

```bash
git add pawmigo-server/
git commit -m "feat(server): add gorm repositories with sqlite-backed tests"
```

---

### Task 4: JWT 中间件

**Files:**
- Create: `pawmigo-server/internal/middleware/jwt.go`
- Create: `pawmigo-server/internal/middleware/jwt_test.go`

- [ ] **Step 1: 写失败测试**

`internal/middleware/jwt_test.go`:
```go
package middleware

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestSignAndParse(t *testing.T) {
	m := NewJWT("secret")
	token, err := m.Sign(42)
	require.NoError(t, err)
	assert.NotEmpty(t, token)

	uid, err := m.Parse(token)
	require.NoError(t, err)
	assert.Equal(t, uint64(42), uid)
}

func TestParseRejectsBadSecret(t *testing.T) {
	token, _ := NewJWT("secret").Sign(42)
	_, err := NewJWT("other").Parse(token)
	assert.Error(t, err)
}
```

- [ ] **Step 2: 运行测试确认失败**

Run: `go test ./internal/middleware/ -v`
Expected: FAIL（`NewJWT` 未定义）

- [ ] **Step 3: 实现 JWT**

`internal/middleware/jwt.go`:
```go
package middleware

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

const CtxUserID = "userID"

type JWT struct{ secret []byte }

func NewJWT(secret string) *JWT { return &JWT{secret: []byte(secret)} }

func (j *JWT) Sign(userID uint64) (string, error) {
	claims := jwt.MapClaims{
		"uid": userID,
		"exp": time.Now().Add(30 * 24 * time.Hour).Unix(),
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(j.secret)
}

func (j *JWT) Parse(token string) (uint64, error) {
	t, err := jwt.Parse(token, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return j.secret, nil
	})
	if err != nil || !t.Valid {
		return 0, errors.New("invalid token")
	}
	claims, ok := t.Claims.(jwt.MapClaims)
	if !ok {
		return 0, errors.New("invalid claims")
	}
	uid, ok := claims["uid"].(float64)
	if !ok {
		return 0, errors.New("missing uid")
	}
	return uint64(uid), nil
}

// Middleware 校验 Authorization: Bearer <jwt>，注入 userID 到 context。
func (j *JWT) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		h := c.GetHeader("Authorization")
		token := strings.TrimPrefix(h, "Bearer ")
		if token == "" || token == h {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing token"})
			return
		}
		uid, err := j.Parse(token)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}
		c.Set(CtxUserID, uid)
		c.Next()
	}
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `go test ./internal/middleware/ -v`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add pawmigo-server/
git commit -m "feat(server): add JWT sign/parse and gin auth middleware"
```

---

### Task 5: 微信登录服务

**Files:**
- Create: `pawmigo-server/internal/wxauth/client.go`
- Create: `pawmigo-server/internal/service/auth_service.go`
- Create: `pawmigo-server/internal/service/auth_service_test.go`

- [ ] **Step 1: 写微信客户端接口与真实实现**

`internal/wxauth/client.go`:
```go
package wxauth

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
)

// Session 是 code2session 的结果。
type Session struct {
	OpenID     string `json:"openid"`
	SessionKey string `json:"session_key"`
	ErrCode    int    `json:"errcode"`
	ErrMsg     string `json:"errmsg"`
}

// Client 抽象微信登录，便于在 service 测试中替换为 fake。
type Client interface {
	Code2Session(code string) (*Session, error)
}

type HTTPClient struct {
	AppID  string
	Secret string
}

func NewHTTPClient(appID, secret string) *HTTPClient {
	return &HTTPClient{AppID: appID, Secret: secret}
}

func (c *HTTPClient) Code2Session(code string) (*Session, error) {
	u := fmt.Sprintf(
		"https://api.weixin.qq.com/sns/jscode2session?appid=%s&secret=%s&js_code=%s&grant_type=authorization_code",
		url.QueryEscape(c.AppID), url.QueryEscape(c.Secret), url.QueryEscape(code),
	)
	resp, err := http.Get(u)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var s Session
	if err := json.NewDecoder(resp.Body).Decode(&s); err != nil {
		return nil, err
	}
	if s.ErrCode != 0 {
		return nil, errors.New("wx code2session: " + s.ErrMsg)
	}
	if s.OpenID == "" {
		return nil, errors.New("wx code2session: empty openid")
	}
	return &s, nil
}
```

- [ ] **Step 2: 写 AuthService 失败测试（用 fake 微信客户端）**

`internal/service/auth_service_test.go`:
```go
package service

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"github.com/pawmigo/server/internal/middleware"
	"github.com/pawmigo/server/internal/model"
	"github.com/pawmigo/server/internal/repository"
	"github.com/pawmigo/server/internal/wxauth"
)

type fakeWX struct {
	openID string
	err    error
}

func (f fakeWX) Code2Session(code string) (*wxauth.Session, error) {
	if f.err != nil {
		return nil, f.err
	}
	return &wxauth.Session{OpenID: f.openID, SessionKey: "sk"}, nil
}

func newDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&model.User{}, &model.Pet{}))
	return db
}

func TestLoginCreatesUserAndToken(t *testing.T) {
	db := newDB(t)
	svc := NewAuthService(
		fakeWX{openID: "ox-123"},
		repository.NewUserRepo(db),
		middleware.NewJWT("secret"),
	)

	out, err := svc.Login("any-code")
	require.NoError(t, err)
	assert.NotEmpty(t, out.Token)
	assert.NotZero(t, out.User.ID)

	// 同 openid 二次登录复用用户
	out2, err := svc.Login("any-code")
	require.NoError(t, err)
	assert.Equal(t, out.User.ID, out2.User.ID)
}
```

- [ ] **Step 3: 运行测试确认失败**

Run: `go test ./internal/service/ -run TestLoginCreatesUserAndToken -v`
Expected: FAIL（`NewAuthService` 未定义）

- [ ] **Step 4: 实现 AuthService**

`internal/service/auth_service.go`:
```go
package service

import (
	"github.com/pawmigo/server/internal/middleware"
	"github.com/pawmigo/server/internal/model"
	"github.com/pawmigo/server/internal/repository"
	"github.com/pawmigo/server/internal/wxauth"
)

type LoginOutput struct {
	Token string      `json:"token"`
	User  *model.User `json:"user"`
}

type AuthService struct {
	wx       wxauth.Client
	userRepo *repository.UserRepo
	jwt      *middleware.JWT
}

func NewAuthService(wx wxauth.Client, ur *repository.UserRepo, j *middleware.JWT) *AuthService {
	return &AuthService{wx: wx, userRepo: ur, jwt: j}
}

func (s *AuthService) Login(code string) (*LoginOutput, error) {
	sess, err := s.wx.Code2Session(code)
	if err != nil {
		return nil, err
	}
	user, err := s.userRepo.FindOrCreateByOpenID(sess.OpenID)
	if err != nil {
		return nil, err
	}
	token, err := s.jwt.Sign(user.ID)
	if err != nil {
		return nil, err
	}
	return &LoginOutput{Token: token, User: user}, nil
}
```

- [ ] **Step 5: 运行测试确认通过**

Run: `go test ./internal/service/ -v`
Expected: PASS

- [ ] **Step 6: 提交**

```bash
git add pawmigo-server/
git commit -m "feat(server): add wx code2session client and auth service"
```

---

### Task 6: 宠物档案服务

**Files:**
- Create: `pawmigo-server/internal/service/pet_service.go`
- Create: `pawmigo-server/internal/service/pet_service_test.go`

- [ ] **Step 1: 写失败测试**

`internal/service/pet_service_test.go`:
```go
package service

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/pawmigo/server/internal/repository"
)

func TestCreatePetAndList(t *testing.T) {
	db := newDB(t)
	svc := NewPetService(repository.NewPetRepo(db))

	pet, err := svc.Create(7, CreatePetInput{
		Name:        "雪球",
		Breed:       "萨摩耶",
		Gender:      "母",
		Age:         2,
		Personality: []string{"社牛", "运动健将"},
		Bio:         "微笑天使",
	})
	require.NoError(t, err)
	assert.NotZero(t, pet.ID)
	assert.Equal(t, uint64(7), pet.OwnerID)

	list, err := svc.ListByOwner(7)
	require.NoError(t, err)
	assert.Len(t, list, 1)
	assert.Equal(t, "雪球", list[0].Name)
}

func TestUpdatePetRejectsWrongOwner(t *testing.T) {
	db := newDB(t)
	svc := NewPetService(repository.NewPetRepo(db))
	pet, _ := svc.Create(7, CreatePetInput{Name: "豆豆"})

	_, err := svc.Update(999, pet.ID, CreatePetInput{Name: "黑客"})
	assert.ErrorIs(t, err, ErrForbidden)
}
```

- [ ] **Step 2: 运行测试确认失败**

Run: `go test ./internal/service/ -run TestCreatePet -v`
Expected: FAIL（`NewPetService` 未定义）

- [ ] **Step 3: 实现 PetService**

`internal/service/pet_service.go`:
```go
package service

import (
	"encoding/json"
	"errors"

	"gorm.io/datatypes"

	"github.com/pawmigo/server/internal/model"
	"github.com/pawmigo/server/internal/repository"
)

var ErrForbidden = errors.New("forbidden")

type CreatePetInput struct {
	Name        string   `json:"name" binding:"required"`
	Breed       string   `json:"breed"`
	Gender      string   `json:"gender"`
	Age         int      `json:"age"`
	Personality []string `json:"personality"`
	Bio         string   `json:"bio"`
}

type PetService struct{ repo *repository.PetRepo }

func NewPetService(repo *repository.PetRepo) *PetService { return &PetService{repo: repo} }

func toJSON(v []string) datatypes.JSON {
	if v == nil {
		v = []string{}
	}
	b, _ := json.Marshal(v)
	return datatypes.JSON(b)
}

func (s *PetService) Create(ownerID uint64, in CreatePetInput) (*model.Pet, error) {
	p := &model.Pet{
		OwnerID:     ownerID,
		Name:        in.Name,
		Breed:       in.Breed,
		Gender:      in.Gender,
		Age:         in.Age,
		Personality: toJSON(in.Personality),
		Bio:         in.Bio,
	}
	if err := s.repo.Create(p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *PetService) Update(ownerID, petID uint64, in CreatePetInput) (*model.Pet, error) {
	p, err := s.repo.FindByID(petID)
	if err != nil {
		return nil, err
	}
	if p.OwnerID != ownerID {
		return nil, ErrForbidden
	}
	p.Name = in.Name
	p.Breed = in.Breed
	p.Gender = in.Gender
	p.Age = in.Age
	p.Personality = toJSON(in.Personality)
	p.Bio = in.Bio
	if err := s.repo.Update(p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *PetService) ListByOwner(ownerID uint64) ([]model.Pet, error) {
	return s.repo.ListByOwner(ownerID)
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `go test ./internal/service/ -v`
Expected: PASS（4 个测试）

- [ ] **Step 5: 提交**

```bash
git add pawmigo-server/
git commit -m "feat(server): add pet service with ownership check"
```

---

### Task 7: HTTP handler 与路由

**Files:**
- Create: `pawmigo-server/internal/handler/auth_handler.go`
- Create: `pawmigo-server/internal/handler/pet_handler.go`
- Create: `pawmigo-server/internal/handler/router.go`
- Create: `pawmigo-server/internal/handler/router_test.go`

- [ ] **Step 1: 写 auth handler**

`internal/handler/auth_handler.go`:
```go
package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/pawmigo/server/internal/service"
)

type AuthHandler struct{ svc *service.AuthService }

func NewAuthHandler(svc *service.AuthService) *AuthHandler { return &AuthHandler{svc: svc} }

func (h *AuthHandler) WXLogin(c *gin.Context) {
	var req struct {
		Code string `json:"code" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "code required"})
		return
	}
	out, err := h.svc.Login(req.Code)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, out)
}
```

- [ ] **Step 2: 写 pet handler**

`internal/handler/pet_handler.go`:
```go
package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/pawmigo/server/internal/middleware"
	"github.com/pawmigo/server/internal/repository"
	"github.com/pawmigo/server/internal/service"
)

type PetHandler struct {
	petSvc   *service.PetService
	userRepo *repository.UserRepo
}

func NewPetHandler(petSvc *service.PetService, ur *repository.UserRepo) *PetHandler {
	return &PetHandler{petSvc: petSvc, userRepo: ur}
}

func uid(c *gin.Context) uint64 { return c.GetUint64(middleware.CtxUserID) }

func (h *PetHandler) Me(c *gin.Context) {
	u, err := h.userRepo.FindByID(uid(c))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	pets, _ := h.petSvc.ListByOwner(u.ID)
	c.JSON(http.StatusOK, gin.H{"user": u, "pets": pets})
}

func (h *PetHandler) CreatePet(c *gin.Context) {
	var in service.CreatePetInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	pet, err := h.petSvc.Create(uid(c), in)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, pet)
}

func (h *PetHandler) UpdatePet(c *gin.Context) {
	petID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad id"})
		return
	}
	var in service.CreatePetInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	pet, err := h.petSvc.Update(uid(c), petID, in)
	if errors.Is(err, service.ErrForbidden) {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your pet"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, pet)
}
```

- [ ] **Step 3: 写 router**

`internal/handler/router.go`:
```go
package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/pawmigo/server/internal/middleware"
)

func NewRouter(auth *AuthHandler, pet *PetHandler, jwt *middleware.JWT) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())

	v1 := r.Group("/api/v1")
	v1.POST("/auth/wx-login", auth.WXLogin)

	authed := v1.Group("")
	authed.Use(jwt.Middleware())
	authed.GET("/me", pet.Me)
	authed.POST("/pets", pet.CreatePet)
	authed.PUT("/pets/:id", pet.UpdatePet)

	return r
}
```

- [ ] **Step 4: 写 handler 集成测试（httptest，fake 微信）**

`internal/handler/router_test.go`:
```go
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
```

- [ ] **Step 5: 运行测试确认通过**

Run: `go test ./internal/handler/ -v`
Expected: PASS（TestFullAuthAndPetFlow）

- [ ] **Step 6: 提交**

```bash
git add pawmigo-server/
git commit -m "feat(server): add auth/pet handlers, router, integration test"
```

---

### Task 8: 装配 main.go 并跑通

**Files:**
- Create: `pawmigo-server/cmd/server/main.go`

- [ ] **Step 1: 写 main**

`cmd/server/main.go`:
```go
package main

import (
	"log"

	"github.com/pawmigo/server/internal/config"
	"github.com/pawmigo/server/internal/handler"
	"github.com/pawmigo/server/internal/middleware"
	"github.com/pawmigo/server/internal/repository"
	"github.com/pawmigo/server/internal/service"
	"github.com/pawmigo/server/internal/wxauth"
)

func main() {
	cfg := config.Load()

	db, err := repository.OpenMySQL(cfg.MySQLDSN)
	if err != nil {
		log.Fatalf("mysql: %v", err)
	}
	_ = repository.OpenRedis(cfg.RedisAddr) // Plan 2 起使用

	jwt := middleware.NewJWT(cfg.JWTSecret)
	userRepo := repository.NewUserRepo(db)
	petSvc := service.NewPetService(repository.NewPetRepo(db))
	authSvc := service.NewAuthService(
		wxauth.NewHTTPClient(cfg.WXAppID, cfg.WXSecret), userRepo, jwt,
	)

	r := handler.NewRouter(
		handler.NewAuthHandler(authSvc),
		handler.NewPetHandler(petSvc, userRepo),
		jwt,
	)
	log.Printf("listening on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}
```

- [ ] **Step 2: 启动依赖并构建**

Run:
```bash
docker compose up -d
go build ./...
go vet ./...
```
Expected: 构建无错误

- [ ] **Step 3: 全量测试**

Run: `go test ./...`
Expected: 所有包 PASS（ok config / middleware / repository / service / handler）

- [ ] **Step 4: 手动冒烟（可选）**

Run:
```bash
cp .env.example .env  # 按需修改
go run ./cmd/server &
curl -s -X POST localhost:8080/api/v1/auth/wx-login -d '{"code":"x"}' -H 'Content-Type: application/json'
```
Expected: 因 code 无效返回 401 `{"error":"wx code2session: ..."}`（说明链路打通，仅微信侧拒绝）

- [ ] **Step 5: 提交**

```bash
git add pawmigo-server/
git commit -m "feat(server): wire main.go, full server boots"
```

---

## Phase B · 前端 Taro 骨架

### Task 9: 初始化 Taro 项目与 5 tab

**Files:**
- Create: `pawmigo-mini/` (脚手架)
- Modify: `pawmigo-mini/src/app.config.ts`

- [ ] **Step 1: 脚手架**

Run:
```bash
npx @tarojs/cli@3.6.34 init pawmigo-mini
# 选择：TypeScript / React / 普通模板 / 包管理器 npm
cd pawmigo-mini && npm i zustand@4.5.5
```

- [ ] **Step 2: 配置 5 个 tab**

`src/app.config.ts`:
```ts
export default defineAppConfig({
  pages: [
    'pages/map/index',
    'pages/feed/index',
    'pages/encounter/index',
    'pages/team/index',
    'pages/profile/index',
    'pages/login/index',
  ],
  window: {
    navigationBarTitleText: '遛遛 Pawmigo',
    navigationBarBackgroundColor: '#ffffff',
  },
  tabBar: {
    color: '#999',
    selectedColor: '#FF8A3D',
    list: [
      { pagePath: 'pages/map/index', text: '地图' },
      { pagePath: 'pages/feed/index', text: '圈子' },
      { pagePath: 'pages/encounter/index', text: '偶遇' },
      { pagePath: 'pages/team/index', text: '组队' },
      { pagePath: 'pages/profile/index', text: '我的' },
    ],
  },
  permission: {
    'scope.userLocation': { desc: '用于发现附近正在遛狗的伙伴' },
  },
})
```

- [ ] **Step 3: 建占位页**

为 `map / feed / encounter / team` 各建 `index.tsx`，内容统一占位（示例 map）：

`src/pages/map/index.tsx`:
```tsx
import { View, Text } from '@tarojs/components'
export default function Map() {
  return (
    <View className='page'>
      <Text>地图 · 附近在遛（Plan 2 实现）</Text>
    </View>
  )
}
```
其余三页同构，替换文案为「圈子 / 偶遇 / 组队」。

- [ ] **Step 4: 编译微信端**

Run: `npm run build:weapp`
Expected: 生成 `dist/`，无报错

- [ ] **Step 5: 提交**

```bash
git add pawmigo-mini/
git commit -m "feat(mini): scaffold taro app with 5 tabs and placeholders"
```

---

### Task 10: API 请求层与 authStore

**Files:**
- Create: `pawmigo-mini/src/services/request.ts`
- Create: `pawmigo-mini/src/services/api.ts`
- Create: `pawmigo-mini/src/store/authStore.ts`

- [ ] **Step 1: 写 request 封装**

`src/services/request.ts`:
```ts
import Taro from '@tarojs/taro'

const BASE_URL = 'http://localhost:8080/api/v1' // 上线改为 https 域名

export async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  data?: Record<string, unknown>,
): Promise<T> {
  const token = Taro.getStorageSync('jwt')
  const res = await Taro.request({
    url: BASE_URL + path,
    method,
    data,
    header: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (res.statusCode >= 400) {
    throw new Error((res.data as any)?.error || `HTTP ${res.statusCode}`)
  }
  return res.data as T
}
```

- [ ] **Step 2: 写 api 接口**

`src/services/api.ts`:
```ts
import { request } from './request'

export interface User {
  id: number
  nickname: string
  avatar: string
  boneBalance: number
}

export interface Pet {
  id: number
  ownerId: number
  name: string
  breed: string
  gender: string
  age: number
  personality: string[]
  bio: string
  boneCount: number
}

export interface LoginResult {
  token: string
  user: User
}

export const api = {
  wxLogin: (code: string) =>
    request<LoginResult>('POST', '/auth/wx-login', { code }),
  me: () => request<{ user: User; pets: Pet[] }>('GET', '/me'),
  createPet: (input: Partial<Pet>) => request<Pet>('POST', '/pets', input),
  updatePet: (id: number, input: Partial<Pet>) =>
    request<Pet>('PUT', `/pets/${id}`, input),
}
```

- [ ] **Step 3: 写 authStore**

`src/store/authStore.ts`:
```ts
import { create } from 'zustand'
import Taro from '@tarojs/taro'
import { api, User, Pet } from '../services/api'

interface AuthState {
  user: User | null
  pets: Pet[]
  activePetId: number | null
  login: () => Promise<void>
  refreshMe: () => Promise<void>
  setActivePet: (id: number) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  pets: [],
  activePetId: null,
  login: async () => {
    const { code } = await Taro.login()
    const res = await api.wxLogin(code)
    Taro.setStorageSync('jwt', res.token)
    set({ user: res.user })
    await get().refreshMe()
  },
  refreshMe: async () => {
    const { user, pets } = await api.me()
    set({
      user,
      pets,
      activePetId: get().activePetId ?? pets[0]?.id ?? null,
    })
  },
  setActivePet: (id) => set({ activePetId: id }),
}))
```

- [ ] **Step 4: 类型检查**

Run: `npx tsc --noEmit`
Expected: 无类型错误

- [ ] **Step 5: 提交**

```bash
git add pawmigo-mini/
git commit -m "feat(mini): add request layer, api client, auth store"
```

---

### Task 11: 登录页与宠物档案页

**Files:**
- Create: `pawmigo-mini/src/pages/login/index.tsx`
- Create: `pawmigo-mini/src/pages/profile/index.tsx`
- Create: `pawmigo-mini/src/pages/profile/pet-form.tsx`

- [ ] **Step 1: 写登录页**

`src/pages/login/index.tsx`:
```tsx
import { View, Button, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '../../store/authStore'

export default function Login() {
  const login = useAuthStore((s) => s.login)

  const handleLogin = async () => {
    try {
      await login()
      Taro.switchTab({ url: '/pages/map/index' })
    } catch (e) {
      Taro.showToast({ title: '登录失败', icon: 'none' })
    }
  }

  return (
    <View className='page'>
      <Text>🐾 遛遛 Pawmigo</Text>
      <Text>附近的毛孩子，一起遛个弯</Text>
      <Button onClick={handleLogin}>微信一键登录</Button>
    </View>
  )
}
```

- [ ] **Step 2: 写宠物表单页**

`src/pages/profile/pet-form.tsx`:
```tsx
import { useState } from 'react'
import { View, Input, Textarea, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { api, Pet } from '../../services/api'
import { useAuthStore } from '../../store/authStore'

export default function PetForm() {
  const refreshMe = useAuthStore((s) => s.refreshMe)
  const [form, setForm] = useState<Partial<Pet>>({
    name: '', breed: '', gender: '', age: 0, personality: [], bio: '',
  })

  const update = (k: keyof Pet, v: any) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.name) {
      Taro.showToast({ title: '请填昵称', icon: 'none' })
      return
    }
    await api.createPet(form)
    await refreshMe()
    Taro.navigateBack()
  }

  return (
    <View className='page'>
      <Input placeholder='宠物昵称' value={form.name}
        onInput={(e) => update('name', e.detail.value)} />
      <Input placeholder='品种（柯基/萨摩耶…）' value={form.breed}
        onInput={(e) => update('breed', e.detail.value)} />
      <Input placeholder='性别' value={form.gender}
        onInput={(e) => update('gender', e.detail.value)} />
      <Input type='number' placeholder='年龄' value={String(form.age ?? '')}
        onInput={(e) => update('age', Number(e.detail.value) || 0)} />
      <Input placeholder='性格标签，逗号分隔'
        onInput={(e) => update('personality', e.detail.value.split(/[,，]/).filter(Boolean))} />
      <Textarea placeholder='简介' value={form.bio}
        onInput={(e) => update('bio', e.detail.value)} />
      <Button onClick={submit}>保存档案</Button>
    </View>
  )
}
```

将 `pages/profile/pet-form` 加入 `app.config.ts` 的 `pages` 数组。

- [ ] **Step 3: 写"我的"页**

`src/pages/profile/index.tsx`:
```tsx
import { useDidShow } from '@tarojs/taro'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '../../store/authStore'

export default function Profile() {
  const { user, pets, refreshMe } = useAuthStore()

  useDidShow(() => {
    if (Taro.getStorageSync('jwt')) {
      refreshMe().catch(() => {})
    }
  })

  if (!user) {
    return (
      <View className='page'>
        <Text>未登录</Text>
        <Button onClick={() => Taro.navigateTo({ url: '/pages/login/index' })}>
          去登录
        </Button>
      </View>
    )
  }

  return (
    <View className='page'>
      <Text>{user.nickname} · 🦴 {user.boneBalance}</Text>
      <Text>我的毛孩子（{pets.length}）</Text>
      {pets.map((p) => (
        <View key={p.id}>
          <Text>{p.name} · {p.breed} · {p.personality.join('/')}</Text>
        </View>
      ))}
      <Button onClick={() => Taro.navigateTo({ url: '/pages/profile/pet-form' })}>
        + 添加宠物档案
      </Button>
    </View>
  )
}
```

- [ ] **Step 4: 类型检查 + 构建**

Run:
```bash
npx tsc --noEmit
npm run build:weapp
```
Expected: 无错误

- [ ] **Step 5: 微信开发者工具手动验证**

打开微信开发者工具导入 `dist`，确认：
- 登录页点击 → 进入地图 tab
- "我的"页显示用户与空宠物列表
- 添加宠物 → 返回后列表出现新宠物

（需后端 `go run ./cmd/server` 在运行，且开发者工具勾选"不校验合法域名"）

- [ ] **Step 6: 提交**

```bash
git add pawmigo-mini/
git commit -m "feat(mini): add login, profile, pet-form pages — auth+pet flow works"
```

---

## Self-Review 覆盖说明

| 设计 spec 项 | 对应任务 |
|---|---|
| Go/Gin + MySQL + Redis 骨架 | Task 1-3, 8 |
| 微信登录 → JWT | Task 4, 5, 7 |
| User / Pet 数据模型（JSON personality） | Task 2 |
| `POST /auth/wx-login`、`/me`、`/pets` | Task 7 |
| JWT 鉴权所有受保护 API | Task 4, 7 |
| Taro 5 tab 骨架 | Task 9 |
| authStore + API 层 | Task 10 |
| 宠物档案创建/管理 + 多宠物列表 | Task 6, 11 |

> Plan 1 不含地图/偶遇/朋友圈业务逻辑——这些在 Plan 2-4。`OpenRedis` 在 main 中已建连接但留待 Plan 2 使用。
