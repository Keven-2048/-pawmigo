package wechat

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

const defaultBaseURL = "https://api.weixin.qq.com"

type Code2SessionResult struct {
	OpenID     string
	UnionID    string
	SessionKey string
}

type Client interface {
	Code2Session(ctx context.Context, code string) (Code2SessionResult, error)
}

type HTTPClient struct {
	AppID   string
	Secret  string
	BaseURL string
	HTTP    *http.Client
}

func NewClientFromEnv() (Client, bool) {
	appID := strings.TrimSpace(os.Getenv("WECHAT_APP_ID"))
	secret := strings.TrimSpace(os.Getenv("WECHAT_APP_SECRET"))
	if appID == "" || secret == "" {
		return nil, false
	}
	return &HTTPClient{
		AppID:  appID,
		Secret: secret,
		HTTP:   &http.Client{Timeout: 5 * time.Second},
	}, true
}

func (c *HTTPClient) Code2Session(ctx context.Context, code string) (Code2SessionResult, error) {
	if strings.TrimSpace(code) == "" {
		return Code2SessionResult{}, errors.New("wechat code is empty")
	}
	baseURL := strings.TrimRight(c.BaseURL, "/")
	if baseURL == "" {
		baseURL = defaultBaseURL
	}
	httpClient := c.HTTP
	if httpClient == nil {
		httpClient = &http.Client{Timeout: 5 * time.Second}
	}

	endpoint, err := url.Parse(baseURL + "/sns/jscode2session")
	if err != nil {
		return Code2SessionResult{}, err
	}
	query := endpoint.Query()
	query.Set("appid", c.AppID)
	query.Set("secret", c.Secret)
	query.Set("js_code", code)
	query.Set("grant_type", "authorization_code")
	endpoint.RawQuery = query.Encode()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint.String(), nil)
	if err != nil {
		return Code2SessionResult{}, err
	}
	resp, err := httpClient.Do(req)
	if err != nil {
		return Code2SessionResult{}, err
	}
	defer resp.Body.Close()

	var payload struct {
		OpenID     string `json:"openid"`
		UnionID    string `json:"unionid"`
		SessionKey string `json:"session_key"`
		ErrCode    int    `json:"errcode"`
		ErrMsg     string `json:"errmsg"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return Code2SessionResult{}, err
	}
	if payload.ErrCode != 0 {
		return Code2SessionResult{}, fmt.Errorf("wechat code2session failed: errcode=%d errmsg=%s", payload.ErrCode, payload.ErrMsg)
	}
	if strings.TrimSpace(payload.OpenID) == "" {
		return Code2SessionResult{}, errors.New("wechat code2session failed: openid is empty")
	}
	return Code2SessionResult{
		OpenID:     payload.OpenID,
		UnionID:    payload.UnionID,
		SessionKey: payload.SessionKey,
	}, nil
}
