package network

import (
	"testing"
)

func TestGetLocalIPv4Addresses(t *testing.T) {
	ips, err := GetLocalIPv4Addresses()
	if err != nil {
		t.Fatalf("Failed to get IPs: %v", err)
	}
	t.Logf("Discovered local IPv4 addresses: %v", ips)
	if len(ips) == 0 {
		t.Fatalf("Expected at least one IP address")
	}
}
