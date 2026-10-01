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
	// New clients start as pending and require manual approval

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

	var foundAnnouncement bool
	for i := 0; i < 3; i++ {
		_, msgBytes, err := ws.ReadMessage()
		if err != nil {
			t.Fatalf("Failed to read message: %v", err)
		}

		var m WsMessage
		if err := json.Unmarshal(msgBytes, &m); err != nil {
			t.Fatalf("Failed to parse message: %v", err)
		}

		if m.Type == "announcement" && strings.Contains(m.Message, "Hello mobile phone!") {
			foundAnnouncement = true
			break
		}
	}

	if !foundAnnouncement {
		t.Errorf("Expected to receive announcement message with 'Hello mobile phone!'")
	}
}

func TestServerWebSocketReconnectFlow(t *testing.T) {
	dummyHTML := []byte("<!DOCTYPE html><html><body>LANMirror Viewer</body></html>")
	cb := &mockCallback{}
	srv := NewServer(8091, dummyHTML, cb)

	err := srv.Start()
	if err != nil {
		t.Fatalf("Failed to start server: %v", err)
	}
	defer srv.Stop()

	time.Sleep(100 * time.Millisecond)

	wsURL := "ws://127.0.0.1:8091/ws"
	ws, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("Failed to connect websocket: %v", err)
	}

	// Connect and get pending state
	req := WsMessage{
		Type:        "connection_request",
		ClientID:    "test-reconnect-789",
		DisplayName: "Reconnect Phone",
	}
	reqBytes, _ := json.Marshal(req)
	if err := ws.WriteMessage(websocket.TextMessage, reqBytes); err != nil {
		t.Fatalf("Failed to send connection request: %v", err)
	}

	_, respBytes, err := ws.ReadMessage()
	if err != nil {
		t.Fatalf("Failed to read response: %v", err)
	}

	var resp WsMessage
	if err := json.Unmarshal(respBytes, &resp); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}
	if resp.State != "pending" {
		t.Errorf("Expected pending state, got %s", resp.State)
	}

	// Approve client then simulate reconnect with same ID
	srv.ApproveClient("test-reconnect-789")
	ws.Close()

	time.Sleep(100 * time.Millisecond)

	// Reconnect with same client ID — should get approved immediately
	ws2, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("Failed to reconnect websocket: %v", err)
	}
	defer ws2.Close()

	req2Bytes, _ := json.Marshal(req)
	if err := ws2.WriteMessage(websocket.TextMessage, req2Bytes); err != nil {
		t.Fatalf("Failed to send reconnect request: %v", err)
	}

	_, respBytes2, err := ws2.ReadMessage()
	if err != nil {
		t.Fatalf("Failed to read reconnect response: %v", err)
	}

	var resp2 WsMessage
	if err := json.Unmarshal(respBytes2, &resp2); err != nil {
		t.Fatalf("Failed to parse reconnect response: %v", err)
	}
	if resp2.State != "approved" {
		t.Errorf("Expected approved on reconnect (same client ID), got %s", resp2.State)
	}
}

func TestBroadcastFrameNonBlockingWithSlowClient(t *testing.T) {
	dummyHTML := []byte("<!DOCTYPE html><html><body>LANMirror Viewer</body></html>")
	cb := &mockCallback{}
	srv := NewServer(8092, dummyHTML, cb)

	err := srv.Start()
	if err != nil {
		t.Fatalf("Failed to start server: %v", err)
	}
	defer srv.Stop()

	time.Sleep(100 * time.Millisecond)

	wsURL := "ws://127.0.0.1:8092/ws"

	// Connect Client 1 (Fast client)
	wsFast, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("Failed to connect fast websocket: %v", err)
	}
	defer wsFast.Close()

	reqFast := WsMessage{Type: "connection_request", ClientID: "fast-client-1", DisplayName: "Fast Viewer"}
	bFast, _ := json.Marshal(reqFast)
	_ = wsFast.WriteMessage(websocket.TextMessage, bFast)
	_, _, _ = wsFast.ReadMessage() // read pending

	// Connect Client 2 (Slow/unresponsive client that never reads binary frames)
	wsSlow, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("Failed to connect slow websocket: %v", err)
	}
	defer wsSlow.Close()

	reqSlow := WsMessage{Type: "connection_request", ClientID: "slow-client-2", DisplayName: "Slow Viewer"}
	bSlow, _ := json.Marshal(reqSlow)
	_ = wsSlow.WriteMessage(websocket.TextMessage, bSlow)
	_, _, _ = wsSlow.ReadMessage() // read pending

	// Approve both
	srv.ApproveClient("fast-client-1")
	srv.ApproveClient("slow-client-2")
	_, _, _ = wsFast.ReadMessage() // read approved
	_, _, _ = wsSlow.ReadMessage() // read approved

	time.Sleep(50 * time.Millisecond)

	// Simulate high-frequency frame broadcasting (e.g. 30 frames)
	dummyFrame := []byte{0x11, 0, 0, 0, 0, 0, 0, 0, 1, 0, 100, 0, 100, 0xFF, 0xD8, 0xFF}

	start := time.Now()
	for i := 0; i < 30; i++ {
		srv.BroadcastFrame(dummyFrame)
	}
	broadcastDuration := time.Since(start)

	// In the old implementation with blocking SafeSend, this would block for seconds per frame.
	// With the new non-blocking queue, 30 broadcasts must finish in under 100ms!
	if broadcastDuration > 100*time.Millisecond {
		t.Errorf("BroadcastFrame took too long: %v (expected < 100ms)", broadcastDuration)
	}

	// Verify the server has approved viewers
	if !srv.HasApprovedViewers() {
		t.Errorf("Expected server to have approved viewers")
	}
}

