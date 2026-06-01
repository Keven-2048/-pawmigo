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
