//go:build darwin

package capture

/*
#cgo LDFLAGS: -framework CoreGraphics
#include <CoreGraphics/CoreGraphics.h>

static inline bool checkScreenCaptureAccess() {
    if (__builtin_available(macOS 10.15, *)) {
        return CGPreflightScreenCaptureAccess();
    }
    return true;
}

static inline bool requestScreenCaptureAccess() {
    if (__builtin_available(macOS 10.15, *)) {
        return CGRequestScreenCaptureAccess();
    }
    return true;
}
*/
import "C"

import (
	"os/exec"
)

// HasScreenCapturePermission checks if macOS TCC screen recording permission has been granted
func HasScreenCapturePermission() bool {
	return bool(C.checkScreenCaptureAccess())
}

// RequestScreenCapturePermission prompts the macOS native system dialog to grant screen recording permission
func RequestScreenCapturePermission() bool {
	return bool(C.requestScreenCaptureAccess())
}

// OpenScreenCaptureSettings directly opens macOS System Settings to the Screen Recording privacy pane
func OpenScreenCaptureSettings() error {
	return exec.Command("open", "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture").Start()
}
