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
		jpegQuality:    72,
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
			Name:        "30 FPS (Smooth 1080p)",
			Description: "Minimum 30 FPS • Ultra-Low Latency",
			MaxHeight:   1080,
			Quality:     72,
			TargetFPS:   30,
		},
		{
			ID:          "45fps",
			Name:        "45 FPS (High Framerate)",
			Description: "45 FPS High Motion • Balanced",
			MaxHeight:   1080,
			Quality:     70,
			TargetFPS:   45,
		},
		{
			ID:          "60fps",
			Name:        "60 FPS (Pro Motion)",
			Description: "60 FPS Pro • Zero Stutter",
			MaxHeight:   1080,
			Quality:     68,
			TargetFPS:   60,
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
		s.jpegQuality = 68
		s.maxHeight = 1080
	case "45fps":
		s.targetFPS = 45
		s.jpegQuality = 70
		s.maxHeight = 1080
	case "clarity_30":
		s.targetFPS = 30
		s.jpegQuality = 78
		s.maxHeight = 1080
	default: // "30fps"
		s.targetFPS = 30
		s.jpegQuality = 72
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

// fastDownscaleRGBA rapidly resizes an RGBA image using direct memory mapping
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

	// Precompute X mapping for extreme performance
	xMap := make([]int, dstW)
	for dx := 0; dx < dstW; dx++ {
		xMap[dx] = (dx * srcW / dstW) * 4
	}

	for dy := 0; dy < dstH; dy++ {
		sy := dy * srcH / dstH
		srcRowOffset := sy * srcStride
		dstRowOffset := dy * dstStride

		for dx := 0; dx < dstW; dx++ {
			sx4 := xMap[dx]
			sOff := srcRowOffset + sx4
			dOff := dstRowOffset + dx*4

			if sOff >= 0 && sOff+3 < len(srcPix) && dOff >= 0 && dOff+3 < len(dstPix) {
				dstPix[dOff] = srcPix[sOff]
				dstPix[dOff+1] = srcPix[sOff+1]
				dstPix[dOff+2] = srcPix[sOff+2]
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
