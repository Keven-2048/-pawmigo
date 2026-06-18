package gormstore_test

import (
	"testing"

	"pawmigo/backend/api/internal/store"
	"pawmigo/backend/api/internal/store/gormstore"
	"pawmigo/backend/api/internal/store/storetest"
)

func TestStoreContract(t *testing.T) {
	storetest.RunContract(t, func(t *testing.T) store.Store {
		t.Helper()
		db := gormstore.OpenForTest()
		gormstore.Seed(db)
		return gormstore.New(db)
	})
}
