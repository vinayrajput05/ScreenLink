package capture

import (
	"bytes"
	"image/jpeg"
	"testing"
	"time"

	"github.com/kbinani/screenshot"
)

func TestDisplayDetectionAndCapture(t *testing.T) {
	numDisplays := screenshot.NumActiveDisplays()
	t.Logf("Detected %d active displays", numDisplays)
	if numDisplays <= 0 {
		t.Skip("No active display detected in current environment")
	}

	bounds := screenshot.GetDisplayBounds(0)
	t.Logf("Display 0 bounds: %v", bounds)

	start := time.Now()
	img, err := screenshot.CaptureRect(bounds)
	if err != nil {
		t.Fatalf("Failed to capture rect: %v", err)
	}
	captureTime := time.Since(start)
	t.Logf("Capture time: %v, dimensions: %dx%d", captureTime, img.Bounds().Dx(), img.Bounds().Dy())

	// Test JPEG encoding
	buf := new(bytes.Buffer)
	startEnc := time.Now()
	err = jpeg.Encode(buf, img, &jpeg.Options{Quality: 65})
	if err != nil {
		t.Fatalf("Failed to encode JPEG: %v", err)
	}
	encTime := time.Since(startEnc)
	t.Logf("JPEG Encode time: %v, payload size: %d bytes (%.2f KB)", encTime, buf.Len(), float64(buf.Len())/1024.0)
}
