package clients

import (
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type ClientState int

const (
	ClientPending ClientState = iota
	ClientApproved
	ClientRejected
	ClientConnected
	ClientDisconnected
)

func (s ClientState) String() string {
	switch s {
	case ClientPending:
		return "pending"
	case ClientApproved:
		return "approved"
	case ClientRejected:
		return "rejected"
	case ClientConnected:
		return "connected"
	case ClientDisconnected:
		return "disconnected"
	default:
		return "unknown"
	}
}

// Client represents a connected browser viewer session
type Client struct {
	ID          string          `json:"id"`
	DisplayName string          `json:"displayName"`
	IP          string          `json:"ip"`
	Browser     string          `json:"browser"`
	State       ClientState     `json:"state"`
	RequestedAt time.Time       `json:"requestedAt"`
	ConnectedAt time.Time       `json:"connectedAt"`
	Conn        *websocket.Conn `json:"-"`
	mu          sync.Mutex
}

// ClientDTO is a clean JSON representation for host UI
type ClientDTO struct {
	ID              string `json:"id"`
	DisplayName     string `json:"displayName"`
	IP              string `json:"ip"`
	Browser         string `json:"browser"`
	State           string `json:"state"`
	RequestedAt     string `json:"requestedAt"`
	ConnectedAt     string `json:"connectedAt"`
	DurationMinutes int    `json:"durationMinutes"`
}

func (c *Client) ToDTO() ClientDTO {
	c.mu.Lock()
	defer c.mu.Unlock()

	duration := 0
	if !c.ConnectedAt.IsZero() && c.State == ClientApproved {
		duration = int(time.Since(c.ConnectedAt).Minutes())
	}

	requestedStr := "Just now"
	if !c.RequestedAt.IsZero() {
		requestedStr = c.RequestedAt.Format("15:04:05")
	}

	connectedStr := ""
	if !c.ConnectedAt.IsZero() {
		connectedStr = c.ConnectedAt.Format("15:04:05")
	}

	return ClientDTO{
		ID:              c.ID,
		DisplayName:     c.DisplayName,
		IP:              c.IP,
		Browser:         c.Browser,
		State:           c.State.String(),
		RequestedAt:     requestedStr,
		ConnectedAt:     connectedStr,
		DurationMinutes: duration,
	}
}

func (c *Client) SafeSend(messageType int, data []byte) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.Conn == nil {
		return nil
	}
	_ = c.Conn.SetWriteDeadline(time.Now().Add(2 * time.Second))
	return c.Conn.WriteMessage(messageType, data)
}
