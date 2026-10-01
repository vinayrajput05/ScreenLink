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
	frameChan          chan []byte
	stopChan           chan struct{}
	writePumpRunning   bool
	writeMu            sync.Mutex
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

func (c *Client) StartWritePump(onDisconnect func()) {
	c.mu.Lock()
	if c.writePumpRunning {
		c.mu.Unlock()
		return
	}
	c.frameChan = make(chan []byte, 1)
	c.stopChan = make(chan struct{})
	c.writePumpRunning = true
	fChan := c.frameChan
	sChan := c.stopChan
	c.mu.Unlock()

	go func() {
		defer func() {
			_ = recover()
			c.mu.Lock()
			c.writePumpRunning = false
			c.mu.Unlock()
			if onDisconnect != nil {
				onDisconnect()
			}
		}()

		for {
			select {
			case <-sChan:
				return
			case frame, ok := <-fChan:
				if !ok {
					return
				}
				c.mu.Lock()
				conn := c.Conn
				c.mu.Unlock()
				if conn == nil {
					return
				}

				// 2s write deadline is ideal for real-time 1080p frames over Wi-Fi/LAN
				_ = conn.SetWriteDeadline(time.Now().Add(2 * time.Second))
				c.writeMu.Lock()
				err := conn.WriteMessage(websocket.BinaryMessage, frame)
				c.writeMu.Unlock()
				if err != nil {
					// Once a websocket write encounters an error, connection framing is broken.
					// Exit write pump immediately to close the socket and allow prompt reconnection.
					return
				}
				c.RecordBytesSent(len(frame))
			}
		}
	}()
}

func (c *Client) StopWritePump() {
	c.mu.Lock()
	if !c.writePumpRunning {
		c.mu.Unlock()
		return
	}
	c.writePumpRunning = false
	if c.stopChan != nil {
		select {
		case <-c.stopChan:
		default:
			close(c.stopChan)
		}
	}
	c.mu.Unlock()
}

// TrySendFrame queues a video frame for delivery without blocking the caller.
// If the client's write pump is currently busy writing a previous frame, the frame
// is dropped for this client only to ensure 0 latency and prevent server freezes.
func (c *Client) TrySendFrame(data []byte) bool {
	c.mu.Lock()
	if !c.writePumpRunning || c.frameChan == nil {
		c.mu.Unlock()
		return false
	}
	fChan := c.frameChan
	c.mu.Unlock()

	select {
	case fChan <- data:
		return true
	default:
		// Client is falling behind; drop frame locally
		return false
	}
}

func (c *Client) SafeSend(messageType int, data []byte) error {
	c.mu.Lock()
	conn := c.Conn
	c.mu.Unlock()
	if conn == nil {
		return nil
	}

	deadline := 5 * time.Second
	if messageType == websocket.BinaryMessage {
		deadline = 600 * time.Millisecond
	}

	c.writeMu.Lock()
	defer c.writeMu.Unlock()

	_ = conn.SetWriteDeadline(time.Now().Add(deadline))
	err := conn.WriteMessage(messageType, data)
	if err == nil {
		c.RecordBytesSent(len(data))
	}
	return err
}
