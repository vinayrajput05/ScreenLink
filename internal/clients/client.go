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
	ID                 string          `json:"id"`
	DisplayName        string          `json:"displayName"`
	IP                 string          `json:"ip"`
	Browser            string          `json:"browser"`
	State              ClientState     `json:"state"`
	RequestedAt        time.Time       `json:"requestedAt"`
	ConnectedAt        time.Time       `json:"connectedAt"`
	Conn               *websocket.Conn `json:"-"`
	bytesSentWindow    int64
	lastBandwidthReset time.Time
	bandwidthKBps      int
	latencyMs          int
	mu                 sync.Mutex
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
	BandwidthKBps   int    `json:"bandwidthKbps"`
	LatencyMs       int    `json:"latencyMs"`
	SignalBars      int    `json:"signalBars"`
}

func (c *Client) RecordBytesSent(n int) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.bytesSentWindow += int64(n)
	now := time.Now()
	if c.lastBandwidthReset.IsZero() {
		c.lastBandwidthReset = now
		return
	}

	elapsed := now.Sub(c.lastBandwidthReset)
	if elapsed >= time.Second {
		kbps := int(float64(c.bytesSentWindow) / 1024.0 / elapsed.Seconds())
		c.bandwidthKBps = kbps
		c.bytesSentWindow = 0
		c.lastBandwidthReset = now
	}
}

func (c *Client) UpdateLatency(ms int) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if ms < 0 {
		ms = 0
	}
	c.latencyMs = ms
}

func (c *Client) calculateSignalBars() int {
	// If freshly connected and no latency measured yet, show strong connection
	if c.latencyMs == 0 && c.bandwidthKBps == 0 {
		return 4
	}
	if c.latencyMs > 0 && c.latencyMs <= 35 && c.bandwidthKBps >= 500 {
		return 4
	}
	if c.latencyMs <= 70 || c.bandwidthKBps >= 300 {
		return 3
	}
	if c.latencyMs <= 150 || c.bandwidthKBps >= 100 {
		return 2
	}
	return 1
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

	// Update bandwidth calculation if idle
	now := time.Now()
	if !c.lastBandwidthReset.IsZero() && now.Sub(c.lastBandwidthReset) > 2*time.Second {
		c.bandwidthKBps = 0
		c.bytesSentWindow = 0
		c.lastBandwidthReset = now
	}

	signalBars := c.calculateSignalBars()

	return ClientDTO{
		ID:              c.ID,
		DisplayName:     c.DisplayName,
		IP:              c.IP,
		Browser:         c.Browser,
		State:           c.State.String(),
		RequestedAt:     requestedStr,
		ConnectedAt:     connectedStr,
		DurationMinutes: duration,
		BandwidthKBps:   c.bandwidthKBps,
		LatencyMs:       c.latencyMs,
		SignalBars:      signalBars,
	}
}

func (c *Client) SafeSend(messageType int, data []byte) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.Conn == nil {
		return nil
	}
	// Binary frames (video) get a shorter deadline to avoid blocking the encoder
	// Text frames (chat, control) get more time to handle high-latency Wi-Fi
	deadline := 8 * time.Second
	if messageType == 2 { // BinaryMessage
		deadline = 4 * time.Second
	}
	_ = c.Conn.SetWriteDeadline(time.Now().Add(deadline))
	err := c.Conn.WriteMessage(messageType, data)
	if err == nil {
		c.bytesSentWindow += int64(len(data))
		now := time.Now()
		if c.lastBandwidthReset.IsZero() {
			c.lastBandwidthReset = now
		} else {
			elapsed := now.Sub(c.lastBandwidthReset)
			if elapsed >= time.Second {
				c.bandwidthKBps = int(float64(c.bytesSentWindow) / 1024.0 / elapsed.Seconds())
				c.bytesSentWindow = 0
				c.lastBandwidthReset = now
			}
		}
	}
	return err
}
