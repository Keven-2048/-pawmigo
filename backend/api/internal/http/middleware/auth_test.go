package middleware

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"
	"time"

	jwtauth "pawmigo/backend/api/internal/auth"

	"github.com/gin-gonic/gin"
)

func newAuthTestContext(method string, target string, authorization string) (*gin.Context, *httptest.ResponseRecorder) {
	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	context.Request = httptest.NewRequest(method, target, nil)
	if authorization != "" {
		context.Request.Header.Set("Authorization", authorization)
	}
	return context, recorder
}

func decodeAuthBody(t *testing.T, recorder *httptest.ResponseRecorder) map[string]any {
	t.Helper()

	var body map[string]any
	if err := json.Unmarshal(recorder.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode response body: %v", err)
	}
	return body
}

func assertUnauthorizedLoginRequired(t *testing.T, recorder *httptest.ResponseRecorder) {
	t.Helper()

	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusUnauthorized)
	}

	body := decodeAuthBody(t, recorder)
	if body["code"] != float64(http.StatusUnauthorized) {
		t.Fatalf("code = %#v, want %d", body["code"], http.StatusUnauthorized)
	}
	if body["message"] != "用户未登录" {
		t.Fatalf("message = %#v, want 用户未登录", body["message"])
	}
	if _, exists := body["data"]; exists {
		t.Fatalf("data field exists in %#v, want omitted", body)
	}
}

func TestAuth_RejectsMissingBearerToken(t *testing.T) {
	context, recorder := newAuthTestContext(http.MethodGet, "/protected", "")

	Auth()(context)

	assertUnauthorizedLoginRequired(t, recorder)
	if !context.IsAborted() {
		t.Fatal("context was not aborted")
	}
}

func TestAuth_RejectsWrongAuthorizationPrefix(t *testing.T) {
	context, recorder := newAuthTestContext(http.MethodGet, "/protected", "Token dev-token-pawmigo")

	Auth()(context)

	assertUnauthorizedLoginRequired(t, recorder)
	if !context.IsAborted() {
		t.Fatal("context was not aborted")
	}
}

func TestAuth_RejectsInvalidToken(t *testing.T) {
	context, recorder := newAuthTestContext(http.MethodGet, "/protected", "Bearer unknown-token")

	Auth()(context)

	assertUnauthorizedLoginRequired(t, recorder)
	if !context.IsAborted() {
		t.Fatal("context was not aborted")
	}
}

func TestAuth_RejectsExpiredToken(t *testing.T) {
	t.Setenv("PAWMIGO_JWT_SECRET", "middleware-expired-secret")
	expiredToken, err := buildExpiredJWTForMiddlewareTest(1)
	if err != nil {
		t.Fatalf("build expired token: %v", err)
	}
	context, recorder := newAuthTestContext(http.MethodGet, "/protected", "Bearer "+expiredToken)

	Auth()(context)

	assertUnauthorizedLoginRequired(t, recorder)
	if !context.IsAborted() {
		t.Fatal("context was not aborted")
	}
}

func TestAuth_AllowsKnownTokenAndSetsCurrentUser(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	called := false

	token, err := jwtauth.Issue(42)
	if err != nil {
		t.Fatalf("Issue() error = %v", err)
	}

	router.Use(Auth())
	router.GET("/protected", func(context *gin.Context) {
		called = true
		userID := CurrentUserID(context)
		if userID != int64(42) {
			t.Fatalf("current user id = %d, want 42", userID)
		}
		context.JSON(http.StatusOK, gin.H{"userID": userID})
	})

	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/protected", nil)
	request.Header.Set("Authorization", "Bearer "+token)

	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body=%s", recorder.Code, http.StatusOK, recorder.Body.String())
	}
	if !called {
		t.Fatal("downstream handler was not called")
	}

	body := decodeAuthBody(t, recorder)
	if body["userID"] != float64(42) {
		t.Fatalf("userID = %#v, want 42", body["userID"])
	}
}

func buildExpiredJWTForMiddlewareTest(userID int64) (string, error) {
	now := time.Now()
	headerJSON, err := json.Marshal(map[string]string{"alg": "HS256", "typ": "JWT"})
	if err != nil {
		return "", err
	}
	payloadJSON, err := json.Marshal(map[string]any{
		"sub": strconv.FormatInt(userID, 10),
		"iat": now.Add(-2 * time.Hour).Unix(),
		"exp": now.Add(-time.Hour).Unix(),
	})
	if err != nil {
		return "", err
	}
	unsigned := base64.RawURLEncoding.EncodeToString(headerJSON) + "." + base64.RawURLEncoding.EncodeToString(payloadJSON)
	mac := hmac.New(sha256.New, []byte("middleware-expired-secret"))
	mac.Write([]byte(unsigned))
	return unsigned + "." + base64.RawURLEncoding.EncodeToString(mac.Sum(nil)), nil
}

func TestCurrentUserID_ReturnsInt64Value(t *testing.T) {
	context, _ := newAuthTestContext(http.MethodGet, "/protected", "")
	context.Set(CurrentUserKey, int64(42))

	if got := CurrentUserID(context); got != int64(42) {
		t.Fatalf("CurrentUserID() = %d, want 42", got)
	}
}

func TestCurrentUserID_ReturnsZeroWhenMissing(t *testing.T) {
	context, _ := newAuthTestContext(http.MethodGet, "/protected", "")

	if got := CurrentUserID(context); got != 0 {
		t.Fatalf("CurrentUserID() = %d, want 0", got)
	}
}

func TestCurrentUserID_ReturnsZeroForWrongType(t *testing.T) {
	context, _ := newAuthTestContext(http.MethodGet, "/protected", "")
	context.Set(CurrentUserKey, "42")

	if got := CurrentUserID(context); got != 0 {
		t.Fatalf("CurrentUserID() = %d, want 0", got)
	}
}
