//go:build !darwin && !windows

package capture

func getCursorPos() (int, int, bool) {
	return 0, 0, false
}
