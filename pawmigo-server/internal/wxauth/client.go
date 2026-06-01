package wxauth

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
)

// Session 是 code2session 的结果。
type Session struct {
	OpenID     string `json:"openid"`
	SessionKey string `json:"session_key"`
	ErrCode    int    `json:"errcode"`
	ErrMsg     string `json:"errmsg"`
}

// Client 抽象微信登录，便于在 service 测试中替换为 fake。
type Client interface {
	Code2Session(code string) (*Session, error)
}

type HTTPClient struct {
	AppID  string
	Secret string
}

func NewHTTPClient(appID, secret string) *HTTPClient {
	return &HTTPClient{AppID: appID, Secret: secret}
}

func (c *HTTPClient) Code2Session(code string) (*Session, error) {
	u := fmt.Sprintf(
		"https://api.weixin.qq.com/sns/jscode2session?appid=%s&secret=%s&js_code=%s&grant_type=authorization_code",
		url.QueryEscape(c.AppID), url.QueryEscape(c.Secret), url.QueryEscape(code),
	)
	resp, err := http.Get(u)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var s Session
	if err := json.NewDecoder(resp.Body).Decode(&s); err != nil {
		return nil, err
	}
	if s.ErrCode != 0 {
		return nil, errors.New("wx code2session: " + s.ErrMsg)
	}
	if s.OpenID == "" {
		return nil, errors.New("wx code2session: empty openid")
	}
	return &s, nil
}
