package capture

import (
	"image"
	"image/color"
	"testing"
)

func TestGetCursorPos(t *testing.T) {
	x, y, ok := GetCursorPosition()
	t.Logf("Cursor position: (%d, %d), valid=%v", x, y, ok)
}

func TestDrawCursor(t *testing.T) {
	img := image.NewRGBA(image.Rect(0, 0, 100, 100))
	// Fill with white background
	for i := range img.Pix {
		img.Pix[i] = 255
	}

	// Draw cursor at (20, 20)
	DrawCursor(img, 20, 20)

	// Verify that cursor tip at (20, 20) has border color (Slate 900)
	tipColor := img.At(20, 20).(color.RGBA)
	if tipColor.R != colorBorder.R || tipColor.G != colorBorder.G || tipColor.B != colorBorder.B {
		t.Fatalf("Expected tip to be border color %v, got %v", colorBorder, tipColor)
	}

	// Draw cursor near edge to test bounds clipping
	DrawCursor(img, 95, 95)
	DrawCursor(img, -5, -5)
}
