package server

import (
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"lanmirror/internal/clients"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all local LAN origins
	},
	ReadBufferSize:  8192,
	WriteBufferSize: 131072, // Support long source code snippets
}

type ServerCallback interface {
	OnClientStateChanged()
}

type ChatMessage struct {
	ID       string `json:"id"`
	Type     string `json:"type"` // "chat" | "code" | "announcement"
	Title    string `json:"title,omitempty"`
	Message  string `json:"message"`
	Language string `json:"language,omitempty"`
	IsCode   bool   `json:"isCode"`
	SentAt   string `json:"sentAt"`
	Sender   string `json:"sender"`
}

type Server struct {
	port        int
	listener    net.Listener
	httpServer  *http.Server
	clients     map[string]*clients.Client
	clientsMu   sync.RWMutex
	callback    ServerCallback
	isRunning   bool
	viewerHTML  []byte
	stopChan    chan struct{}
	chatHistory []ChatMessage
	chatMu      sync.RWMutex
	streamState string
	stateMu     sync.RWMutex
}

type WsMessage struct {
	Type        string        `json:"type"`
	ClientID    string        `json:"client_id,omitempty"`
	DisplayName string        `json:"display_name,omitempty"`
	Message     string        `json:"message,omitempty"`
	Title       string        `json:"title,omitempty"`
	Language    string        `json:"language,omitempty"`
	IsCode      bool          `json:"isCode,omitempty"`
	State       string        `json:"state,omitempty"`
	SentAt      string        `json:"sent_at,omitempty"`
	History     []ChatMessage `json:"history,omitempty"`
	ChatPayload *ChatMessage  `json:"chatPayload,omitempty"`
}

func NewServer(port int, viewerHTML []byte, cb ServerCallback) *Server {
	return &Server{
		port:        port,
		clients:     make(map[string]*clients.Client),
		callback:    cb,
		viewerHTML:  viewerHTML,
		stopChan:    make(chan struct{}),
		chatHistory: make([]ChatMessage, 0),
		streamState: "stopped",
	}
}

func (s *Server) Start() error {
	s.clientsMu.Lock()
	if s.isRunning {
		s.clientsMu.Unlock()
		return nil
	}
	s.clientsMu.Unlock()

	mux := http.NewServeMux()
	mux.HandleFunc("/", s.handleRoot)
	mux.HandleFunc("/health", s.handleHealth)
	mux.HandleFunc("/ws", s.handleWebSocket)

	addr := fmt.Sprintf(":%d", s.port)
	listener, err := net.Listen("tcp", addr)
	if err != nil {
		return fmt.Errorf("port %d in use: %w", s.port, err)
	}

	s.listener = listener
	s.httpServer = &http.Server{
		Handler:      mux,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	s.clientsMu.Lock()
	s.isRunning = true
	s.stopChan = make(chan struct{})
	s.clientsMu.Unlock()

	go func() {
		if err := s.httpServer.Serve(listener); err != nil && err != http.ErrServerClosed {
			fmt.Printf("HTTP server error: %v\n", err)
		}
	}()

	// Start periodic ping loop to keep mobile connections alive
	go s.heartbeatLoop()

	return nil
}

func (s *Server) heartbeatLoop() {
	ticker := time.NewTicker(4 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-s.stopChan:
			return
		case <-ticker.C:
			s.clientsMu.RLock()
			for _, client := range s.clients {
				_ = client.SafeSend(websocket.PingMessage, []byte{})
			}
			s.clientsMu.RUnlock()
		}
	}
}

func (s *Server) Stop() error {
	s.clientsMu.Lock()
	if !s.isRunning {
		s.clientsMu.Unlock()
		return nil
	}
	s.isRunning = false
	close(s.stopChan)

	// Disconnect all clients with reason
	for _, c := range s.clients {
		stopMsg, _ := json.Marshal(WsMessage{
			Type:  "status",
			State: "server_stopped",
		})
		_ = c.SafeSend(websocket.TextMessage, stopMsg)
		if c.Conn != nil {
			_ = c.Conn.Close()
		}
	}
	s.clients = make(map[string]*clients.Client)
	s.clientsMu.Unlock()

	if s.httpServer != nil {
		_ = s.httpServer.Close()
	}
	if s.listener != nil {
		_ = s.listener.Close()
	}

	if s.callback != nil {
		go s.callback.OnClientStateChanged()
	}

	return nil
}

func (s *Server) handleRoot(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")

	// Check if local viewer.html file exists on disk for immediate live edits
	if data, err := os.ReadFile("internal/server/viewer.html"); err == nil && len(data) > 0 {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(data)
		return
	}

	if len(s.viewerHTML) > 0 {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(s.viewerHTML)
	} else {
		http.Error(w, "Viewer not found", http.StatusNotFound)
	}
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "ok",
		"sharing": s.isRunning,
		"port":    s.port,
	})
}

func (s *Server) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Printf("WS upgrade error: %v\n", err)
		return
	}

	remoteIP := r.RemoteAddr
	if host, _, err := net.SplitHostPort(remoteIP); err == nil {
		remoteIP = host
	}

	userAgent := r.UserAgent()
	browser := simplifyUserAgent(userAgent)

	conn.SetReadLimit(524288) // 512 KB limit for code snippets
	_ = conn.SetReadDeadline(time.Now().Add(20 * time.Second))
	conn.SetPongHandler(func(string) error {
		_ = conn.SetReadDeadline(time.Now().Add(20 * time.Second))
		return nil
	})

	var currentClientID string

	defer func() {
		_ = conn.Close()
		if currentClientID != "" {
			s.clientsMu.Lock()
			delete(s.clients, currentClientID)
			s.clientsMu.Unlock()
			if s.callback != nil {
				go s.callback.OnClientStateChanged()
			}
		}
	}()

	for {
		_, msgBytes, err := conn.ReadMessage()
		if err != nil {
			break
		}
		_ = conn.SetReadDeadline(time.Now().Add(20 * time.Second))

		var msg WsMessage
		if err := json.Unmarshal(msgBytes, &msg); err != nil {
			continue
		}

		switch msg.Type {
		case "connection_request":
			if msg.ClientID == "" {
				continue
			}
			currentClientID = msg.ClientID

			s.clientsMu.Lock()
			client, exists := s.clients[msg.ClientID]
			if !exists {
				displayName := strings.TrimSpace(msg.DisplayName)
				if displayName == "" {
					displayName = "Anonymous Viewer"
				}
				client = &clients.Client{
					ID:          msg.ClientID,
					DisplayName: displayName,
					IP:          remoteIP,
					Browser:     browser,
					State:       clients.ClientPending,
					RequestedAt: time.Now(),
					Conn:        conn,
				}
				s.clients[msg.ClientID] = client
			} else {
				client.Conn = conn
				if strings.TrimSpace(msg.DisplayName) != "" {
					client.DisplayName = strings.TrimSpace(msg.DisplayName)
				}
			}
			currentState := client.State
			s.clientsMu.Unlock()

			// Send back current state
			resp, _ := json.Marshal(WsMessage{
				Type:  "status",
				State: currentState.String(),
			})
			_ = conn.WriteMessage(websocket.TextMessage, resp)

			// If approved, send chat history and current stream state
			if currentState == clients.ClientApproved {
				s.sendChatHistoryTo(client)
				s.stateMu.RLock()
				curStreamState := s.streamState
				s.stateMu.RUnlock()
				streamStateMsg, _ := json.Marshal(WsMessage{
					Type:  "stream_state",
					State: curStreamState,
				})
				_ = client.SafeSend(websocket.TextMessage, streamStateMsg)
			}

			if s.callback != nil {
				go s.callback.OnClientStateChanged()
			}

		case "cancel_request":
			if currentClientID != "" {
				s.clientsMu.Lock()
				delete(s.clients, currentClientID)
				s.clientsMu.Unlock()
				if s.callback != nil {
					go s.callback.OnClientStateChanged()
				}
				return
			}
		}
	}
}

func (s *Server) sendChatHistoryTo(c *clients.Client) {
	s.chatMu.RLock()
	history := make([]ChatMessage, len(s.chatHistory))
	copy(history, s.chatHistory)
	s.chatMu.RUnlock()

	if len(history) > 0 {
		payload, _ := json.Marshal(WsMessage{
			Type:    "chat_history",
			History: history,
		})
		_ = c.SafeSend(websocket.TextMessage, payload)
	}
}

// BroadcastStreamState notifies all viewers about pause / resume / stop
func (s *Server) BroadcastStreamState(state string) {
	if s == nil {
		return
	}

	s.stateMu.Lock()
	s.streamState = state
	s.stateMu.Unlock()

	payload, _ := json.Marshal(WsMessage{
		Type:  "stream_state",
		State: state,
	})

	s.clientsMu.RLock()
	defer s.clientsMu.RUnlock()

	for _, client := range s.clients {
		if client.State == clients.ClientApproved {
			_ = client.SafeSend(websocket.TextMessage, payload)
		}
	}
}

// BroadcastFrame implements FrameBroadcaster
func (s *Server) BroadcastFrame(frameData []byte) {
	if s == nil {
		return
	}
	s.clientsMu.RLock()
	defer s.clientsMu.RUnlock()

	for _, client := range s.clients {
		if client.State == clients.ClientApproved {
			_ = client.SafeSend(websocket.BinaryMessage, frameData)
		}
	}
}

// HasApprovedViewers implements FrameBroadcaster
func (s *Server) HasApprovedViewers() bool {
	if s == nil {
		return false
	}
	s.clientsMu.RLock()
	defer s.clientsMu.RUnlock()

	for _, client := range s.clients {
		if client.State == clients.ClientApproved {
			return true
		}
	}
	return false
}

func (s *Server) ApproveClient(clientID string) {
	if s == nil {
		return
	}
	s.clientsMu.Lock()
	client, exists := s.clients[clientID]
	if exists {
		client.State = clients.ClientApproved
		client.ConnectedAt = time.Now()
		resp, _ := json.Marshal(WsMessage{
			Type:  "status",
			State: "approved",
		})
		_ = client.SafeSend(websocket.TextMessage, resp)
		go s.sendChatHistoryTo(client)

		s.stateMu.RLock()
		curStreamState := s.streamState
		s.stateMu.RUnlock()
		streamStateMsg, _ := json.Marshal(WsMessage{
			Type:  "stream_state",
			State: curStreamState,
		})
		_ = client.SafeSend(websocket.TextMessage, streamStateMsg)
	}
	s.clientsMu.Unlock()

	if s.callback != nil {
		go s.callback.OnClientStateChanged()
	}
}

func (s *Server) RejectClient(clientID string) {
	if s == nil {
		return
	}
	s.clientsMu.Lock()
	client, exists := s.clients[clientID]
	if exists {
		client.State = clients.ClientRejected
		resp, _ := json.Marshal(WsMessage{
			Type:  "status",
			State: "rejected",
		})
		_ = client.SafeSend(websocket.TextMessage, resp)
		if client.Conn != nil {
			_ = client.Conn.Close()
		}
		delete(s.clients, clientID)
	}
	s.clientsMu.Unlock()

	if s.callback != nil {
		go s.callback.OnClientStateChanged()
	}
}

func (s *Server) ApproveAll() {
	if s == nil {
		return
	}
	s.clientsMu.Lock()
	for _, client := range s.clients {
		if client.State == clients.ClientPending {
			client.State = clients.ClientApproved
			client.ConnectedAt = time.Now()
			resp, _ := json.Marshal(WsMessage{
				Type:  "status",
				State: "approved",
			})
			_ = client.SafeSend(websocket.TextMessage, resp)
			go s.sendChatHistoryTo(client)
		}
	}
	s.clientsMu.Unlock()

	if s.callback != nil {
		go s.callback.OnClientStateChanged()
	}
}

func (s *Server) DisconnectClient(clientID string) {
	if s == nil {
		return
	}
	s.clientsMu.Lock()
	client, exists := s.clients[clientID]
	if exists {
		client.State = clients.ClientDisconnected
		resp, _ := json.Marshal(WsMessage{
			Type:  "status",
			State: "disconnected",
		})
		_ = client.SafeSend(websocket.TextMessage, resp)
		if client.Conn != nil {
			_ = client.Conn.Close()
		}
		delete(s.clients, clientID)
	}
	s.clientsMu.Unlock()

	if s.callback != nil {
		go s.callback.OnClientStateChanged()
	}
}

func (s *Server) DisconnectAll() {
	if s == nil {
		return
	}
	s.clientsMu.Lock()
	for id, client := range s.clients {
		if client.State == clients.ClientApproved {
			client.State = clients.ClientDisconnected
			resp, _ := json.Marshal(WsMessage{
				Type:  "status",
				State: "disconnected",
			})
			_ = client.SafeSend(websocket.TextMessage, resp)
			if client.Conn != nil {
				_ = client.Conn.Close()
			}
			delete(s.clients, id)
		}
	}
	s.clientsMu.Unlock()

	if s.callback != nil {
		go s.callback.OnClientStateChanged()
	}
}

// BroadcastChatMessage broadcasts rich messages/source code to all viewers
func (s *Server) BroadcastChatMessage(msg ChatMessage) {
	if s == nil {
		return
	}

	s.chatMu.Lock()
	s.chatHistory = append([]ChatMessage{msg}, s.chatHistory...)
	s.chatMu.Unlock()

	msgType := "chat_message"
	if msg.Type == "announcement" {
		msgType = "announcement"
	}

	payload, _ := json.Marshal(WsMessage{
		Type:        msgType,
		Message:     msg.Message,
		Title:       msg.Title,
		Language:    msg.Language,
		IsCode:      msg.IsCode,
		SentAt:      msg.SentAt,
		ChatPayload: &msg,
	})

	s.clientsMu.RLock()
	defer s.clientsMu.RUnlock()

	for _, client := range s.clients {
		if client.State == clients.ClientApproved {
			_ = client.SafeSend(websocket.TextMessage, payload)
		}
	}
}

func (s *Server) BroadcastAnnouncement(message string) {
	s.BroadcastChatMessage(ChatMessage{
		ID:      fmt.Sprintf("msg-%d", time.Now().UnixNano()),
		Type:    "announcement",
		Message: message,
		IsCode:  false,
		SentAt:  time.Now().Format("15:04:05"),
		Sender:  "Host",
	})
}

func (s *Server) GetChatHistory() []ChatMessage {
	if s == nil {
		return make([]ChatMessage, 0)
	}
	s.chatMu.RLock()
	defer s.chatMu.RUnlock()

	res := make([]ChatMessage, len(s.chatHistory))
	copy(res, s.chatHistory)
	return res
}

func (s *Server) GetPendingClients() []clients.ClientDTO {
	if s == nil {
		return make([]clients.ClientDTO, 0)
	}
	s.clientsMu.RLock()
	defer s.clientsMu.RUnlock()

	result := make([]clients.ClientDTO, 0)
	for _, c := range s.clients {
		if c.State == clients.ClientPending {
			result = append(result, c.ToDTO())
		}
	}
	return result
}

func (s *Server) GetConnectedClients() []clients.ClientDTO {
	if s == nil {
		return make([]clients.ClientDTO, 0)
	}
	s.clientsMu.RLock()
	defer s.clientsMu.RUnlock()

	result := make([]clients.ClientDTO, 0)
	for _, c := range s.clients {
		if c.State == clients.ClientApproved {
			result = append(result, c.ToDTO())
		}
	}
	return result
}

func simplifyUserAgent(ua string) string {
	if strings.Contains(ua, "iPhone") {
		return "iPhone (Safari)"
	}
	if strings.Contains(ua, "iPad") {
		return "iPad (Safari)"
	}
	if strings.Contains(ua, "Android") {
		return "Android Device"
	}
	if strings.Contains(ua, "Edg/") {
		return "Edge"
	}
	if strings.Contains(ua, "Chrome/") {
		return "Chrome"
	}
	if strings.Contains(ua, "Firefox/") {
		return "Firefox"
	}
	if strings.Contains(ua, "Safari/") {
		return "Safari"
	}
	return "Web Browser"
}
