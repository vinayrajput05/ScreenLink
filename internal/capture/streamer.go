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
		targetFPS:      30, // Minimum 30 FPS default
		jpegQuality:    82,
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
			Description: "Minimum 30 FPS • Ultra Smooth",
			MaxHeight:   1080,
			Quality:     82,
			TargetFPS:   30,
		},
		{
			ID:          "45fps",
			Name:        "45 FPS (High Framerate)",
			Description: "45 FPS High Clarity • Balanced",
			MaxHeight:   1080,
			Quality:     80,
			TargetFPS:   45,
		},
		{
			ID:          "60fps",
			Name:        "60 FPS (Pro Motion)",
			Description: "60 FPS Pro • Zero Stutter",
			MaxHeight:   1080,
			Quality:     78,
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
		s.jpegQuality = 78
	case "45fps":
		s.targetFPS = 45
		s.jpegQuality = 80
	case "clarity_30":
		s.targetFPS = 30
		s.jpegQuality = 88
	default: // "30fps"
		s.targetFPS = 30
		s.jpegQuality = 82
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

// runPipelinedCapture runs a crash-proof capture & encoding pipeline for 30–60 FPS
func (s *Streamer) runPipelinedCapture(ctx context.Context) {
	type rawFrame struct {
		img    image.Image
		width  int
		height int
	}

	// 1-slot buffered channel to guarantee zero-latency (always latest frame)
	frameChan := make(chan rawFrame, 1)

	// 1. Encoder Worker
	go func() {
		defer func() {
			_ = recover()
		}()

		buf := new(bytes.Buffer)
		rawJpegBuf := new(bytes.Buffer)

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

				s.mu.Lock()
				quality := s.jpegQuality
				broadcaster := s.broadcaster
				paused := s.isPaused
				s.mu.Unlock()

				if paused || broadcaster == nil || !broadcaster.HasApprovedViewers() {
					continue
				}

				rawJpegBuf.Reset()
				err := jpeg.Encode(rawJpegBuf, frame.img, &jpeg.Options{Quality: quality})
				if err != nil {
					continue
				}
				jpegBytes := rawJpegBuf.Bytes()

				buf.Reset()
				fid := atomic.AddUint64(&s.frameID, 1)
				_ = buf.WriteByte(0x11)
				_ = binary.Write(buf, binary.BigEndian, fid)
				_ = binary.Write(buf, binary.BigEndian, uint16(frame.width))
				_ = binary.Write(buf, binary.BigEndian, uint16(frame.height))
				_, _ = buf.Write(jpegBytes)

				broadcaster.BroadcastFrame(buf.Bytes())
			}
		}
	}()

	// 2. Single Dedicated Capture Loop (avoids macOS CoreGraphics thread collisions)
	defer func() {
		_ = recover()
	}()

	for {
		select {
		case <-ctx.Done():
			return
		default:
			s.mu.Lock()
			fps := s.targetFPS
			idx := s.displayIndex
			broadcaster := s.broadcaster
			paused := s.isPaused
			s.mu.Unlock()

			if paused {
				time.Sleep(100 * time.Millisecond)
				continue
			}

			if fps < 30 {
				fps = 30
			}

			hasViewers := (broadcaster != nil && broadcaster.HasApprovedViewers())
			if !hasViewers {
				time.Sleep(60 * time.Millisecond)
				continue
			}

			frameStart := time.Now()

			num := screenshot.NumActiveDisplays()
			if num <= 0 {
				time.Sleep(100 * time.Millisecond)
				continue
			}

			if idx < 0 || idx >= num {
				idx = 0
			}

			bounds := screenshot.GetDisplayBounds(idx)
			if bounds.Dx() <= 0 || bounds.Dy() <= 0 {
				time.Sleep(50 * time.Millisecond)
				continue
			}

			img, err := screenshot.CaptureRect(bounds)
			if err != nil || img == nil {
				time.Sleep(20 * time.Millisecond)
				continue
			}

			// Render mouse cursor if it is on current display
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

			// Non-blocking send: if encoder is busy, drop stale frame
			select {
			case frameChan <- rawFrame{img: img, width: bounds.Dx(), height: bounds.Dy()}:
			default:
			}

			// Precise framerate sleep
			targetInterval := time.Duration(1000/fps) * time.Millisecond
			elapsed := time.Since(frameStart)
			if elapsed < targetInterval {
				time.Sleep(targetInterval - elapsed)
			}
		}
	}
}
