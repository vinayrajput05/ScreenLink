//go:build !darwin

package capture

// HasScreenCapturePermission always returns true on non-macOS platforms
func HasScreenCapturePermission() bool {
	return true
}

// RequestScreenCapturePermission is a no-op on non-macOS platforms
func RequestScreenCapturePermission() bool {
	return true
}

// OpenScreenCaptureSettings is a no-op on non-macOS platforms
func OpenScreenCaptureSettings() error {
	return nil
}
