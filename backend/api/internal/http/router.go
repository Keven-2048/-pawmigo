package http

import (
	nethttp "net/http"
	"strconv"

	jwtauth "pawmigo/backend/api/internal/auth"
	"pawmigo/backend/api/internal/domain"
	"pawmigo/backend/api/internal/http/middleware"
	"pawmigo/backend/api/internal/http/response"
	storepkg "pawmigo/backend/api/internal/store"

	"github.com/gin-gonic/gin"
)

func NewRouter(store storepkg.Store) *gin.Engine {
	gin.SetMode(gin.ReleaseMode)
	router := gin.New()
	router.Use(gin.Recovery())

	router.GET("/healthz", func(c *gin.Context) {
		response.OK(c, gin.H{"status": "ok"})
	})

	router.GET("/readyz", func(c *gin.Context) {
		if err := store.Ping(); err != nil {
			response.Error(c, nethttp.StatusServiceUnavailable, "数据库不可用")
			return
		}
		response.OK(c, gin.H{"status": "ready"})
	})

	api := router.Group("/api/v1")
	api.POST("/auth/wechat-login", func(c *gin.Context) {
		loginResult := store.Login()
		devToken, ok := loginResult["token"].(string)
		if !ok {
			response.Error(c, nethttp.StatusInternalServerError, "登录状态生成失败")
			return
		}
		userID, ok := store.UserIDForToken(devToken)
		if !ok {
			response.Error(c, nethttp.StatusInternalServerError, "登录状态生成失败")
			return
		}
		token, err := jwtauth.Issue(userID)
		if err != nil {
			response.Error(c, nethttp.StatusInternalServerError, "登录状态生成失败")
			return
		}
		loginResult["token"] = token
		response.OK(c, loginResult)
	})

	auth := api.Group("")
	auth.Use(middleware.Auth())

	auth.GET("/user/me", func(c *gin.Context) {
		user, err := store.Me(currentUserID(c))
		writeResult(c, user, err)
	})
	auth.PUT("/user/privacy", func(c *gin.Context) {
		var payload domain.PrivacySettings
		if !bindJSON(c, &payload) {
			return
		}
		user, err := store.UpdatePrivacy(currentUserID(c), payload)
		writeResult(c, user, err)
	})

	auth.GET("/blocks", func(c *gin.Context) {
		response.OK(c, store.Blocks(currentUserID(c)))
	})
	auth.POST("/blocks", func(c *gin.Context) {
		var payload storepkg.BlockPayload
		if !bindJSON(c, &payload) {
			return
		}
		block, err := store.CreateBlock(currentUserID(c), payload)
		writeResult(c, block, err)
	})

	auth.GET("/pets/my", func(c *gin.Context) {
		response.OK(c, store.MyPets(currentUserID(c)))
	})
	auth.POST("/pets", func(c *gin.Context) {
		var payload storepkg.PetPayload
		if !bindJSON(c, &payload) {
			return
		}
		pet, err := store.CreatePet(currentUserID(c), payload)
		writeResult(c, pet, err)
	})
	auth.GET("/pets/:id", func(c *gin.Context) {
		pet, err := store.PetDetail(currentUserID(c), paramID(c, "id"))
		writeResult(c, pet, err)
	})
	auth.PUT("/pets/:id", func(c *gin.Context) {
		var payload storepkg.PetPayload
		if !bindJSON(c, &payload) {
			return
		}
		pet, err := store.UpdatePet(currentUserID(c), paramID(c, "id"), payload)
		writeResult(c, pet, err)
	})
	auth.DELETE("/pets/:id", func(c *gin.Context) {
		err := store.DeletePet(currentUserID(c), paramID(c, "id"))
		writeResult(c, nil, err)
	})
	auth.POST("/pets/:id/default", func(c *gin.Context) {
		pet, err := store.SetDefaultPet(currentUserID(c), paramID(c, "id"))
		writeResult(c, pet, err)
	})

	auth.POST("/location/update", func(c *gin.Context) {
		var payload map[string]any
		if !bindJSON(c, &payload) {
			return
		}
		response.OK(c, store.UpdateLocation(currentUserID(c), payload))
	})

	auth.GET("/nearby/pets", func(c *gin.Context) {
		filter := map[string]string{
			"type":   c.Query("type"),
			"gender": c.Query("gender"),
		}
		response.OK(c, store.NearbyPets(currentUserID(c), filter, queryInt(c, "page", 1), queryInt(c, "page_size", 20)))
	})

	auth.POST("/invites", func(c *gin.Context) {
		var payload storepkg.InvitePayload
		if !bindJSON(c, &payload) {
			return
		}
		invite, err := store.CreateInvite(currentUserID(c), payload)
		writeResult(c, invite, err)
	})
	auth.GET("/invites", func(c *gin.Context) {
		response.OK(c, store.Invites(currentUserID(c), c.DefaultQuery("box", "received"), c.Query("status")))
	})
	auth.GET("/invites/:id", func(c *gin.Context) {
		invite, err := store.InviteDetail(currentUserID(c), paramID(c, "id"))
		writeResult(c, invite, err)
	})
	auth.POST("/invites/:id/accept", func(c *gin.Context) {
		invite, err := store.UpdateInvite(currentUserID(c), paramID(c, "id"), "accept")
		writeResult(c, invite, err)
	})
	auth.POST("/invites/:id/reject", func(c *gin.Context) {
		invite, err := store.UpdateInvite(currentUserID(c), paramID(c, "id"), "reject")
		writeResult(c, invite, err)
	})
	auth.POST("/invites/:id/cancel", func(c *gin.Context) {
		invite, err := store.UpdateInvite(currentUserID(c), paramID(c, "id"), "cancel")
		writeResult(c, invite, err)
	})

	auth.GET("/posts", func(c *gin.Context) {
		response.OK(c, store.Posts(currentUserID(c), c.DefaultQuery("feed", "recommend"), queryInt(c, "page", 1), queryInt(c, "page_size", 20)))
	})
	auth.POST("/posts", func(c *gin.Context) {
		var payload storepkg.PostPayload
		if !bindJSON(c, &payload) {
			return
		}
		post, err := store.CreatePost(currentUserID(c), payload)
		writeResult(c, post, err)
	})
	auth.GET("/posts/:id", func(c *gin.Context) {
		post, err := store.PostDetail(currentUserID(c), paramID(c, "id"))
		writeResult(c, post, err)
	})
	auth.DELETE("/posts/:id", func(c *gin.Context) {
		err := store.DeletePost(currentUserID(c), paramID(c, "id"))
		writeResult(c, nil, err)
	})
	auth.POST("/posts/:id/like", func(c *gin.Context) {
		post, err := store.ToggleLike(currentUserID(c), paramID(c, "id"), true)
		writeResult(c, post, err)
	})
	auth.DELETE("/posts/:id/like", func(c *gin.Context) {
		post, err := store.ToggleLike(currentUserID(c), paramID(c, "id"), false)
		writeResult(c, post, err)
	})
	auth.GET("/posts/:id/comments", func(c *gin.Context) {
		comments, err := store.Comments(currentUserID(c), paramID(c, "id"))
		writeResult(c, comments, err)
	})
	auth.POST("/posts/:id/comments", func(c *gin.Context) {
		var payload struct {
			Content string `json:"content"`
		}
		if !bindJSON(c, &payload) {
			return
		}
		comment, err := store.CreateComment(currentUserID(c), paramID(c, "id"), payload.Content)
		writeResult(c, comment, err)
	})
	auth.DELETE("/comments/:id", func(c *gin.Context) {
		err := store.DeleteComment(currentUserID(c), paramID(c, "id"))
		writeResult(c, nil, err)
	})

	auth.POST("/reports", func(c *gin.Context) {
		var payload storepkg.ReportPayload
		if !bindJSON(c, &payload) {
			return
		}
		report, err := store.CreateReport(currentUserID(c), payload)
		writeResult(c, report, err)
	})

	return router
}

func currentUserID(c *gin.Context) int64 {
	return middleware.CurrentUserID(c)
}

func bindJSON(c *gin.Context, target any) bool {
	if err := c.ShouldBindJSON(target); err != nil {
		response.Error(c, nethttp.StatusBadRequest, "请求参数无效")
		return false
	}
	return true
}

func writeResult(c *gin.Context, data any, err error) {
	if err != nil {
		status := nethttp.StatusBadRequest
		if err == storepkg.ErrNotFound {
			status = nethttp.StatusNotFound
		}
		response.Error(c, status, err.Error())
		return
	}
	response.OK(c, data)
}

func paramID(c *gin.Context, name string) int64 {
	value, _ := strconv.ParseInt(c.Param(name), 10, 64)
	return value
}

func queryInt(c *gin.Context, name string, fallback int) int {
	value, err := strconv.Atoi(c.Query(name))
	if err != nil || value <= 0 {
		return fallback
	}
	return value
}
