//go:build darwin
// +build darwin

package main

/*
#cgo CFLAGS: -x objective-c
#cgo LDFLAGS: -framework Cocoa
#import <Cocoa/Cocoa.h>

void setMacDockIcon(const void* data, int length) {
    @autoreleasepool {
        NSData* nsData = [NSData dataWithBytes:data length:length];
        NSImage* img = [[NSImage alloc] initWithData:nsData];
        if (img != nil) {
            [NSApp setApplicationIconImage:img];
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
