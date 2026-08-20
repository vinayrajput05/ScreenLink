package capture

import (
	"bytes"
	"context"
	"encoding/binary"
	"fmt"
	"image"
	"image/jpeg"
	"sync"
	"time"

	"github.com/kbinani/screenshot"
	"golang.org/x/image/draw"
)

type FrameBroadcaster interface {
	BroadcastFrame(frameData []byte)
	HasApprovedViewers() bool
}

type YouTubeFrameSink interface {
	PushFrame(jpegData []byte)
	IsLive() bool
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
	ytSink         YouTubeFrameSink
	cancel         context.CancelFunc
	mu             sync.Mutex
	isRunning      bool
	frameID        uint64
}

func NewStreamer(broadcaster FrameBroadcaster) *Streamer {
	s := &Streamer{
		displayIndex:   0,
		targetFPS:      20,
		jpegQuality:    72,
		maxHeight:      1080,
		selectedPreset: "fhd",
		broadcaster:    broadcaster,
	}
	return s
}

func (s *Streamer) SetYouTubeSink(sink YouTubeFrameSink) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.ytSink = sink
}

// GetAvailableQualityPresets returns all stream quality options
func GetAvailableQualityPresets() []QualityPreset {
	return []QualityPreset{
		{
			ID:          "hd",
			Name:        "720p HD",
			Description: "Smooth (24 FPS) • Low Bandwidth",
			MaxHeight:   720,
			Quality:     60,
			TargetFPS:   24,
		},
		{
			ID:          "fhd",
			Name:        "1080p Full HD",
			Description: "Balanced (20 FPS) • Recommended",
			MaxHeight:   1080,
			Quality:     72,
			TargetFPS:   20,
		},
		{
			ID:          "2k",
			Name:        "2K / Retina",
			Description: "Crisp Text (18 FPS) • Code Demos",
			MaxHeight:   1440,
			Quality:     85,
			TargetFPS:   18,
		},
		{
			ID:          "4k",
			Name:        "4K Ultra",
			Description: "Max Fidelity (15 FPS) • Lossless Detail",
			MaxHeight:   2160,
			Quality:     93,
			TargetFPS:   15,
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
				Resolution: "1920 × 1080",
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
	case "hd":
		s.maxHeight = 720
		s.jpegQuality = 60
		s.targetFPS = 24
	case "2k":
		s.maxHeight = 1440
		s.jpegQuality = 85
		s.targetFPS = 18
	case "4k":
		s.maxHeight = 2160
		s.jpegQuality = 93
		s.targetFPS = 15
	default: // "fhd"
		s.maxHeight = 1080
		s.jpegQuality = 72
		s.targetFPS = 20
	}
}

func (s *Streamer) Start() error {
	s.mu.Lock()
	if s.isRunning {
		s.mu.Unlock()
		return nil
	}

	ctx, cancel := context.WithCancel(context.Background())
	s.cancel = cancel
	s.isRunning = true
	s.mu.Unlock()

	go s.captureLoop(ctx)
	return nil
}

func (s *Streamer) Stop() {
	s.mu.Lock()
	if !s.isRunning {
		s.mu.Unlock()
		return
	}
	s.isRunning = false
	if s.cancel != nil {
		s.cancel()
		s.cancel = nil
	}
	s.mu.Unlock()
}

func (s *Streamer) captureLoop(ctx context.Context) {
	buf := new(bytes.Buffer)
	rawJpegBuf := new(bytes.Buffer)

	for {
		s.mu.Lock()
		targetFPS := s.targetFPS
		sink := s.ytSink
		s.mu.Unlock()

		interval := time.Duration(1000/targetFPS) * time.Millisecond
		select {
		case <-ctx.Done():
			return
		case <-time.After(interval):
			hasLocalViewers := (s.broadcaster != nil && s.broadcaster.HasApprovedViewers())
			isYouTubeLive := (sink != nil && sink.IsLive())

			// If no local viewers and not live on YouTube, sleep to save CPU
			if !hasLocalViewers && !isYouTubeLive {
				time.Sleep(100 * time.Millisecond)
				continue
			}

			s.mu.Lock()
			idx := s.displayIndex
			quality := s.jpegQuality
			maxH := s.maxHeight
			s.mu.Unlock()

			num := screenshot.NumActiveDisplays()
			if idx >= num {
				idx = 0
			}

			bounds := screenshot.GetDisplayBounds(idx)
			img, err := screenshot.CaptureRect(bounds)
			if err != nil {
				time.Sleep(50 * time.Millisecond)
				continue
			}

			var finalImg image.Image = img
			w := img.Bounds().Dx()
			h := img.Bounds().Dy()

			// Scale down if screen resolution exceeds preset max height
			if maxH > 0 && h > maxH {
				newH := maxH
				newW := int(float64(w) * float64(maxH) / float64(h))
				scaled := image.NewRGBA(image.Rect(0, 0, newW, newH))
				draw.ApproxBiLinear.Scale(scaled, scaled.Bounds(), img, img.Bounds(), draw.Over, nil)
				finalImg = scaled
			}

			rawJpegBuf.Reset()
			err = jpeg.Encode(rawJpegBuf, finalImg, &jpeg.Options{Quality: quality})
			if err != nil {
				continue
			}
			jpegBytes := rawJpegBuf.Bytes()

			// 1. Pipe to YouTube RTMP sink if active
			if isYouTubeLive {
				sink.PushFrame(jpegBytes)
			}

			// 2. Broadcast to local LAN viewers if active
			if hasLocalViewers {
				buf.Reset()
				s.frameID++
				_ = buf.WriteByte(0x11)
				_ = binary.Write(buf, binary.BigEndian, s.frameID)
				_ = binary.Write(buf, binary.BigEndian, uint16(finalImg.Bounds().Dx()))
				_ = binary.Write(buf, binary.BigEndian, uint16(finalImg.Bounds().Dy()))
				_, _ = buf.Write(jpegBytes)

				s.broadcaster.BroadcastFrame(buf.Bytes())
			}
		}
	}
}
