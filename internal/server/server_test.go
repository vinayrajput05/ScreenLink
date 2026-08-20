package server

import (
	"encoding/json"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"
)

type mockCallback struct {
	called bool
}

func (m *mockCallback) OnClientStateChanged() {
	m.called = true
}

func TestServerHealthAndViewerServing(t *testing.T) {
	dummyHTML := []byte("<!DOCTYPE html><html><body>LANMirror Viewer</body></html>")
	cb := &mockCallback{}
	srv := NewServer(8089, dummyHTML, cb)

	err := srv.Start()
	if err != nil {
		t.Fatalf("Failed to start server: %v", err)
	}
	defer srv.Stop()

	// Wait for server to listen
	time.Sleep(100 * time.Millisecond)

	// Test GET /
	resp, err := http.Get("http://127.0.0.1:8089/")
	if err != nil {
		t.Fatalf("GET / error: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Errorf("Expected status 200, got %d", resp.StatusCode)
	}

	// Test GET /health
	respHealth, err := http.Get("http://127.0.0.1:8089/health")
	if err != nil {
		t.Fatalf("GET /health error: %v", err)
	}
	defer respHealth.Body.Close()

	if respHealth.StatusCode != http.StatusOK {
		t.Errorf("Expected status 200 on health, got %d", respHealth.StatusCode)
	}
}

func TestServerWebSocketApprovalFlow(t *testing.T) {
	dummyHTML := []byte("<!DOCTYPE html><html><body>LANMirror Viewer</body></html>")
	cb := &mockCallback{}
	srv := NewServer(8090, dummyHTML, cb)

	err := srv.Start()
	if err != nil {
		t.Fatalf("Failed to start server: %v", err)
	}
	defer srv.Stop()

	time.Sleep(100 * time.Millisecond)

	// Connect WebSocket client
	wsURL := "ws://127.0.0.1:8090/ws"
	ws, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("Failed to connect websocket: %v", err)
	}
	defer ws.Close()

	// Send connection request
	req := WsMessage{
		Type:        "connection_request",
		ClientID:    "test-phone-uuid-123",
		DisplayName: "Vinay's Phone",
	}
	reqBytes, _ := json.Marshal(req)
	if err := ws.WriteMessage(websocket.TextMessage, reqBytes); err != nil {
		t.Fatalf("Failed to send connection request: %v", err)
	}

	// Read pending status response
	_, respBytes, err := ws.ReadMessage()
	if err != nil {
		t.Fatalf("Failed to read pending response: %v", err)
	}

	var resp WsMessage
	if err := json.Unmarshal(respBytes, &resp); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if resp.State != "pending" {
		t.Errorf("Expected pending state, got %s", resp.State)
	}

	pending := srv.GetPendingClients()
	if len(pending) != 1 || pending[0].DisplayName != "Vinay's Phone" {
		t.Errorf("Pending client not found in server: %+v", pending)
	}

	// Approve client
	srv.ApproveClient("test-phone-uuid-123")

	// Client should receive approved status
	_, approvedBytes, err := ws.ReadMessage()
	if err != nil {
		t.Fatalf("Failed to read approved response: %v", err)
	}

	var approvedResp WsMessage
	if err := json.Unmarshal(approvedBytes, &approvedResp); err != nil {
		t.Fatalf("Failed to parse approved response: %v", err)
	}

	if approvedResp.State != "approved" {
		t.Errorf("Expected approved state, got %s", approvedResp.State)
	}

	connected := srv.GetConnectedClients()
	if len(connected) != 1 {
		t.Errorf("Expected 1 connected client, got %d", len(connected))
	}

	// Test announcement broadcast
	srv.BroadcastAnnouncement("Hello mobile phone!")

	_, annBytes, err := ws.ReadMessage()
	if err != nil {
		t.Fatalf("Failed to read announcement: %v", err)
	}

	var annResp WsMessage
	if err := json.Unmarshal(annBytes, &annResp); err != nil {
		t.Fatalf("Failed to parse announcement: %v", err)
	}

	if annResp.Type != "announcement" || !strings.Contains(annResp.Message, "Hello mobile phone!") {
		t.Errorf("Unexpected announcement message: %+v", annResp)
	}
}
