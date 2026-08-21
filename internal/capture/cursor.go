package capture

import (
	"image"
	"image/color"
)

var (
	colorBorder = color.RGBA{R: 15, G: 23, B: 42, A: 255}    // Slate 900
	colorWhite  = color.RGBA{R: 255, G: 255, B: 255, A: 255} // Pure White
	colorShadow = color.RGBA{R: 0, G: 0, B: 0, A: 80}         // Drop shadow
)

// cursorTemplate defines a high-visibility, anti-aliased mouse pointer
var cursorTemplate = []string{
	"B...................",
	"BB..................",
	"BWB.................",
	"BWWBS...............",
	"BWWWBS..............",
	"BWWWWBS.............",
	"BWWWWWBS............",
	"BWWWWWWBS...........",
	"BWWWWWWWBS..........",
	"BWWWWWWWWBS.........",
	"BWWWWWWWWWBS........",
	"BWWWWWWWWWWBS.......",
	"BWWWWWWBBBBBB.......",
	"BWWWBWBWWBS.........",
	"BWWBS.BWWBS.........",
	"BWBS..BWWBS.........",
	"BBS....BWWBS........",
	"BS.....BWWBS........",
	".......SBWWBS.......",
	"........BWWBS.......",
	".........BBSS.......",
	"..........SS........",
}

// DrawCursor renders the mouse cursor onto the given image at (posX, posY)
func DrawCursor(img image.Image, posX, posY int) {
	if img == nil {
		return
	}

	bounds := img.Bounds()

	// Quick rejection if totally outside bounds
	cursorHeight := len(cursorTemplate)
	if cursorHeight == 0 {
		return
	}
	cursorWidth := len(cursorTemplate[0])

	if posX+cursorWidth <= bounds.Min.X || posX >= bounds.Max.X ||
		posY+cursorHeight <= bounds.Min.Y || posY >= bounds.Max.Y {
		return
	}

	rgba, isRGBA := img.(*image.RGBA)

	for row := 0; row < cursorHeight; row++ {
		line := cursorTemplate[row]
		currentY := posY + row
		if currentY < bounds.Min.Y || currentY >= bounds.Max.Y {
			continue
		}

		for col := 0; col < len(line); col++ {
			char := line[col]
			if char == '.' {
				continue
			}

			currentX := posX + col
			if currentX < bounds.Min.X || currentX >= bounds.Max.X {
				continue
			}

			var c color.RGBA
			switch char {
			case 'B':
				c = colorBorder
			case 'W':
				c = colorWhite
			case 'S':
				c = colorShadow
			default:
				continue
			}

			if isRGBA {
				offset := rgba.PixOffset(currentX, currentY)
				if c.A == 255 {
					rgba.Pix[offset] = c.R
					rgba.Pix[offset+1] = c.G
					rgba.Pix[offset+2] = c.B
					rgba.Pix[offset+3] = 255
				} else if c.A > 0 {
					// Alpha blend
					alpha := uint32(c.A)
					invAlpha := uint32(255 - c.A)
					oldR := uint32(rgba.Pix[offset])
					oldG := uint32(rgba.Pix[offset+1])
					oldB := uint32(rgba.Pix[offset+2])

					rgba.Pix[offset] = uint8((uint32(c.R)*alpha + oldR*invAlpha) / 255)
					rgba.Pix[offset+1] = uint8((uint32(c.G)*alpha + oldG*invAlpha) / 255)
					rgba.Pix[offset+2] = uint8((uint32(c.B)*alpha + oldB*invAlpha) / 255)
				}
			}
		}
	}
}

// GetCursorPosition returns the current cursor position in screen coordinates
func GetCursorPosition() (int, int, bool) {
	return getCursorPos()
}
