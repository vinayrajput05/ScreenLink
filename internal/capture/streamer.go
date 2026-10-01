package capture

import (
	"bytes"
	"context"
	"encoding/binary"
	"fmt"
	"image"
	"image/jpeg"
	"sync"
	"sync/atomic"
	"time"

	"github.com/kbinani/screenshot"
)

type FrameBroadcaster interface {
	BroadcastFrame(frameData []byte)
	HasApprovedViewers() bool
}

type Display struct {
	Index      int    `json:"index"`
	ID         string `json:"id"`
	Name       string `json:"name"`
	Resolution string `json:"resolution"`
	IsPrimary  bool   `json:"isPrimary"`
	Bounds     image.Rectangle
}

type QualityPreset struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	MaxHeight   int    `json:"maxHeight"`
	Quality     int    `json:"quality"`
	TargetFPS   int    `json:"targetFps"`
}

type Streamer struct {
	displayIndex   int
	targetFPS      int
	jpegQuality    int
	maxHeight      int
	selectedPreset string
	broadcaster    FrameBroadcaster
	cancel         context.CancelFunc
	mu             sync.Mutex
	isRunning      bool
	isPaused       bool
	frameID        uint64
}

func NewStreamer(broadcaster FrameBroadcaster) *Streamer {
	s := &Streamer{
		displayIndex:   0,
		targetFPS:      30,
		jpegQuality:    85,
		maxHeight:      1080,
		selectedPreset: "30fps",
		broadcaster:    broadcaster,
	}
	return s
}

func (s *Streamer) SetBroadcaster(b FrameBroadcaster) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.broadcaster = b
}

// GetAvailableQualityPresets returns all stream FPS and quality options
func GetAvailableQualityPresets() []QualityPreset {
	return []QualityPreset{
		{
			ID:          "30fps",
			Name:        "1080p Full HD (30 FPS)",
			Description: "Recommended • Razor-Sharp Text Clarity",
			MaxHeight:   1080,
			Quality:     85,
			TargetFPS:   30,
		},
		{
			ID:          "45fps",
			Name:        "1080p High Motion (45 FPS)",
			Description: "45 FPS Fluid • Balanced Clarity",
			MaxHeight:   1080,
			Quality:     82,
			TargetFPS:   45,
		},
		{
			ID:          "60fps",
			Name:        "1080p Pro Motion (60 FPS)",
			Description: "60 FPS Pro • Zero Stutter",
			MaxHeight:   1080,
			Quality:     80,
			TargetFPS:   60,
		},
		{
			ID:          "clarity_30",
			Name:        "1080p Ultra Text (30 FPS)",
			Description: "Maximum 1080p Sharpness (Quality 90)",
			MaxHeight:   1080,
			Quality:     90,
			TargetFPS:   30,
		},
	}
}

// GetAvailableDisplays queries the OS for all connected active screens
func GetAvailableDisplays() []Display {
	num := screenshot.NumActiveDisplays()
	if num <= 0 {
		return []Display{
			{
				Index:      0,
				ID:         "display-0",
				Name:       "Primary Display",
				Resolution: "1920 × 1080 (Full HD)",
				IsPrimary:  true,
				Bounds:     image.Rect(0, 0, 1920, 1080),
			},
		}
	}

	var displays []Display
	for i := 0; i < num; i++ {
		bounds := screenshot.GetDisplayBounds(i)
		w := bounds.Dx()
		h := bounds.Dy()
		name := fmt.Sprintf("Display %d", i+1)
		if i == 0 {
			name += " (Primary)"
		}

		displays = append(displays, Display{
			Index:      i,
			ID:         fmt.Sprintf("display-%d", i),
			Name:       name,
			Resolution: fmt.Sprintf("%d × %d", w, h),
			IsPrimary:  i == 0,
			Bounds:     bounds,
		})
	}
	return displays
}

func (s *Streamer) SetDisplayIndex(idx int) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.displayIndex = idx
}

func (s *Streamer) SetQualityPreset(presetID string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.selectedPreset = presetID
	switch presetID {
	case "60fps":
		s.targetFPS = 60
		s.jpegQuality = 80
		s.maxHeight = 1080
	case "45fps":
		s.targetFPS = 45
		s.jpegQuality = 82
		s.maxHeight = 1080
	case "clarity_30":
		s.targetFPS = 30
		s.jpegQuality = 90
		s.maxHeight = 1080
	default: // "30fps"
		s.targetFPS = 30
		s.jpegQuality = 85
		s.maxHeight = 1080
	}
}

func (s *Streamer) Start() error {
	s.mu.Lock()
	if s.isRunning {
		s.isPaused = false
		s.mu.Unlock()
		return nil
	}

	ctx, cancel := context.WithCancel(context.Background())
	s.cancel = cancel
	s.isRunning = true
	s.isPaused = false
	s.mu.Unlock()

	go s.runPipelinedCapture(ctx)
	return nil
}

func (s *Streamer) Pause() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.isPaused = true
}

func (s *Streamer) Resume() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.isPaused = false
}

func (s *Streamer) IsPaused() bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.isPaused
}

func (s *Streamer) Stop() {
	s.mu.Lock()
	if !s.isRunning {
		s.mu.Unlock()
		return
	}
	s.isRunning = false
	s.isPaused = false
	if s.cancel != nil {
		s.cancel()
		s.cancel = nil
	}
	s.mu.Unlock()
}

// fastDownscaleRGBA rapidly resizes an RGBA image using area-averaging box interpolation
// to preserve sharp text, eliminate jagged pixel drop, and maintain 1080p clarity.
func fastDownscaleRGBA(src *image.RGBA, dst *image.RGBA) {
	if src == nil || dst == nil {
		return
	}
	defer func() {
		_ = recover()
	}()

	srcBounds := src.Bounds()
	dstBounds := dst.Bounds()

	srcW := srcBounds.Dx()
	srcH := srcBounds.Dy()
	dstW := dstBounds.Dx()
	dstH := dstBounds.Dy()

	if srcW <= 0 || srcH <= 0 || dstW <= 0 || dstH <= 0 {
		return
	}

	srcPix := src.Pix
	dstPix := dst.Pix
	srcStride := src.Stride
	dstStride := dst.Stride

	// Precompute X mappings: 2 samples per horizontal pixel for clean box anti-aliasing
	x0Map := make([]int, dstW)
	x1Map := make([]int, dstW)
	for dx := 0; dx < dstW; dx++ {
		sx0 := (dx * srcW) / dstW
		sx1 := sx0 + 1
		if sx1 >= srcW {
			sx1 = sx0
		}
		x0Map[dx] = sx0 * 4
		x1Map[dx] = sx1 * 4
	}

	for dy := 0; dy < dstH; dy++ {
		sy0 := (dy * srcH) / dstH
		sy1 := sy0 + 1
		if sy1 >= srcH {
			sy1 = sy0
		}
		row0 := sy0 * srcStride
		row1 := sy1 * srcStride
		dstRow := dy * dstStride

		for dx := 0; dx < dstW; dx++ {
			off0 := x0Map[dx]
			off1 := x1Map[dx]

			p00 := row0 + off0
			p10 := row0 + off1
			p01 := row1 + off0
			p11 := row1 + off1

			dOff := dstRow + dx*4

			if p11+3 < len(srcPix) && dOff+3 < len(dstPix) {
				r := (uint32(srcPix[p00]) + uint32(srcPix[p10]) + uint32(srcPix[p01]) + uint32(srcPix[p11]) + 2) >> 2
				g := (uint32(srcPix[p00+1]) + uint32(srcPix[p10+1]) + uint32(srcPix[p01+1]) + uint32(srcPix[p11+1]) + 2) >> 2
				b := (uint32(srcPix[p00+2]) + uint32(srcPix[p10+2]) + uint32(srcPix[p01+2]) + uint32(srcPix[p11+2]) + 2) >> 2

				dstPix[dOff] = uint8(r)
				dstPix[dOff+1] = uint8(g)
				dstPix[dOff+2] = uint8(b)
				dstPix[dOff+3] = 255
			}
		}
	}
}

// runPipelinedCapture runs a zero-latency capture & encoding pipeline
func (s *Streamer) runPipelinedCapture(ctx context.Context) {
	type rawFrame struct {
		img    image.Image
		width  int
		height int
	}

	// 1-slot buffered channel ensures absolute zero frame buffering/backlog
	frameChan := make(chan rawFrame, 1)

	// 1. Dedicated Ultra-Fast Encoder Worker
	go func() {
		defer func() {
			_ = recover()
		}()

		buf := new(bytes.Buffer)
		rawJpegBuf := new(bytes.Buffer)
		var resizedBuf *image.RGBA
		var lastTargetW, lastTargetH int

		for {
			select {
			case <-ctx.Done():
				return
			case frame, ok := <-frameChan:
				if !ok {
					return
				}
				if frame.img == nil {
					continue
				}

				// Safe per-frame execution: transient panic on a single frame will not terminate encoder
				func() {
					defer func() {
						_ = recover()
					}()

					s.mu.Lock()
					quality := s.jpegQuality
					maxH := s.maxHeight
					broadcaster := s.broadcaster
					paused := s.isPaused
					s.mu.Unlock()

					if paused || broadcaster == nil || !broadcaster.HasApprovedViewers() {
						return
					}

					imgToEncode := frame.img
					finalW := frame.width
					finalH := frame.height

					// Downscale if higher than max configured resolution (e.g. 1080p limit)
					if maxH > 0 && frame.height > maxH {
						targetH := maxH
						targetW := (frame.width * targetH) / frame.height
						if targetW%2 != 0 {
							targetW--
						}

						if resizedBuf == nil || lastTargetW != targetW || lastTargetH != targetH {
							resizedBuf = image.NewRGBA(image.Rect(0, 0, targetW, targetH))
							lastTargetW = targetW
							lastTargetH = targetH
						}

						if rgba, ok := frame.img.(*image.RGBA); ok {
							fastDownscaleRGBA(rgba, resizedBuf)
							imgToEncode = resizedBuf
							finalW = targetW
							finalH = targetH
						}
					}

					rawJpegBuf.Reset()
					err := jpeg.Encode(rawJpegBuf, imgToEncode, &jpeg.Options{Quality: quality})
					if err != nil {
						return
					}
					jpegBytes := rawJpegBuf.Bytes()

					buf.Reset()
					fid := atomic.AddUint64(&s.frameID, 1)
					_ = buf.WriteByte(0x11)
					_ = binary.Write(buf, binary.BigEndian, fid)
					_ = binary.Write(buf, binary.BigEndian, uint16(finalW))
					_ = binary.Write(buf, binary.BigEndian, uint16(finalH))
					_, _ = buf.Write(jpegBytes)

					// Allocate an independent slice copy so asynchronous network write pumps
					// do not data-race with buf.Reset() on subsequent frames
					framePayload := make([]byte, buf.Len())
					copy(framePayload, buf.Bytes())

					broadcaster.BroadcastFrame(framePayload)
				}()
			}
		}
	}()

	// 2. High-Performance Screen Capture Loop
	defer func() {
		_ = recover()
	}()

	for {
		select {
		case <-ctx.Done():
			return
		default:
			// Safe per-iteration execution: transient capture failure or display sleep will not kill loop
			func() {
				defer func() {
					_ = recover()
				}()

				s.mu.Lock()
				fps := s.targetFPS
				idx := s.displayIndex
				broadcaster := s.broadcaster
				paused := s.isPaused
				s.mu.Unlock()

				if paused {
					time.Sleep(60 * time.Millisecond)
					return
				}

				if fps < 30 {
					fps = 30
				}

				hasViewers := (broadcaster != nil && broadcaster.HasApprovedViewers())
				if !hasViewers {
					time.Sleep(50 * time.Millisecond)
					return
				}

				frameStart := time.Now()

				num := screenshot.NumActiveDisplays()
				if num <= 0 {
					time.Sleep(80 * time.Millisecond)
					return
				}

				if idx < 0 || idx >= num {
					idx = 0
				}

				bounds := screenshot.GetDisplayBounds(idx)
				if bounds.Dx() <= 0 || bounds.Dy() <= 0 {
					time.Sleep(50 * time.Millisecond)
					return
				}

				img, err := screenshot.CaptureRect(bounds)
				if err != nil || img == nil {
					time.Sleep(25 * time.Millisecond)
					return
				}

				// Render mouse cursor if on current display
				if curX, curY, ok := getCursorPos(); ok {
					if curX >= bounds.Min.X && curX < bounds.Max.X &&
						curY >= bounds.Min.Y && curY < bounds.Max.Y {
						imgW := img.Bounds().Dx()
						imgH := img.Bounds().Dy()
						boundW := bounds.Dx()
						boundH := bounds.Dy()
						if boundW > 0 && boundH > 0 && imgW > 0 && imgH > 0 {
							relX := (curX - bounds.Min.X) * imgW / boundW
							relY := (curY - bounds.Min.Y) * imgH / boundH
							DrawCursor(img, relX, relY)
						}
					}
				}

				// Non-blocking handoff to encoder worker (drops stale frames immediately if encoder is busy)
				select {
				case frameChan <- rawFrame{img: img, width: bounds.Dx(), height: bounds.Dy()}:
				default:
				}

				// Exact framerate pacing
				targetInterval := time.Duration(1000/fps) * time.Millisecond
				elapsed := time.Since(frameStart)
				if elapsed < targetInterval {
					time.Sleep(targetInterval - elapsed)
				}
			}()
		}
	}
}
