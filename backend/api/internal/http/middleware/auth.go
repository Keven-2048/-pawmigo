package middleware

import (
	"net/http"
	"strings"

	jwtauth "pawmigo/backend/api/internal/auth"
	"pawmigo/backend/api/internal/http/response"

	"github.com/gin-gonic/gin"
)

const CurrentUserKey = "currentUserId"

func Auth() gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			response.Error(c, http.StatusUnauthorized, "用户未登录")
			c.Abort()
			return
		}

		userID, err := jwtauth.Parse(strings.TrimPrefix(header, "Bearer "))
		if err != nil {
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
