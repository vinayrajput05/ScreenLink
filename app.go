package main

import (
	"context"
	_ "embed"
	"fmt"
	"sync"
	"time"

	"lanmirror/internal/capture"
	"lanmirror/internal/clients"
	"lanmirror/internal/network"
	"lanmirror/internal/server"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed internal/server/viewer.html
var viewerHTML []byte

// DisplayInfo represents a detectable screen display
type DisplayInfo struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Resolution string `json:"resolution"`
	IsPrimary  bool   `json:"isPrimary"`
}

// SystemInfo represents local network interface info for the host
type SystemInfo struct {
	IPAddresses []string `json:"ipAddresses"`
	DefaultPort int      `json:"defaultPort"`
	Version     string   `json:"version"`
}

// ClientsPayload represents active clients for host UI
type ClientsPayload struct {
	Pending   []clients.ClientDTO `json:"pending"`
	Connected []clients.ClientDTO `json:"connected"`
}

// App struct
type App struct {
	ctx              context.Context
	server           *server.Server
	streamer         *capture.Streamer
	serverMu         sync.Mutex
	isServerActive   bool
	isScreenActive   bool
	isPaused         bool
	currentPort      int
	currentQuality   string
	currentDisplayID string
	messages         []server.ChatMessage
	msgMu            sync.Mutex
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		currentPort:      8080,
		currentQuality:   "30fps",
		currentDisplayID: "0",
		messages:         make([]server.ChatMessage, 0),
	}
}

// startup is called when the app starts.
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	// Auto-start background local server and screen capture streamer on launch for zero-delay instant sharing
	go func() {
		time.Sleep(150 * time.Millisecond)
		_, _ = a.StartSharing(a.currentPort)
	}()
}

func (a *App) ensureServerRunning(port int) (*server.Server, error) {
	a.serverMu.Lock()
	if a.server != nil && a.isServerActive {
		srv := a.server
		a.serverMu.Unlock()
		return srv, nil
	}

	if port <= 0 {
		port = 8080
	}
	a.currentPort = port

	srv := server.NewServer(port, viewerHTML, a)
	if err := srv.Start(); err != nil {
		a.serverMu.Unlock()
		return nil, fmt.Errorf("failed to start server on port %d: %w", port, err)
	}

	a.server = srv
	a.isServerActive = true
	a.serverMu.Unlock()

	if a.ctx != nil {
		runtime.EventsEmit(a.ctx, "server_state_changed", map[string]interface{}{
			"status":       "running",
			"port":         a.currentPort,
			"screenActive": a.isScreenActive,
			"isPaused":     a.isPaused,
		})
	}

	return srv, nil
}

// OnClientStateChanged implements server.ServerCallback
func (a *App) OnClientStateChanged() {
	if a.ctx != nil {
		go func() {
			runtime.EventsEmit(a.ctx, "clients_updated", a.GetClients())
		}()
	}
}

// GetSharingStatus returns current status of the server
func (a *App) GetSharingStatus() bool {
	a.serverMu.Lock()
	defer a.serverMu.Unlock()
	return a.isServerActive && a.isScreenActive
}

// IsScreenStreaming returns true if screen capture streamer is actively streaming
func (a *App) IsScreenStreaming() bool {
	a.serverMu.Lock()
	defer a.serverMu.Unlock()
	return a.isScreenActive
}

// IsScreenPaused returns true if screen capture is currently paused
func (a *App) IsScreenPaused() bool {
	a.serverMu.Lock()
	defer a.serverMu.Unlock()
	return a.isPaused
}

// GetDisplays returns all detectable connected monitors
func (a *App) GetDisplays() []DisplayInfo {
	displays := capture.GetAvailableDisplays()
	result := make([]DisplayInfo, len(displays))
	for i, d := range displays {
		result[i] = DisplayInfo{
			ID:         d.ID,
			Name:       d.Name,
			Resolution: d.Resolution,
			IsPrimary:  d.IsPrimary,
		}
	}
	return result
}

// SelectDisplay changes the active display for the streamer
func (a *App) SelectDisplay(displayID string) {
	a.serverMu.Lock()
	defer a.serverMu.Unlock()
	a.currentDisplayID = displayID

	if a.streamer != nil {
		displays := capture.GetAvailableDisplays()
		for i, d := range displays {
			if d.ID == displayID {
				a.streamer.SetDisplayIndex(i)
				break
			}
		}
	}
}

// GetQualityPresets returns streaming FPS and quality presets
func (a *App) GetQualityPresets() []capture.QualityPreset {
	return capture.GetAvailableQualityPresets()
}

// SetQualityPreset updates quality profile dynamically
func (a *App) SetQualityPreset(presetID string) {
	a.serverMu.Lock()
	defer a.serverMu.Unlock()
	a.currentQuality = presetID

	if a.streamer != nil {
		a.streamer.SetQualityPreset(presetID)
	}
}

// GetSystemInfo dynamically discovers real LAN IPv4 addresses from the machine (excludes localhost when LAN IP is available)
func (a *App) GetSystemInfo() SystemInfo {
	ips, err := network.GetLocalIPv4Addresses()
	if err != nil || len(ips) == 0 {
		ips = []string{"127.0.0.1"}
	}

	// Filter out loopback 127.0.0.1 if real LAN IPs are found
	if len(ips) > 1 {
		var lanIps []string
		for _, ip := range ips {
			if ip != "127.0.0.1" && ip != "localhost" {
				lanIps = append(lanIps, ip)
			}
		}
		if len(lanIps) > 0 {
			ips = lanIps
		}
	}

	port := a.currentPort
	if port <= 0 {
		port = 8080
	}

	return SystemInfo{
		IPAddresses: ips,
		DefaultPort: port,
		Version:     "1.0.0",
	}
}

// StartSharing starts/ensures local server and screen capture streamer
func (a *App) StartSharing(port int) (bool, error) {
	srv, err := a.ensureServerRunning(port)
	if err != nil {
		return false, err
	}

	a.serverMu.Lock()
	quality := a.currentQuality
	if a.streamer == nil {
		streamer := capture.NewStreamer(srv)
		streamer.SetQualityPreset(quality)
		displays := capture.GetAvailableDisplays()
		for i, d := range displays {
			if d.ID == a.currentDisplayID {
				streamer.SetDisplayIndex(i)
				break
			}
		}
		if err := streamer.Start(); err != nil {
			a.serverMu.Unlock()
			return false, fmt.Errorf("failed to start screen capture: %w", err)
		}
		a.streamer = streamer
	} else {
		a.streamer.SetBroadcaster(srv)
		a.streamer.Resume()
	}
	a.isScreenActive = true
	a.isPaused = false
	a.serverMu.Unlock()

	srv.BroadcastStreamState("active")

	if a.ctx != nil {
		runtime.EventsEmit(a.ctx, "server_state_changed", map[string]interface{}{
			"status":       "running",
			"port":         a.currentPort,
			"screenActive": true,
			"isPaused":     false,
		})
	}

	return true, nil
}

// PauseScreenShare pauses screen capture and broadcasts paused state to viewers
func (a *App) PauseScreenShare() {
	a.serverMu.Lock()
	streamer := a.streamer
	srv := a.server
	a.isPaused = true
	a.serverMu.Unlock()

	if streamer != nil {
		streamer.Pause()
	}
	if srv != nil {
		srv.BroadcastStreamState("paused")
	}

	if a.ctx != nil {
		runtime.EventsEmit(a.ctx, "server_state_changed", map[string]interface{}{
			"status":       "running",
			"port":         a.currentPort,
			"screenActive": true,
			"isPaused":     true,
		})
	}
}

// ResumeScreenShare resumes screen capture and broadcasts active state to viewers
func (a *App) ResumeScreenShare() {
	a.serverMu.Lock()
	streamer := a.streamer
	srv := a.server
	a.isPaused = false
	a.isScreenActive = true
	a.serverMu.Unlock()

	if streamer != nil {
		streamer.Resume()
	}
	if srv != nil {
		srv.BroadcastStreamState("active")
	}

	if a.ctx != nil {
		runtime.EventsEmit(a.ctx, "server_state_changed", map[string]interface{}{
			"status":       "running",
			"port":         a.currentPort,
			"screenActive": true,
			"isPaused":     false,
		})
	}
}

// StopSharing stops screen capture streaming while keeping the chat/code server running
func (a *App) StopSharing() error {
	a.serverMu.Lock()
	streamer := a.streamer
	srv := a.server
	a.streamer = nil
	a.isScreenActive = false
	a.isPaused = false
	a.serverMu.Unlock()

	if streamer != nil {
		streamer.Stop()
	}
	if srv != nil {
		srv.BroadcastStreamState("stopped")
	}

	if a.ctx != nil {
		runtime.EventsEmit(a.ctx, "server_state_changed", map[string]interface{}{
			"status":       "running",
			"port":         a.currentPort,
			"screenActive": false,
			"isPaused":     false,
		})
	}

	return nil
}

// ApproveClient approves a viewer request
func (a *App) ApproveClient(clientID string) {
	a.serverMu.Lock()
	srv := a.server
	a.serverMu.Unlock()

	if srv != nil {
		srv.ApproveClient(clientID)
	}
}

// RejectClient rejects a viewer request
func (a *App) RejectClient(clientID string) {
	a.serverMu.Lock()
	srv := a.server
	a.serverMu.Unlock()

	if srv != nil {
		srv.RejectClient(clientID)
	}
}

// ApproveAll approves all pending requests
func (a *App) ApproveAll() {
	a.serverMu.Lock()
	srv := a.server
	a.serverMu.Unlock()

	if srv != nil {
		srv.ApproveAll()
	}
}


// DisconnectClient disconnects an approved viewer
func (a *App) DisconnectClient(clientID string) {
	a.serverMu.Lock()
	srv := a.server
	a.serverMu.Unlock()

	if srv != nil {
		srv.DisconnectClient(clientID)
	}
}

// DisconnectAll disconnects all connected viewers
func (a *App) DisconnectAll() {
	a.serverMu.Lock()
	srv := a.server
	a.serverMu.Unlock()

	if srv != nil {
		srv.DisconnectAll()
	}
}

// SendChatMessage broadcasts a text message to all connected viewers (even without screen sharing)
func (a *App) SendChatMessage(message string) {
	srv, _ := a.ensureServerRunning(a.currentPort)

	msg := server.ChatMessage{
		ID:      fmt.Sprintf("msg-%d", time.Now().UnixNano()),
		Type:    "chat",
		Message: message,
		IsCode:  false,
		SentAt:  time.Now().Format("15:04:05"),
		Sender:  "Host",
	}

	if srv != nil {
		srv.BroadcastChatMessage(msg)
	}

	a.msgMu.Lock()
	a.messages = append([]server.ChatMessage{msg}, a.messages...)
	a.msgMu.Unlock()

	if a.ctx != nil {
		runtime.EventsEmit(a.ctx, "messages_updated", a.messages)
	}
}

// SendCodeSnippet broadcasts multi-line source code to all connected viewers (even without screen sharing)
func (a *App) SendCodeSnippet(title string, code string, language string) {
	srv, _ := a.ensureServerRunning(a.currentPort)

	if title == "" {
		title = "Code Snippet"
	}
	if language == "" {
		language = "text"
	}

	msg := server.ChatMessage{
		ID:       fmt.Sprintf("code-%d", time.Now().UnixNano()),
		Type:     "code",
		Title:    title,
		Message:  code,
		Language: language,
		IsCode:   true,
		SentAt:   time.Now().Format("15:04:05"),
		Sender:   "Host",
	}

	if srv != nil {
		srv.BroadcastChatMessage(msg)
	}

	a.msgMu.Lock()
	a.messages = append([]server.ChatMessage{msg}, a.messages...)
	a.msgMu.Unlock()

	if a.ctx != nil {
		runtime.EventsEmit(a.ctx, "messages_updated", a.messages)
	}
}

// SendAnnouncement broadcasts an announcement banner
func (a *App) SendAnnouncement(message string) {
	a.SendChatMessage(message)
}

// GetChatMessages returns the broadcasted chat and code messages
func (a *App) GetChatMessages() []server.ChatMessage {
	a.msgMu.Lock()
	defer a.msgMu.Unlock()
	res := make([]server.ChatMessage, len(a.messages))
	copy(res, a.messages)
	return res
}

// ClearChatHistory clears stored chat messages
func (a *App) ClearChatHistory() {
	a.msgMu.Lock()
	a.messages = make([]server.ChatMessage, 0)
	a.msgMu.Unlock()

	if a.ctx != nil {
		runtime.EventsEmit(a.ctx, "messages_updated", a.messages)
	}
}

// GetClients returns current pending and connected viewers
func (a *App) GetClients() ClientsPayload {
	a.serverMu.Lock()
	srv := a.server
	a.serverMu.Unlock()

	if srv == nil {
		return ClientsPayload{
			Pending:   make([]clients.ClientDTO, 0),
			Connected: make([]clients.ClientDTO, 0),
		}
	}

	return ClientsPayload{
		Pending:   srv.GetPendingClients(),
		Connected: srv.GetConnectedClients(),
	}
}
