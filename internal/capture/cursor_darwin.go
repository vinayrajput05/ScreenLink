//go:build darwin

package capture

/*
#cgo LDFLAGS: -framework CoreGraphics -framework Foundation
#include <CoreGraphics/CoreGraphics.h>

static void get_mouse_pos(double *x, double *y, int *ok) {
    CGEventRef event = CGEventCreate(NULL);
    if (event == NULL) {
        *ok = 0;
        return;
    }
    CGPoint loc = CGEventGetLocation(event);
    CFRelease(event);
    *x = loc.x;
    *y = loc.y;
    *ok = 1;
}
*/
import "C"

func getCursorPos() (int, int, bool) {
	var x, y C.double
	var ok C.int
	C.get_mouse_pos(&x, &y, &ok)
	if ok == 0 {
		return 0, 0, false
	}
	return int(x), int(y), true
}
