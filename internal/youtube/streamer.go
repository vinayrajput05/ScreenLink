package youtube

import (
	"fmt"
	"io"
	"os/exec"
	"strings"
	"sync"
	"time"
)

type StreamStatus string

const (
	StatusOffline    StreamStatus = "offline"
	StatusConnecting StreamStatus = "connecting"
	StatusLive       StreamStatus = "live"
	StatusError      StreamStatus = "error"
)

type YouTubeStatusDTO struct {
	Status        StreamStatus `json:"status"`
	IsLive        bool         `json:"isLive"`
	UptimeSeconds int          `json:"uptimeSeconds"`
	ErrorMessage  string       `json:"errorMessage,omitempty"`
	RtmpURL       string       `json:"rtmpUrl"`
}

type YouTubeStreamer struct {
	cmd          *exec.Cmd
	stdin        io.WriteCloser
	streamKey    string
	rtmpURL      string
	status       StreamStatus
	errorMessage string
	startTime    time.Time
	mu           sync.Mutex
	stopChan     chan struct{}
}

func NewYouTubeStreamer() *YouTubeStreamer {
	return &YouTubeStreamer{
		status:  StatusOffline,
		rtmpURL: "rtmp://a.rtmp.youtube.com/live2",
	}
}

// CheckFFmpegInstalled verifies if ffmpeg binary is available in PATH
func CheckFFmpegInstalled() bool {
	paths := []string{"ffmpeg", "/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg", "/usr/bin/ffmpeg"}
	for _, p := range paths {
		if _, err := exec.LookPath(p); err == nil {
			return true
		}
	}
	return false
}

func getFFmpegPath() string {
	paths := []string{"/opt/homebrew/bin/ffmpeg", "ffmpeg", "/usr/local/bin/ffmpeg", "/usr/bin/ffmpeg"}
	for _, p := range paths {
		if _, err := exec.LookPath(p); err == nil {
			return p
		}
	}
	return "ffmpeg"
}

// Start launches FFmpeg process connected to YouTube Live RTMP ingest
func (y *YouTubeStreamer) Start(streamKey string, rtmpServer string, fps int) error {
	y.mu.Lock()
	defer y.mu.Unlock()

	if y.status == StatusLive || y.status == StatusConnecting {
		return nil
	}

	streamKey = strings.TrimSpace(streamKey)
	if streamKey == "" {
		y.status = StatusError
		y.errorMessage = "Stream key cannot be empty. Get it from YouTube Studio."
		return fmt.Errorf("%s", y.errorMessage)
	}

	if rtmpServer == "" {
		rtmpServer = "rtmp://a.rtmp.youtube.com/live2"
	}
	// Clean trailing slash
	rtmpServer = strings.TrimSuffix(rtmpServer, "/")
	targetRTMP := fmt.Sprintf("%s/%s", rtmpServer, streamKey)

	if fps <= 0 {
		fps = 20
	}

	ffmpegBin := getFFmpegPath()

	// FFmpeg ingestion pipeline for YouTube Live
	// Inputs:
	//  1. image2pipe stdin (MJPEG frames from screen capture)
	//  2. anullsrc (Silent AAC audio track required by YouTube RTMP ingestion)
	// Output: FLV over RTMP
	args := []string{
		"-y",
		"-f", "image2pipe",
		"-vcodec", "mjpeg",
		"-r", fmt.Sprintf("%d", fps),
		"-i", "-",
		"-f", "lavfi",
		"-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
		"-c:v", "libx264",
		"-preset", "veryfast",
		"-tune", "zerolatency",
		"-pix_fmt", "yuv420p",
		"-g", fmt.Sprintf("%d", fps*2),
		"-b:v", "2800k",
		"-maxrate", "3200k",
		"-bufsize", "6000k",
		"-c:a", "aac",
		"-b:a", "128k",
		"-ar", "44100",
		"-f", "flv",
		targetRTMP,
	}

	cmd := exec.Command(ffmpegBin, args...)
	stdin, err := cmd.StdinPipe()
	if err != nil {
		y.status = StatusError
		y.errorMessage = fmt.Sprintf("Failed to open FFmpeg pipe: %v", err)
		return err
	}

	y.cmd = cmd
	y.stdin = stdin
	y.streamKey = streamKey
	y.rtmpURL = rtmpServer
	y.status = StatusConnecting
	y.errorMessage = ""
	y.startTime = time.Now()
	y.stopChan = make(chan struct{})

	if err := cmd.Start(); err != nil {
		y.status = StatusError
		y.errorMessage = fmt.Sprintf("Failed to start FFmpeg: %v. Ensure FFmpeg is installed.", err)
		_ = stdin.Close()
		return err
	}

	// Transition to Live after small startup buffer
	go func() {
		time.Sleep(1500 * time.Millisecond)
		y.mu.Lock()
		if y.status == StatusConnecting {
			y.status = StatusLive
		}
		y.mu.Unlock()
	}()

	// Monitor FFmpeg process exit
	go func() {
		err := cmd.Wait()
		y.mu.Lock()
		defer y.mu.Unlock()
		if y.status == StatusLive || y.status == StatusConnecting {
			y.status = StatusOffline
			if err != nil {
				y.errorMessage = fmt.Sprintf("Stream ended: %v", err)
			}
		}
	}()

	return nil
}

// PushFrame sends an encoded JPEG frame into FFmpeg's image2pipe stdin
func (y *YouTubeStreamer) PushFrame(jpegData []byte) {
	y.mu.Lock()
	defer y.mu.Unlock()

	if (y.status != StatusLive && y.status != StatusConnecting) || y.stdin == nil {
		return
	}

	_, _ = y.stdin.Write(jpegData)
}

// Stop terminates the FFmpeg live stream cleanly
func (y *YouTubeStreamer) Stop() error {
	y.mu.Lock()
	defer y.mu.Unlock()

	if y.status == StatusOffline {
		return nil
	}

	y.status = StatusOffline
	if y.stdin != nil {
		_ = y.stdin.Close()
		y.stdin = nil
	}

	if y.cmd != nil && y.cmd.Process != nil {
		_ = y.cmd.Process.Kill()
		y.cmd = nil
	}

	return nil
}

// IsLive returns true if currently streaming to YouTube
func (y *YouTubeStreamer) IsLive() bool {
	y.mu.Lock()
	defer y.mu.Unlock()
	return y.status == StatusLive || y.status == StatusConnecting
}

// GetStatus returns the current live stream status payload
func (y *YouTubeStreamer) GetStatus() YouTubeStatusDTO {
	y.mu.Lock()
	defer y.mu.Unlock()

	uptime := 0
	if y.status == StatusLive && !y.startTime.IsZero() {
		uptime = int(time.Since(y.startTime).Seconds())
	}

	return YouTubeStatusDTO{
		Status:        y.status,
		IsLive:        y.status == StatusLive,
		UptimeSeconds: uptime,
		ErrorMessage:  y.errorMessage,
		RtmpURL:       y.rtmpURL,
	}
}
