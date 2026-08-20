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

type Streamer struct {
	displayIndex int
	targetFPS    int
	jpegQuality  int
	broadcaster  FrameBroadcaster
	cancel       context.CancelFunc
	mu           sync.Mutex
	isRunning    bool
	frameID      uint64
}

func NewStreamer(broadcaster FrameBroadcaster) *Streamer {
	return &Streamer{
		displayIndex: 0,
		targetFPS:    18,
		jpegQuality:  65,
		broadcaster:  broadcaster,
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
	ticker := time.NewTicker(time.Duration(1000/s.targetFPS) * time.Millisecond)
	defer ticker.Stop()

	buf := new(bytes.Buffer)

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			// If no approved viewers connected, idle sleep to save CPU (PRD Section 64)
			if s.broadcaster == nil || !s.broadcaster.HasApprovedViewers() {
				time.Sleep(100 * time.Millisecond)
				continue
			}

			s.mu.Lock()
			idx := s.displayIndex
			quality := s.jpegQuality
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

			buf.Reset()
			// Binary Protocol header:
			// Byte 0: 0x11 (FULL_FRAME)
			// Bytes 1-8: FrameID uint64 BigEndian
			// Bytes 9-10: Width uint16 BigEndian
			// Bytes 11-12: Height uint16 BigEndian
			// Bytes 13+: JPEG payload
			s.frameID++
			_ = buf.WriteByte(0x11)
			_ = binary.Write(buf, binary.BigEndian, s.frameID)
			_ = binary.Write(buf, binary.BigEndian, uint16(img.Bounds().Dx()))
			_ = binary.Write(buf, binary.BigEndian, uint16(img.Bounds().Dy()))

			err = jpeg.Encode(buf, img, &jpeg.Options{Quality: quality})
			if err != nil {
				continue
			}

			// Broadcast frame to approved viewers
			s.broadcaster.BroadcastFrame(buf.Bytes())
		}
	}
}
