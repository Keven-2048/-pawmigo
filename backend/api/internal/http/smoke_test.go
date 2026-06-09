package http_test

import (
	"net/http"
	"strconv"
	"testing"
	"time"
)

func TestP0RemoteSmokeFlow(t *testing.T) {
	router := newTestServer()
	token := login(t, router)

	status, response := requestJSON(t, router, http.MethodGet, "/api/v1/pets/my", token, nil)
	if status != http.StatusOK {
		t.Fatalf("my pets status=%d response=%+v", status, response)
	}
	pets := decodeData[[]struct {
		ID        int  `json:"id"`
		IsDefault bool `json:"isDefault"`
	}](t, response)
	if len(pets) == 0 || !pets[0].IsDefault {
		t.Fatalf("expected existing default pet, got %+v", pets)
	}

	status, response = requestJSON(t, router, http.MethodPost, "/api/v1/location/update", token, map[string]any{
		"latitude":  31.2304,
		"longitude": 121.4737,
		"city":      "上海",
		"district":  "徐汇区",
	})
	if status != http.StatusOK {
		t.Fatalf("location status=%d response=%+v", status, response)
	}

	status, response = requestJSON(t, router, http.MethodGet, "/api/v1/nearby/pets?type=dog&page=1&page_size=20", token, nil)
	if status != http.StatusOK {
		t.Fatalf("nearby status=%d response=%+v", status, response)
	}
	nearby := decodeData[struct {
		List []struct {
			ID        int    `json:"id"`
			CanInvite bool   `json:"canInvite"`
			Distance  string `json:"distanceText"`
		} `json:"list"`
	}](t, response)
	if len(nearby.List) == 0 || !nearby.List[0].CanInvite || nearby.List[0].Distance == "" {
		t.Fatalf("expected inviteable nearby pet, got %+v", nearby.List)
	}

	future := time.Now().Add(3 * time.Hour).Format(time.RFC3339)
	status, response = requestJSON(t, router, http.MethodPost, "/api/v1/invites", token, map[string]any{
		"fromPetId":    pets[0].ID,
		"toPetId":      nearby.List[0].ID,
		"type":         "walk",
		"title":        "一起散步",
		"description":  "今晚慢慢走一圈",
		"locationName": "社区花园",
		"meetTime":     future,
	})
	if status != http.StatusOK {
		t.Fatalf("invite status=%d response=%+v", status, response)
	}
	invite := decodeData[struct {
		ID     int    `json:"id"`
		Status string `json:"status"`
	}](t, response)
	if invite.Status != "pending" {
		t.Fatalf("invite status=%s", invite.Status)
	}

	status, response = requestJSON(t, router, http.MethodGet, "/api/v1/invites?box=sent&status=pending", token, nil)
	if status != http.StatusOK {
		t.Fatalf("sent invites status=%d response=%+v", status, response)
	}
	sent := decodeData[[]struct {
		ID int `json:"id"`
	}](t, response)
	if len(sent) == 0 || sent[0].ID != invite.ID {
		t.Fatalf("expected sent invite %d, got %+v", invite.ID, sent)
	}

	status, response = requestJSON(t, router, http.MethodPost, "/api/v1/posts", token, map[string]any{
		"petId":        pets[0].ID,
		"content":      "远程接口第一条动态",
		"images":       []string{},
		"locationName": "社区花园",
		"topicTags":    []string{"联调"},
		"visibility":   "public",
	})
	if status != http.StatusOK {
		t.Fatalf("create post status=%d response=%+v", status, response)
	}
	post := decodeData[struct {
		ID int `json:"id"`
	}](t, response)

	status, response = requestJSON(t, router, http.MethodPost, "/api/v1/posts/"+strconv.Itoa(post.ID)+"/like", token, nil)
	if status != http.StatusOK {
		t.Fatalf("like status=%d response=%+v", status, response)
	}

	status, response = requestJSON(t, router, http.MethodPost, "/api/v1/posts/"+strconv.Itoa(post.ID)+"/comments", token, map[string]any{
		"content": "远程评论",
	})
	if status != http.StatusOK {
		t.Fatalf("comment status=%d response=%+v", status, response)
	}

	status, response = requestJSON(t, router, http.MethodPost, "/api/v1/reports", token, map[string]any{
		"targetType":  "post",
		"targetId":    post.ID,
		"reason":      "广告营销",
		"description": "联调举报",
		"images":      []string{},
	})
	if status != http.StatusOK {
		t.Fatalf("report status=%d response=%+v", status, response)
	}

	status, response = requestJSON(t, router, http.MethodPost, "/api/v1/blocks", token, map[string]any{
		"blockedUserId": 2,
		"reason":        "联调拉黑",
	})
	if status != http.StatusOK {
		t.Fatalf("block status=%d response=%+v", status, response)
	}

	status, response = requestJSON(t, router, http.MethodPut, "/api/v1/user/privacy", token, map[string]any{
		"allowNearbyVisible":  true,
		"allowStrangerInvite": false,
		"allowComment":        true,
		"showOwnerName":       true,
		"showCity":            true,
		"notificationEnabled": true,
	})
	if status != http.StatusOK {
		t.Fatalf("privacy status=%d response=%+v", status, response)
	}
}
