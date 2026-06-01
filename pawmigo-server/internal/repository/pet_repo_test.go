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
