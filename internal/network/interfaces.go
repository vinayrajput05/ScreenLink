package network

import (
	"net"
	"strings"
)

// InterfaceInfo represents a network interface with IPv4 addresses
type InterfaceInfo struct {
	Name        string   `json:"name"`
	IPAddresses []string `json:"ipAddresses"`
}

// GetLocalIPv4Addresses discovers all valid, non-loopback IPv4 addresses
func GetLocalIPv4Addresses() ([]string, error) {
	interfaces, err := net.Interfaces()
	if err != nil {
		return nil, err
	}

	var ips []string

	for _, iface := range interfaces {
		// Ignore interfaces that are down or loopback
		if iface.Flags&net.FlagUp == 0 || iface.Flags&net.FlagLoopback != 0 {
			continue
		}

		addrs, err := iface.Addrs()
		if err != nil {
			continue
		}

		for _, addr := range addrs {
			var ip net.IP
			switch v := addr.(type) {
			case *net.IPNet:
				ip = v.IP
			case *net.IPAddr:
				ip = v.IP
			}

			if ip == nil || ip.IsLoopback() {
				continue
			}

			// Ensure it is IPv4 (not IPv6 for simplicity in MVP)
			ipv4 := ip.To4()
			if ipv4 != nil {
				ipStr := ipv4.String()
				// Avoid link-local 169.254.x.x
				if !strings.HasPrefix(ipStr, "169.254.") {
					ips = append(ips, ipStr)
				}
			}
		}
	}

	if len(ips) == 0 {
		ips = append(ips, "127.0.0.1")
	}

	return ips, nil
}
