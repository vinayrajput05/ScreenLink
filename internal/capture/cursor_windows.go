//go:build windows

package capture

import (
	"syscall"
	"unsafe"
)

type point struct {
	X int32
	Y int32
}

var (
	user32           = syscall.NewLazyDLL("user32.dll")
	procGetCursorPos = user32.NewProc("GetCursorPos")
)

func getCursorPos() (int, int, bool) {
	var pt point
	ret, _, _ := procGetCursorPos.Call(uintptr(unsafe.Pointer(&pt)))
	if ret == 0 {
		return 0, 0, false
	}
	return int(pt.X), int(pt.Y), true
}
