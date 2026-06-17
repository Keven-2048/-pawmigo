package wechat

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

type handlerTransport struct {
	handler http.Handler
}

func (t handlerTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	rec := httptest.NewRecorder()
	t.handler.ServeHTTP(rec, httptest.NewRequest(req.Method, req.URL.String(), nil))
	resp := rec.Result()
	resp.Request = req
	return resp, nil
}

func TestCode2SessionSuccess(t *testing.T) {
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/sns/jscode2session" {
			t.Fatalf("unexpected path %s", r.URL.Path)
		}
		if r.URL.Query().Get("appid") != "app" || r.URL.Query().Get("secret") != "secret" || r.URL.Query().Get("js_code") != "code" {
			t.Fatalf("unexpected query %s", r.URL.RawQuery)
		}
		_, _ = w.Write([]byte(`{"openid":"o_test","unionid":"u_test","session_key":"s_test"}`))
	})

	client := &HTTPClient{
		AppID:   "app",
		Secret:  "secret",
		BaseURL: "https://wechat.test",
		HTTP:    &http.Client{Transport: handlerTransport{handler: handler}},
	}
	result, err := client.Code2Session(context.Background(), "code")
	if err != nil {
		t.Fatalf("Code2Session error: %v", err)
	}
	if result.OpenID != "o_test" || result.UnionID != "u_test" || result.SessionKey != "s_test" {
		t.Fatalf("unexpected result %+v", result)
	}
}

func TestCode2SessionWechatError(t *testing.T) {
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = io.Copy(io.Discard, r.Body)
		_, _ = w.Write([]byte(`{"errcode":40029,"errmsg":"invalid code"}`))
	})

	client := &HTTPClient{
		AppID:   "app",
		Secret:  "secret",
		BaseURL: "https://wechat.test",
		HTTP:    &http.Client{Transport: handlerTransport{handler: handler}},
	}
	_, err := client.Code2Session(context.Background(), "bad-code")
	if err == nil {
		t.Fatal("expected Code2Session error")
	}
	if !strings.Contains(err.Error(), "errcode=40029") || !strings.Contains(err.Error(), "invalid code") {
		t.Fatalf("expected explicit wechat error, got %v", err)
	}
}
