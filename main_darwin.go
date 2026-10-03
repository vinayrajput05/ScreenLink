//go:build darwin
// +build darwin

package main

/*
#cgo CFLAGS: -x objective-c -mmacosx-version-min=14.5
#cgo LDFLAGS: -framework Cocoa -mmacosx-version-min=14.5
#import <Cocoa/Cocoa.h>

void setMacDockIcon(const void* data, int length) {
    @autoreleasepool {
        if (data == NULL || length <= 0) return;
        NSApplication* app = [NSApplication sharedApplication];
        if (app == nil) return;
        NSData* nsData = [NSData dataWithBytes:data length:length];
        if (nsData != nil) {
            NSImage* img = [[NSImage alloc] initWithData:nsData];
            if (img != nil) {
                [app setApplicationIconImage:img];
            }
        }
    }
}
*/
import "C"
import (
	_ "embed"
	"unsafe"
)

//go:embed build/appicon.png
var appIconPNG []byte

func setDockIcon() {
	if len(appIconPNG) > 0 {
		C.setMacDockIcon(unsafe.Pointer(&appIconPNG[0]), C.int(len(appIconPNG)))
	}
}
