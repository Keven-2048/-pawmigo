package response

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func testContext() (*gin.Context, *httptest.ResponseRecorder) {
	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	return context, recorder
}

func decodeBody(t *testing.T, recorder *httptest.ResponseRecorder) map[string]any {
	t.Helper()

	var body map[string]any
	if err := json.Unmarshal(recorder.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode response body: %v", err)
	}
	return body
}

func TestOK_WritesSuccessEnvelopeWithData(t *testing.T) {
	context, recorder := testContext()
	data := gin.H{"petId": float64(101), "name": "豆包"}

	OK(context, data)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}

	body := decodeBody(t, recorder)
	if body["code"] != float64(0) {
		t.Fatalf("code = %#v, want 0", body["code"])
	}
	if body["message"] != "ok" {
		t.Fatalf("message = %#v, want ok", body["message"])
	}

	gotData, ok := body["data"].(map[string]any)
	if !ok {
		t.Fatalf("data = %#v, want object", body["data"])
	}
	if gotData["petId"] != float64(101) || gotData["name"] != "豆包" {
		t.Fatalf("data = %#v, want pet payload", gotData)
	}
}

func TestOK_OmitsDataWhenNil(t *testing.T) {
	context, recorder := testContext()

	OK(context, nil)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}

	body := decodeBody(t, recorder)
	if body["code"] != float64(0) {
		t.Fatalf("code = %#v, want 0", body["code"])
	}
	if body["message"] != "ok" {
		t.Fatalf("message = %#v, want ok", body["message"])
	}
	if _, exists := body["data"]; exists {
		t.Fatalf("data field exists in %#v, want omitted", body)
	}
}

func TestError_WritesErrorEnvelopeWithoutData(t *testing.T) {
	context, recorder := testContext()

	Error(context, http.StatusUnauthorized, "用户未登录")

	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusUnauthorized)
	}

	body := decodeBody(t, recorder)
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
