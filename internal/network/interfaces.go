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

// GetLocalIPv4Addresses discovers all valid, non-loopback IPv4 addresses, sorting primary Wi-Fi/Ethernet IPs first
func GetLocalIPv4Addresses() ([]string, error) {
	interfaces, err := net.Interfaces()
	if err != nil {
		return nil, err
	}

	var priorityIPs []string
	var otherIPs []string

	for _, iface := range interfaces {
		// Ignore interfaces that are down or loopback
		if iface.Flags&net.FlagUp == 0 || iface.Flags&net.FlagLoopback != 0 {
			continue
		}

		name := strings.ToLower(iface.Name)
		// Deprioritize virtual / tunnel interfaces
		isVirtual := strings.HasPrefix(name, "utun") ||
			strings.HasPrefix(name, "bridge") ||
			strings.HasPrefix(name, "awdl") ||
			strings.HasPrefix(name, "llw") ||
			strings.HasPrefix(name, "docker") ||
			strings.HasPrefix(name, "vbox") ||
			strings.HasPrefix(name, "vmnet")

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

			ipv4 := ip.To4()
			if ipv4 != nil {
				ipStr := ipv4.String()
				// Avoid link-local 169.254.x.x
				if strings.HasPrefix(ipStr, "169.254.") {
					continue
				}

				// Prioritize private LAN subnets on physical interfaces
				if !isVirtual && (strings.HasPrefix(ipStr, "192.168.") || strings.HasPrefix(ipStr, "10.") || strings.HasPrefix(ipStr, "172.")) {
					priorityIPs = append(priorityIPs, ipStr)
				} else {
					otherIPs = append(otherIPs, ipStr)
				}
			}
		}
	}

	ips := append(priorityIPs, otherIPs...)

	if len(ips) == 0 {
		ips = append(ips, "127.0.0.1")
	}

	return ips, nil
}
