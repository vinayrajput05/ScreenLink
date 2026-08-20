package main

import (
	"context"
	_ "embed"
	"fmt"
	"sync"

	"lanmirror/internal/capture"
	"lanmirror/internal/clients"
	"lanmirror/internal/network"
	"lanmirror/internal/server"
	"lanmirror/internal/youtube"

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
	ctx            context.Context
	server         *server.Server
	streamer       *capture.Streamer
	ytStreamer     *youtube.YouTubeStreamer
	serverMu       sync.Mutex
	isSharing      bool
	currentPort    int
	currentQuality string
	announcements  []AnnouncementRecord
	annMu          sync.Mutex
}

type AnnouncementRecord struct {
	ID      string `json:"id"`
	Message string `json:"message"`
	SentAt  string `json:"sentAt"`
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		currentPort:    8080,
		currentQuality: "fhd",
		ytStreamer:     youtube.NewYouTubeStreamer(),
	}
}

// startup is called when the app starts.
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// OnClientStateChanged implements server.ServerCallback
func (a *App) OnClientStateChanged() {
	if a.ctx != nil {
		go func() {
			runtime.EventsEmit(a.ctx, "clients_updated", a.GetClients())
		}()
	}
}

// GetSharingStatus returns true if screen sharing server is running
func (a *App) GetSharingStatus() bool {
	a.serverMu.Lock()
	defer a.serverMu.Unlock()
	return a.isSharing
}

// IsFFmpegInstalled checks whether FFmpeg is available on the machine
func (a *App) IsFFmpegInstalled() bool {
	return youtube.CheckFFmpegInstalled()
}

// StartYouTubeStream begins streaming screen frames to YouTube Live via RTMP
func (a *App) StartYouTubeStream(streamKey string, rtmpServer string) (bool, error) {
	a.serverMu.Lock()
	if a.ytStreamer == nil {
		a.ytStreamer = youtube.NewYouTubeStreamer()
	}

	fps := 20
	switch a.currentQuality {
	case "hd":
		fps = 24
	case "2k":
		fps = 18
	case "4k":
		fps = 15
	}

	// Ensure screen capture streamer is running
	if a.streamer == nil {
		// If local server is not running, we create a dummy broadcaster for streamer
		streamer := capture.NewStreamer(a.server)
		streamer.SetQualityPreset(a.currentQuality)
		streamer.SetYouTubeSink(a.ytStreamer)
		if err := streamer.Start(); err != nil {
			a.serverMu.Unlock()
			return false, fmt.Errorf("failed to start screen capture: %w", err)
		}
		a.streamer = streamer
	} else {
		a.streamer.SetYouTubeSink(a.ytStreamer)
	}
	a.serverMu.Unlock()

	err := a.ytStreamer.Start(streamKey, rtmpServer, fps)
	if err != nil {
		return false, err
	}

	if a.ctx != nil {
		runtime.EventsEmit(a.ctx, "youtube_status_changed", a.ytStreamer.GetStatus())
	}
	return true, nil
}

// StopYouTubeStream stops streaming to YouTube Live
func (a *App) StopYouTubeStream() error {
	a.serverMu.Lock()
	var err error
	if a.ytStreamer != nil {
		err = a.ytStreamer.Stop()
	}
	// If local server is also not sharing, stop screen capture streamer to save CPU
	if !a.isSharing && a.streamer != nil {
		a.streamer.Stop()
		a.streamer = nil
	}
	a.serverMu.Unlock()

	if a.ctx != nil && a.ytStreamer != nil {
		runtime.EventsEmit(a.ctx, "youtube_status_changed", a.ytStreamer.GetStatus())
	}
	return err
}

// GetYouTubeStreamStatus returns current YouTube live stream status
func (a *App) GetYouTubeStreamStatus() youtube.YouTubeStatusDTO {
	a.serverMu.Lock()
	defer a.serverMu.Unlock()
	if a.ytStreamer == nil {
		return youtube.YouTubeStatusDTO{
			Status:  youtube.StatusOffline,
			RtmpURL: "rtmp://a.rtmp.youtube.com/live2",
		}
	}
	return a.ytStreamer.GetStatus()
}

// GetQualityPresets returns stream resolution presets
func (a *App) GetQualityPresets() []capture.QualityPreset {
	return capture.GetAvailableQualityPresets()
}

// SetQualityPreset updates stream quality and resolution dynamically
func (a *App) SetQualityPreset(presetID string) {
	a.serverMu.Lock()
	a.currentQuality = presetID
	streamer := a.streamer
	a.serverMu.Unlock()

	if streamer != nil {
		streamer.SetQualityPreset(presetID)
	}
}

// GetDisplays returns the list of detected displays on host machine
func (a *App) GetDisplays() []DisplayInfo {
	displays := capture.GetAvailableDisplays()
	result := make([]DisplayInfo, 0)
	for _, d := range displays {
		result = append(result, DisplayInfo{
			ID:         d.ID,
			Name:       d.Name,
			Resolution: d.Resolution,
			IsPrimary:  d.IsPrimary,
		})
	}
	return result
}

// SelectDisplay changes the active display being captured
func (a *App) SelectDisplay(displayID string) {
	a.serverMu.Lock()
	streamer := a.streamer
	a.serverMu.Unlock()

	if streamer != nil {
		displays := capture.GetAvailableDisplays()
		for i, d := range displays {
			if d.ID == displayID {
				streamer.SetDisplayIndex(i)
				break
			}
		}
	}
}

// GetSystemInfo dynamically discovers real LAN IPv4 addresses from the machine
func (a *App) GetSystemInfo() SystemInfo {
	ips, err := network.GetLocalIPv4Addresses()
	if err != nil || len(ips) == 0 {
		ips = []string{"127.0.0.1"}
	}

	return SystemInfo{
		IPAddresses: ips,
		DefaultPort: 8080,
		Version:     "1.0.0",
	}
}

// StartSharing starts the local Go HTTP/WS server & screen capture streamer
func (a *App) StartSharing(port int) (bool, error) {
	a.serverMu.Lock()
	if a.isSharing {
		a.serverMu.Unlock()
		return true, nil
	}

	oldSrv := a.server
	oldStreamer := a.streamer
	a.server = nil
	a.streamer = nil
	quality := a.currentQuality
	yt := a.ytStreamer
	a.serverMu.Unlock()

	if oldStreamer != nil {
		oldStreamer.Stop()
	}
	if oldSrv != nil {
		_ = oldSrv.Stop()
	}

	if port <= 0 {
		port = 8080
	}
	a.currentPort = port

	srv := server.NewServer(port, viewerHTML, a)
	if err := srv.Start(); err != nil {
		return false, fmt.Errorf("failed to start sharing server on port %d: %w", port, err)
	}

	streamer := capture.NewStreamer(srv)
	streamer.SetQualityPreset(quality)
	if yt != nil {
		streamer.SetYouTubeSink(yt)
	}
	if err := streamer.Start(); err != nil {
		_ = srv.Stop()
		return false, fmt.Errorf("failed to start screen capture streamer: %w", err)
	}

	a.serverMu.Lock()
	a.server = srv
	a.streamer = streamer
	a.isSharing = true
	a.serverMu.Unlock()

	if a.ctx != nil {
		runtime.EventsEmit(a.ctx, "server_state_changed", map[string]interface{}{
			"status": "running",
			"port":   a.currentPort,
		})
	}

	return true, nil
}

// StopSharing stops the HTTP/WS server and screen capture streamer
func (a *App) StopSharing() error {
	a.serverMu.Lock()
	if !a.isSharing {
		a.serverMu.Unlock()
		return nil
	}

	srv := a.server
	streamer := a.streamer
	isYTStreaming := (a.ytStreamer != nil && a.ytStreamer.IsLive())
	a.server = nil
	if !isYTStreaming {
		a.streamer = nil
	}
	a.isSharing = false
	a.serverMu.Unlock()

	if !isYTStreaming && streamer != nil {
		streamer.Stop()
	}

	var err error
	if srv != nil {
		err = srv.Stop()
	}

	if a.ctx != nil {
		runtime.EventsEmit(a.ctx, "server_state_changed", map[string]interface{}{
			"status": "stopped",
		})
		runtime.EventsEmit(a.ctx, "clients_updated", ClientsPayload{
			Pending:   make([]clients.ClientDTO, 0),
			Connected: make([]clients.ClientDTO, 0),
		})
	}

	return err
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

// SendAnnouncement broadcasts a message to all connected viewers
func (a *App) SendAnnouncement(message string) {
	a.serverMu.Lock()
	srv := a.server
	a.serverMu.Unlock()

	if srv != nil {
		srv.BroadcastAnnouncement(message)
	}

	a.annMu.Lock()
	record := AnnouncementRecord{
		ID:      fmt.Sprintf("ann-%d", len(a.announcements)+1),
		Message: message,
		SentAt:  "Just now",
	}
	a.announcements = append([]AnnouncementRecord{record}, a.announcements...)
	a.annMu.Unlock()

	if a.ctx != nil {
		runtime.EventsEmit(a.ctx, "announcements_updated", a.announcements)
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
