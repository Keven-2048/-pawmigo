package middleware

import (
	"net/http"
	"strings"

	"pawmigo/backend/api/internal/http/response"
	"pawmigo/backend/api/internal/store/memory"

	"github.com/gin-gonic/gin"
)

const CurrentUserKey = "currentUserId"

func Auth(store *memory.Store) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			response.Error(c, http.StatusUnauthorized, "用户未登录")
			c.Abort()
			return
		}

		userID, ok := store.UserIDForToken(strings.TrimPrefix(header, "Bearer "))
		if !ok {
			response.Error(c, http.StatusUnauthorized, "用户未登录")
			c.Abort()
			return
		}

		c.Set(CurrentUserKey, userID)
		c.Next()
	}
}

func CurrentUserID(c *gin.Context) int64 {
	value, exists := c.Get(CurrentUserKey)
	if !exists {
		return 0
	}
	id, ok := value.(int64)
	if !ok {
		return 0
	}
	return id
}
