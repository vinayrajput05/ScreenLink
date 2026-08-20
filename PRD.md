# Product Requirements Document

## Product Name

**LANMirror**

Working name. The product name can be changed later.

## Version

**MVP 1.0**

## Product Type

Local-network screen-sharing software.

## Primary Platforms

* Host: Windows 10/11
* Viewer: Modern web browser
* macOS host support: Future version
* Linux host support: Future version

---

# 1. Product Summary

LANMirror is a lightweight local-network screen-sharing application.

Only the **host computer installs the LANMirror desktop application**.

Other users do not need to install any client software.

A viewer connects using a web browser by opening the host's local IP address.

Example:

```text
http://192.168.1.10:8080
```

The viewer sends an access request.

The host receives the request and must explicitly:

* Approve
* Reject

Only approved viewers can see the host's screen.

The software is intended primarily for:

* Classrooms
* Computer labs
* Training sessions
* Coding demonstrations
* Office presentations
* LAN-based screen monitoring
* Local presentations

The MVP is strictly **view-only**.

Viewers cannot control the host computer.

---

# 2. Product Vision

LANMirror should provide a simple experience:

```text
Host installs LANMirror
        ↓
Starts screen sharing
        ↓
LANMirror displays local URL
        ↓
Viewer opens URL in browser
        ↓
Viewer requests access
        ↓
Host approves
        ↓
Viewer sees host screen
```

The product should avoid unnecessary complexity such as:

* Cloud servers
* User accounts
* Internet dependency
* WebRTC
* STUN
* TURN
* Client installation
* Remote desktop permissions
* Third-party streaming platforms

---

# 3. Primary Product Goals

LANMirror should be:

* Lightweight
* Fast
* LAN-first
* Easy to install
* Easy to connect
* View-only by default
* Secure through host approval
* Capable of supporting multiple viewers
* Independent of internet access
* Efficient when screen content is mostly static
* Simple enough for non-technical users

---

# 4. Non-Goals for MVP

The following features are explicitly outside the MVP:

* Remote mouse control
* Remote keyboard control
* File transfer
* Clipboard sync
* Audio sharing
* Microphone sharing
* Webcam sharing
* Screen recording
* Internet-based remote access
* Cloud relay servers
* User accounts
* Cloud database
* Video calls
* Viewer-to-host chat
* WebRTC
* STUN
* TURN
* Browser extension
* Mobile application
* Remote shell
* Remote command execution

These features must not be implemented unless requested in a future version.

---

# 5. Main User Roles

## 5.1 Host

The host is the computer whose screen is being shared.

The host:

* Installs LANMirror
* Starts the local server
* Chooses the display to share
* Receives viewer requests
* Approves viewers
* Rejects viewers
* Disconnects viewers
* Sends announcements
* Stops screen sharing

---

# 5.2 Viewer

The viewer does not install LANMirror.

The viewer:

* Connects to the same Wi-Fi/LAN
* Opens the host URL in a browser
* Enters a display name
* Requests access
* Waits for host approval
* Views the host screen after approval
* Can enter fullscreen
* Can disconnect

The viewer cannot:

* Send messages
* Move the host mouse
* Type on the host
* Access host files
* Run commands
* Control applications

---

# 6. Core User Journey

## Host Journey

1. Host launches LANMirror.
2. Host sees the main dashboard.
3. LANMirror detects available displays.
4. Host selects a display.
5. Host clicks:

```text
Start Sharing
```

6. LANMirror starts the local HTTP/WebSocket server.
7. LANMirror determines the host's LAN IP address.
8. LANMirror displays:

```text
Screen Sharing Active

http://192.168.1.10:8080

[ Copy Link ]
[ Show QR Code ]
```

9. A viewer opens the URL.
10. The viewer sends an access request.
11. LANMirror displays the request.

Example:

```text
New Connection Request

Name:
Student Laptop

IP:
192.168.1.25

Browser:
Chrome

[ Approve ] [ Reject ]
```

12. Host approves the request.
13. Viewer starts receiving screen updates.
14. Host can disconnect that viewer at any time.
15. Host can stop sharing for everyone.

---

# 7. Browser Viewer Journey

The viewer opens:

```text
http://192.168.1.10:8080
```

The browser displays:

```text
LANMirror

Connect to Shared Screen

Your Name / Device Name

[ Student Laptop               ]

[ Request Access ]
```

The viewer clicks:

```text
Request Access
```

The browser sends a connection request.

The viewer then sees:

```text
Waiting for approval...

The host must approve your request
before you can view the screen.

[ Cancel ]
```

If approved:

```text
Access Approved

Connecting to screen...
```

The screen viewer opens.

If rejected:

```text
Access Rejected

The host rejected your request.

[ Try Again ]
```

---

# 8. High-Level Architecture

```text
                    HOST COMPUTER

┌─────────────────────────────────────────┐
│ LANMirror                               │
│                                         │
│ Wails + React                           │
│        │                                │
│        ▼                                │
│       Go                                │
│                                         │
│ ┌─────────────┐  ┌───────────────────┐ │
│ │Screen       │  │Approval Manager   │ │
│ │Capture      │  │                   │ │
│ └──────┬──────┘  └────────┬──────────┘ │
│        │                  │             │
│        ▼                  │             │
│ Framebuffer               │             │
│        │                  │             │
│        ▼                  │             │
│ Dirty Rectangles          │             │
│        │                  │             │
│        ▼                  │             │
│ Compression               │             │
│        │                  │             │
│        └──────────┬───────┘             │
│                   ▼                     │
│           HTTP + WebSocket              │
└───────────────────┬─────────────────────┘
                    │
                 LAN/Wi-Fi
                    │
       ┌────────────┼────────────┐
       ▼            ▼            ▼
    Browser      Browser      Browser
    Viewer 1     Viewer 2     Viewer 3
```

---

# 9. Recommended Technology Stack

## Host Application

* Go
* Wails
* React
* TypeScript
* Tailwind CSS

## Networking

* Go `net/http`
* WebSocket
* Binary WebSocket messages
* Local TCP/IP networking

## Screen Capture

### Windows

Use:

```text
DXGI Desktop Duplication API
```

### macOS Later

Use:

```text
ScreenCaptureKit
```

### Linux Later

Use:

```text
PipeWire
```

with an optional X11 fallback where appropriate.

## Viewer

* React
* TypeScript
* Tailwind CSS
* HTML Canvas
* WebSocket API
* Fullscreen API

## Packaging

* Wails

---

# 10. Why Go

Go should handle:

* Local HTTP server
* WebSocket connections
* Screen processing
* Client approval state
* Viewer management
* Broadcasting
* Compression
* Heartbeats
* Connection cleanup
* Concurrency

Go is suitable because goroutines make it straightforward to manage many connected viewers without blocking the screen capture pipeline.

---

# 11. Why Wails

Wails allows the project to use:

```text
React UI
+
Go backend
```

inside a desktop application.

This avoids requiring:

* Electron
* Node.js runtime
* Separate backend executable

The Go application should also embed the browser viewer frontend into the final host executable.

---

# 12. Server Start Behavior

When the host clicks:

```text
Start Sharing
```

LANMirror should:

1. Validate selected monitor.
2. Start the screen capture subsystem.
3. Start the local HTTP server.
4. Start WebSocket handling.
5. Determine accessible LAN IPv4 addresses.
6. Display the preferred local URL.
7. Start viewer request handling.
8. Set status to:

```text
Running
```

Example:

```text
Status: Running
IP: 192.168.1.10
Port: 8080
Viewers: 0
```

---

# 13. Server Stop Behavior

When the host clicks:

```text
Stop Sharing
```

LANMirror should:

1. Stop accepting new viewers.
2. Notify connected viewers.
3. Close WebSocket sessions.
4. Stop screen capture.
5. Close the HTTP server.
6. Clear pending requests.
7. Clear connected client state.
8. Set status to:

```text
Stopped
```

Viewer should receive:

```text
Screen sharing has ended.
```

and return to the connection state.

---

# 14. HTTP Server

Default port:

```text
8080
```

The Go server should expose:

```text
GET /
```

Viewer web application.

```text
GET /assets/*
```

Frontend assets.

```text
GET /health
```

Basic server health status.

```text
GET /ws
```

WebSocket upgrade endpoint.

Example:

```text
http://192.168.1.10:8080/
```

---

# 15. Embedded Viewer Application

The built React viewer should be embedded inside the Go executable.

Use Go embedding where appropriate:

```go
//go:embed viewer-dist/*
```

The host should not require:

* Node.js
* npm
* Separate web server
* External frontend hosting

after the production application has been built.

---

# 16. Viewer Connection Request

A browser connection should not immediately receive screen content.

The viewer first establishes a WebSocket connection.

It then sends:

```json
{
  "type": "connection_request",
  "client_id": "uuid",
  "display_name": "Student Laptop"
}
```

The Go server determines:

* Remote IP
* User agent
* Connection time

The client state becomes:

```text
PENDING
```

---

# 17. Client State Model

Use states similar to:

```go
type ClientState int

const (
    ClientPending ClientState = iota
    ClientApproved
    ClientRejected
    ClientConnected
    ClientDisconnected
)
```

Valid transition:

```text
New Connection
      ↓
Pending
   ↙      ↘
Approved Rejected
   ↓
Connected
   ↓
Disconnected
```

A rejected viewer must never transition directly into a screen session.

---

# 18. Approval Requirement

The host must approve each new client.

No framebuffer data may be transmitted to a pending viewer.

Pending viewers may receive only:

* Connection status
* Approval status
* Heartbeat
* Server error
* Rejection status

Only approved viewers may receive:

* Framebuffer updates
* Cursor updates
* Host messages
* Screen resize events

---

# 19. Host Pending Request UI

Example:

```text
Pending Requests

Student Laptop
192.168.1.25
Chrome

[ Approve ] [ Reject ]

Office-PC
192.168.1.28
Edge

[ Approve ] [ Reject ]

[ Approve All ]
```

Host should be able to approve multiple pending clients.

---

# 20. Connected Viewer UI

Example:

```text
Connected Viewers                     3

Student Laptop
192.168.1.25
Connected 4 min ago
[ Disconnect ]

Office-PC
192.168.1.28
Connected 2 min ago
[ Disconnect ]

Lab-PC-03
192.168.1.31
Connected 1 min ago
[ Disconnect ]

[ Disconnect All ]
```

---

# 21. Browser Client Identity

Generate a browser client UUID:

```javascript
crypto.randomUUID()
```

Store it in:

```text
localStorage
```

Key:

```text
lanmirror_client_id
```

Example:

```text
87fe9055-7204-49b7-a420-e2abb29f3211
```

The IP address must not be used as the primary identity.

IP addresses may change.

---

# 22. Display Name

The viewer should provide a readable display name.

Example:

```text
Student Laptop
```

The browser may provide a suggested default.

Do not depend on browser APIs to obtain the actual operating-system hostname because normal websites generally cannot access it reliably.

---

# 23. WebSocket Protocol

Use WebSocket for:

* Connection request
* Approval status
* Screen updates
* Cursor updates
* Host messages
* Heartbeats
* Screen resize events
* Disconnect notifications

Control messages may initially use JSON.

Framebuffer messages should use binary messages.

---

# 24. Suggested Protocol Types

```text
0x01 CLIENT_HELLO
0x02 REQUEST_PENDING
0x03 REQUEST_APPROVED
0x04 REQUEST_REJECTED
0x05 SESSION_STARTED
0x10 FRAMEBUFFER_UPDATE
0x11 FULL_FRAME
0x12 CURSOR_UPDATE
0x13 SCREEN_RESIZE
0x20 HOST_MESSAGE
0x30 PING
0x31 PONG
0x32 DISCONNECT
0x33 SERVER_STOPPED
0x40 ERROR
```

---

# 25. Binary Message Header

Suggested concept:

```go
type MessageHeader struct {
    Version       uint8
    MessageType   uint8
    Flags         uint16
    PayloadLength uint32
}
```

Network byte order should be explicitly defined.

The protocol should also define a version number from the beginning.

Example:

```text
Protocol Version: 1
```

---

# 26. Framebuffer Architecture

LANMirror should treat the screen as a remote framebuffer.

Do not architect the MVP as ordinary video streaming.

Concept:

```text
Host Screen
    ↓
Capture
    ↓
Framebuffer
    ↓
Identify changed regions
    ↓
Encode rectangles
    ↓
Broadcast
    ↓
Canvas
```

---

# 27. Full Frame

A full framebuffer update is useful:

* Immediately after approval
* After browser reconnect
* After resolution changes
* After decoder state recovery

Example metadata:

```text
Screen Width
Screen Height
Pixel Format
Payload
```

The viewer requires a complete initial framebuffer before applying incremental updates.

---

# 28. Dirty Rectangles

After the first full frame, send only changed regions when possible.

Example:

```text
1920 × 1080 desktop

Only this rectangle changed:

X: 480
Y: 220
Width: 420
Height: 90
```

Only that region should be transmitted.

Suggested Go structure:

```go
type Rectangle struct {
    X      int
    Y      int
    Width  int
    Height int
    Pixels []byte
}
```

---

# 29. Framebuffer Update

One update may contain multiple rectangles.

Example:

```go
type FramebufferUpdate struct {
    FrameID    uint64
    Rectangles []Rectangle
}
```

This allows:

```text
Cursor-adjacent change
+
Text change
+
Window animation
```

to be sent as separate regions.

---

# 30. Capture Strategy

The screen must be captured once.

Do not capture independently for each viewer.

Incorrect:

```text
Viewer 1 → capture
Viewer 2 → capture
Viewer 3 → capture
```

Correct:

```text
               Capture Screen
                    ↓
                One Frame
                    ↓
            Process / Encode
                    ↓
              Broadcaster
          ↙         ↓         ↘
      Viewer 1   Viewer 2   Viewer 3
```

---

# 31. Windows Screen Capture

MVP host platform:

```text
Windows 10/11
```

Preferred API:

```text
DXGI Desktop Duplication
```

The capture implementation should obtain where possible:

* Screen pixels
* Dirty rectangles
* Move rectangles
* Cursor position
* Cursor visibility
* Cursor shape
* Display dimensions

Create a platform abstraction around capture.

---

# 32. Screen Capture Interface

Example:

```go
type ScreenCapturer interface {
    Displays() ([]Display, error)
    Start(displayID string) error
    NextFrame(ctx context.Context) (*Frame, error)
    Stop() error
}
```

Frame:

```go
type Frame struct {
    Width      int
    Height     int
    Pixels     []byte
    DirtyRects []Rectangle
    Timestamp  time.Time
}
```

---

# 33. Multi-Monitor

The host must be able to select one display.

Example:

```text
Display 1
1920 × 1080

Display 2
2560 × 1440
```

Host UI:

```text
Screen to Share

[ Display 1 ▼ ]
```

MVP does not need to share multiple displays simultaneously.

---

# 34. Screen Resolution Changes

If the host:

* Changes resolution
* Rotates display
* Disconnects monitor
* Switches monitor

LANMirror must send:

```text
SCREEN_RESIZE
```

The client should rebuild its framebuffer appropriately.

---

# 35. Encoding Strategy

Development should occur incrementally.

## Stage 1

Use raw framebuffer data for correctness testing.

## Stage 2

Add compressed rectangle payloads.

Recommended initial compression:

```text
zlib
```

## Stage 3

Add more efficient mechanisms such as:

* CopyRect-style updates
* Better rectangle selection
* Optional WebP encoding for specific high-change areas

Do not begin with complex compression before basic streaming works correctly.

---

# 36. Pixel Format

Internally use one predictable format.

Recommended:

```text
RGBA8888
```

or:

```text
BGRA8888
```

depending on capture efficiency.

Convert only when necessary.

The protocol must explicitly define pixel format.

---

# 37. Browser Rendering

Viewer should use:

```html
<canvas></canvas>
```

The remote desktop should be represented as a persistent framebuffer.

Flow:

```text
Binary WebSocket Message
        ↓
Protocol Decoder
        ↓
Rectangle Decoder
        ↓
Framebuffer
        ↓
Canvas Update
```

Do not recreate the entire canvas for every dirty rectangle.

---

# 38. Viewer Canvas Scaling

Canvas backing dimensions should match the host screen.

Example:

```text
canvas.width = 1920
canvas.height = 1080
```

CSS may visually scale it to fit the browser.

Example:

```text
Host: 1920 × 1080
Viewer: 1366 × 768
```

Maintain aspect ratio.

Do not request different framebuffer resolutions for each viewer in MVP.

---

# 39. Viewer Screen Modes

Viewer should support:

* Fit to window
* Fullscreen
* Actual size if practical

Default:

```text
Fit to Window
```

Primary button:

```text
[ Full Screen ]
```

---

# 40. Cursor Handling

Host cursor must be visible.

Preferred approach:

Transmit cursor separately when supported.

Cursor messages may include:

```text
X
Y
Visible
Shape ID
Hotspot X
Hotspot Y
```

This avoids forcing framebuffer updates only because the mouse moved.

If separate cursor handling is too complex for the first milestone, cursor may temporarily be included in capture output.

---

# 41. Broadcast Manager

Create a central broadcaster.

Example:

```go
type Broadcaster struct {
    clients map[string]*Client
}
```

It receives encoded screen updates and distributes them to approved viewers.

---

# 42. Per-Client Writer Queue

Every approved viewer should have a separate outbound queue.

Example:

```go
type Client struct {
    ID          string
    DisplayName string
    IP          string
    State       ClientState
    SendQueue   chan []byte
}
```

One slow browser must not block:

* Screen capture
* Encoding
* Other viewers

---

# 43. Backpressure

Screen sharing prioritizes current screen state.

Do not build unlimited queues.

If a client falls behind:

```text
Frame 100
Frame 101
Frame 102
Frame 103
Frame 104
```

It may be better to discard obsolete intermediate screen updates and provide a newer framebuffer state.

Possible strategy:

```text
Queue full
   ↓
Drop stale incremental updates
   ↓
Request/send latest full frame
```

Correct synchronization is more important than delivering every historical frame.

---

# 44. Slow Viewer Recovery

If the client loses synchronization:

Server should be able to send:

```text
FULL_FRAME
```

to restore the browser framebuffer.

Examples of recovery triggers:

* Client reconnect
* Frame sequence gap
* Decoder error
* Queue overflow
* Resolution change

---

# 45. Frame IDs

Assign each framebuffer update a monotonically increasing ID.

Example:

```text
101
102
103
104
```

This allows clients to detect missing incremental updates.

---

# 46. Viewer Reconnection

If the WebSocket connection drops:

Viewer displays:

```text
Connection lost.

Trying to reconnect...
```

The browser should retry with backoff.

Example:

```text
1 second
2 seconds
4 seconds
5 seconds
5 seconds
```

with a sensible maximum.

After reconnect, default behavior should require host approval again unless future trusted-device functionality is enabled.

---

# 47. Heartbeats

Use heartbeat messages.

Example:

```text
PING
↓
PONG
```

Suggested interval:

```text
5 seconds
```

A client that does not respond within a defined timeout should be disconnected.

---

# 48. Host Messages

Host should have a one-way announcement feature.

Host UI:

```text
Send Announcement

[ Open Chapter 5 and start Exercise 2 ]

[ Send ]
```

All approved viewers see:

```text
Host Message

Open Chapter 5 and start Exercise 2
```

Viewer has no reply input.

---

# 49. Host Message Requirements

Messages should:

* Support plain text
* Be limited in size
* Be safely rendered
* Never execute HTML
* Never execute JavaScript
* Never contain executable commands

Suggested maximum:

```text
1000 characters
```

---

# 50. Host Main Dashboard

Suggested layout:

```text
┌───────────────────────────────────────────────────┐
│ LANMirror                                         │
├───────────────────────────────────────────────────┤
│                                                   │
│ Screen Sharing                                    │
│                                                   │
│ Status: ● Running                                 │
│                                                   │
│ Share URL                                         │
│ http://192.168.1.10:8080                          │
│                                                   │
│ [ Copy Link ] [ QR Code ]                         │
│                                                   │
│ Screen                                            │
│ [ Display 1 — 1920×1080 ▼ ]                       │
│                                                   │
│ [ Stop Sharing ]                                  │
├───────────────────────────────────────────────────┤
│ Pending Requests                                  │
│                                                   │
│ Student Laptop                                    │
│ 192.168.1.25                                      │
│ Chrome                                            │
│                                                   │
│ [ Approve ] [ Reject ]                            │
│                                                   │
│ [ Approve All ]                                   │
├───────────────────────────────────────────────────┤
│ Connected Viewers                              3  │
│                                                   │
│ Student 01                        [ Disconnect ]   │
│ Student 02                        [ Disconnect ]   │
│ Student 03                        [ Disconnect ]   │
│                                                   │
│ [ Disconnect All ]                                │
├───────────────────────────────────────────────────┤
│ Announcement                                      │
│                                                   │
│ [_____________________________________________]    │
│                                        [ Send ]   │
└───────────────────────────────────────────────────┘
```

---

# 51. Viewer Landing Page

```text
┌────────────────────────────────────────┐
│               LANMirror                │
│                                        │
│          View Shared Screen            │
│                                        │
│ Your Name                              │
│                                        │
│ [ Student Laptop________________ ]     │
│                                        │
│        [ Request Access ]              │
└────────────────────────────────────────┘
```

---

# 52. Waiting Page

```text
┌────────────────────────────────────────┐
│                                        │
│         Waiting for approval           │
│                                        │
│                ● ● ●                   │
│                                        │
│ The host must approve your request.    │
│                                        │
│              [ Cancel ]                │
└────────────────────────────────────────┘
```

---

# 53. Viewer Screen

```text
┌──────────────────────────────────────────────────┐
│ LANMirror                         ● Connected    │
├──────────────────────────────────────────────────┤
│                                                  │
│                                                  │
│                                                  │
│                 SHARED SCREEN                    │
│                                                  │
│                                                  │
│                                                  │
├──────────────────────────────────────────────────┤
│ [ Fit ] [ Full Screen ]          [ Disconnect ] │
└──────────────────────────────────────────────────┘
```

---

# 54. Rejected Page

```text
Connection Rejected

The host rejected your access request.

[ Try Again ]
```

---

# 55. Host Shutdown Page

Browser displays:

```text
Screen Sharing Ended

The host stopped this sharing session.

[ Close ]
```

---

# 56. Error States

Viewer must handle:

* Server unreachable
* WebSocket failure
* Host rejection
* Host shutdown
* Wi-Fi disconnected
* Invalid protocol packet
* Session expired
* Browser unsupported
* Decode failure

Host must handle:

* Port already in use
* Capture permission failure
* Capture API failure
* Network interface changes
* Viewer disconnects
* WebSocket errors
* Encoding errors
* Monitor disconnect
* Invalid requests

---

# 57. LAN IP Detection

LANMirror should identify appropriate local IPv4 addresses.

Example:

```text
192.168.1.10
```

Avoid displaying loopback as the primary share address:

```text
127.0.0.1
```

If multiple network interfaces are available, show selectable URLs.

Example:

```text
Wi-Fi
192.168.1.10

Ethernet
10.0.0.18
```

---

# 58. QR Code

Host should be able to show a QR code containing:

```text
http://192.168.1.10:8080
```

This is especially useful for:

* Tablets
* Phones
* Laptops

QR code is convenience only and does not bypass host approval.

---

# 59. Security Model

The MVP security model is primarily based on:

```text
Local network
+
Explicit host approval
```

However, approval alone is not sufficient for future hardened releases.

The protocol should be designed to allow stronger authentication later.

---

# 60. Security Requirements

The application must:

* Require approval before sharing screen content
* Reject malformed protocol messages
* Limit maximum message size
* Use safe parsing
* Never evaluate client input
* Never execute browser-supplied commands
* Apply connection limits
* Use bounded queues
* Rate-limit repeated access requests
* Prevent unlimited memory allocation
* Safely close broken sessions
* Escape user-provided names in UI
* Prevent XSS in host announcements
* Restrict viewer actions to view-only functionality

---

# 61. Future Security Features

Future releases may add:

* Session PIN
* HTTPS/TLS
* Trusted devices
* Blocked devices
* Expiring access tokens
* Signed session tokens
* Host password
* Auto-approve trusted devices

Default behavior should remain explicit approval.

---

# 62. Maximum Viewers

Initial MVP target:

```text
10 simultaneous viewers
```

The system architecture should not intentionally prevent scaling higher.

Future optimization target:

```text
25–50 viewers
```

on suitable hardware and network conditions.

---

# 63. Performance Targets

## Startup

Host local server should normally start within a few seconds.

## Access Request

A LAN viewer request should appear quickly in the host UI.

## Screen Updates

Target interactive update frequency:

```text
10–20 updates/sec
```

when the desktop is changing.

Do not send updates at a fixed high frame rate when nothing changes.

---

# 64. Idle Performance

When the screen remains unchanged:

```text
Network framebuffer traffic should drop dramatically.
```

Only lightweight traffic such as heartbeats should remain.

This is an important design goal.

---

# 65. CPU Goals

Capture and encoding must not unnecessarily consume a full CPU core when the desktop is idle.

Avoid:

```text
Capture full screenshot
30 times/sec
compare every pixel
send every image
```

when the operating system can provide change information more efficiently.

---

# 66. Memory Goals

Use reusable buffers where practical.

Avoid:

* Unbounded channels
* Unbounded viewer queues
* Retaining old frames
* Per-viewer screen captures
* Excessive byte-slice copying

---

# 67. Concurrency Model

Suggested Go runtime structure:

```text
Application
    │
    ├── HTTP Server
    │
    ├── WebSocket Manager
    │
    ├── Approval Manager
    │
    ├── Capture Goroutine
    │
    ├── Encoder Goroutine
    │
    ├── Broadcast Manager
    │
    └── Per Viewer
          ├── Reader
          └── Writer
```

Use:

```text
context.Context
```

for cancellation and lifecycle control.

---

# 68. Suggested Go Packages

```text
internal/capture
internal/framebuffer
internal/encoding
internal/protocol
internal/server
internal/websocket
internal/approval
internal/client
internal/broadcast
internal/network
internal/messaging
internal/session
internal/logging
```

---

# 69. Suggested Repository Structure

```text
lanmirror/
│
├── cmd/
│   └── lanmirror/
│       └── main.go
│
├── internal/
│   │
│   ├── capture/
│   │   ├── capture.go
│   │   ├── windows.go
│   │   ├── darwin.go
│   │   └── linux.go
│   │
│   ├── framebuffer/
│   │   ├── frame.go
│   │   ├── rectangle.go
│   │   └── diff.go
│   │
│   ├── encoding/
│   │   ├── raw.go
│   │   └── zlib.go
│   │
│   ├── protocol/
│   │   ├── header.go
│   │   ├── messages.go
│   │   ├── encode.go
│   │   └── decode.go
│   │
│   ├── server/
│   │   ├── http.go
│   │   └── websocket.go
│   │
│   ├── clients/
│   │   ├── client.go
│   │   ├── manager.go
│   │   └── state.go
│   │
│   ├── approval/
│   │   └── manager.go
│   │
│   ├── broadcast/
│   │   └── broadcaster.go
│   │
│   ├── messaging/
│   │   └── messages.go
│   │
│   └── network/
│       └── interfaces.go
│
├── host-ui/
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── hooks/
│       └── stores/
│
├── viewer-web/
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── protocol/
│       ├── renderer/
│       ├── websocket/
│       └── stores/
│
├── tests/
│
├── go.mod
├── wails.json
└── README.md
```

---

# 70. Logging

Use structured logs.

Example:

```text
INFO server_started addr=192.168.1.10:8080

INFO client_pending
client_id=abc123
ip=192.168.1.25

INFO client_approved
client_id=abc123

INFO client_connected
client_id=abc123

INFO client_disconnected
client_id=abc123
reason=socket_closed
```

Do not log:

* Framebuffer pixel data
* Sensitive screen contents
* Full protocol payloads containing framebuffer bytes

---

# 71. Settings

MVP settings:

```text
Port

Default Display

Automatically Start Sharing:
OFF

Maximum Viewers

Show Cursor:
ON
```

Future settings:

```text
Require PIN

Trusted Devices

Blocked Devices

Compression Level

Image Quality

TLS

Auto-Approve Trusted Devices
```

---

# 72. View-Only Guarantee

No viewer-to-host input channel should exist for:

* Keyboard
* Mouse
* Clipboard
* Commands

Even if the browser sends unexpected messages attempting such actions, the server must ignore or reject them.

---

# 73. Viewer Chat Restriction

There must be no:

```text
Send Message
```

interface on the viewer.

If a browser manually sends a forged chat message through developer tools, the Go backend must reject it.

Host messaging permissions must be enforced on the backend, not only the frontend.

---

# 74. Browser Requirements

MVP should support recent versions of:

* Chrome
* Edge
* Firefox

Safari can be supported where compatible but should not block MVP completion.

Browser feature requirements:

* WebSocket
* Canvas
* Typed arrays
* Blob/ArrayBuffer
* Fullscreen API where available

---

# 75. Accessibility

Basic accessibility requirements:

* Keyboard-accessible host controls
* Clear button labels
* Visible connection status
* Good text contrast
* Error messages that do not rely only on color
* Viewer can leave fullscreen without special instructions

---

# 76. Responsive Viewer UI

The viewer web interface should work on:

* Desktop
* Laptop
* Tablet
* Mobile browser

The shared desktop may be difficult to inspect on a phone, but the UI should still function.

---

# 77. Host UI Design Direction

Visual style:

* Modern
* Minimal
* Professional
* Clean
* Technical but approachable

Use clear states:

```text
Stopped
Starting
Running
Error
```

and client states:

```text
Pending
Connected
Disconnected
Rejected
```

---

# 78. Testing Strategy

## Unit Tests

Create tests for:

* Protocol encoding
* Protocol decoding
* Invalid packets
* Message length validation
* Client state transitions
* Approval logic
* Rejection logic
* Broadcaster
* Viewer queue behavior
* Heartbeat timeout
* Connection cleanup
* Frame sequence behavior

---

# 79. Integration Tests

Simulate:

```text
1 Host
+
10 Browser Clients
```

Verify:

* Ten simultaneous requests
* Approve one client
* Reject one client
* Approve all
* Disconnect client
* Disconnect all
* Stop server
* Reconnect browser
* Send host announcement
* Slow viewer
* Abrupt viewer disconnect

---

# 80. Screen Streaming Tests

Verify:

* Initial full frame displays correctly
* Dirty rectangle updates correctly
* Window movement displays correctly
* Typing appears correctly
* Mouse cursor appears correctly
* Resolution changes work
* Full frame recovery works
* Missing update recovery works
* Multiple viewers receive equivalent screen state

---

# 81. Network Tests

Test on:

* Wi-Fi
* Ethernet
* Wi-Fi host + Ethernet viewer
* Multiple local subnets where routing permits
* Temporary Wi-Fi interruption

Do not assume internet connectivity.

---

# 82. Failure Recovery

One failed viewer must never crash the host server.

One failed decoder must not affect other browsers.

One slow connection must not block capture.

A capture subsystem failure should:

1. Stop streaming safely.
2. Show the host an error.
3. Notify connected viewers.
4. Allow restart where possible.

---

# 83. MVP Acceptance Criteria

MVP is complete when all of the following work:

* [ ] Host application installs and launches.
* [ ] Host can select a display.
* [ ] Host can start sharing.
* [ ] Local share URL is displayed.
* [ ] Viewer can open the URL in a supported browser.
* [ ] No viewer installation is required.
* [ ] Viewer can enter a name.
* [ ] Viewer can request access.
* [ ] Viewer waits for approval.
* [ ] Host sees pending requests.
* [ ] Host can approve a viewer.
* [ ] Host can reject a viewer.
* [ ] Rejected viewer receives rejection state.
* [ ] Pending viewers receive no framebuffer data.
* [ ] Approved viewer receives initial full framebuffer.
* [ ] Incremental screen updates work.
* [ ] Host cursor is visible.
* [ ] Canvas scales correctly.
* [ ] Fullscreen works.
* [ ] At least 10 viewers can connect.
* [ ] One slow viewer does not freeze other viewers.
* [ ] Host can disconnect individual viewers.
* [ ] Host can disconnect all viewers.
* [ ] Host can send announcements.
* [ ] Viewers cannot send announcements.
* [ ] Viewers cannot control mouse.
* [ ] Viewers cannot control keyboard.
* [ ] Host can stop sharing.
* [ ] Browser receives end-of-session status.
* [ ] Application works without internet.
* [ ] No WebRTC is used.

---

# 84. Development Roadmap

## Phase 1 — Foundation

Create:

* Go project
* Wails project
* React
* TypeScript
* Tailwind CSS

Create host application shell.

Do not implement streaming yet.

---

# 85. Phase 2 — Host UI

Implement:

* Start Sharing
* Stop Sharing
* Display selection
* Status indicator
* Share URL area
* Pending request section
* Connected viewer section
* Announcement section

Use mock data initially.

---

# 86. Phase 3 — Local HTTP Server

Implement:

```text
Go HTTP Server
```

Serve:

```text
http://localhost:8080
```

Then verify access using:

```text
http://HOST-LAN-IP:8080
```

from another LAN device.

---

# 87. Phase 4 — Viewer Frontend

Build viewer pages:

* Request Access
* Waiting
* Rejected
* Viewer
* Disconnected

Embed the production build into the Go application.

---

# 88. Phase 5 — WebSocket Connection

Implement WebSocket endpoint.

Test:

```text
Browser
↓
WebSocket
↓
Go
```

Do not stream screen data yet.

---

# 89. Phase 6 — Approval Flow

Implement:

```text
Request Access
      ↓
Pending
      ↓
Host UI
      ↓
Approve / Reject
```

Test with multiple browsers.

This phase must be stable before implementing screen streaming.

---

# 90. Phase 7 — Screen Capture

Implement Windows screen capture.

Initially show a preview inside the host application or write controlled debug output.

Do not involve viewer clients until capture works reliably.

---

# 91. Phase 8 — Full Frame Streaming

After approval:

```text
Capture
↓
Full Frame
↓
Binary WebSocket
↓
Browser
↓
Canvas
```

Focus on correctness.

---

# 92. Phase 9 — Dirty Rectangle Updates

Implement incremental framebuffer updates.

Verify:

* Typing
* Cursor movement
* Scrolling
* Moving windows
* Opening menus

---

# 93. Phase 10 — Compression

Implement zlib or another chosen rectangle compression.

Measure:

* Bandwidth
* CPU
* Memory
* Update latency

Do not guess performance.

Benchmark it.

---

# 94. Phase 11 — Multi-Viewer Broadcasting

Implement:

```text
Capture Once
↓
Encode Once
↓
Broadcast
```

Add bounded per-client queues.

Test 10 clients.

---

# 95. Phase 12 — Reliability

Implement:

* Heartbeat
* Reconnection
* Full-frame resync
* Backpressure
* Queue overflow recovery
* Safe server shutdown
* Network error handling

---

# 96. Phase 13 — Host Announcements

Implement:

```text
Host
↓
Announcement
↓
All Approved Viewers
```

No viewer replies.

---

# 97. Phase 14 — UX Polish

Implement:

* QR code
* Copy URL
* Fullscreen
* Better loading states
* Helpful error messages
* Viewer count
* Approve All
* Disconnect All
* Improved responsive layout

---

# 98. Phase 15 — Production Packaging

Build a production Wails application.

Requirements:

* Viewer frontend embedded
* No Node.js runtime required
* No external server required
* All required host components packaged
* Installer generated
* Clean uninstall

---

# 99. Future Version 2

Potential features:

* macOS host
* Linux host
* Session PIN
* TLS
* Trusted devices
* Block list
* Auto-approve trusted clients
* Multiple monitors
* Better framebuffer encodings
* Hardware-accelerated processing
* mDNS discovery
* Custom URL such as `lanmirror.local`
* Session statistics
* Admin controls

---

# 100. Future Remote Control

Remote control must be considered a separate feature.

Future option:

```text
Allow Remote Control

OFF
```

Default:

```text
OFF
```

Remote control must never be silently enabled.

---

# 101. Product Success Metrics

Useful internal metrics for testing:

* Time from server start to usable share URL
* Time from request to host notification
* Approval-to-first-frame time
* Average screen update bandwidth
* Idle bandwidth
* CPU usage
* Memory usage
* Number of stable concurrent viewers
* Reconnect success rate
* Number of dropped/resynced frames

The application should not require cloud analytics for these measurements.

---

# 102. Antigravity Development Instructions

When using an AI coding agent such as Antigravity, build this project incrementally.

Do not ask the agent to generate the entire finished application in one pass.

For each phase:

1. Inspect the current repository.
2. Read this PRD.
3. Identify the current development phase.
4. Produce an implementation plan.
5. Implement only that phase.
6. Run formatter.
7. Compile Go code.
8. Compile frontend code.
9. Run tests.
10. Launch the application where possible.
11. Verify the feature.
12. Fix errors.
13. Preserve previously working functionality.
14. Summarize files changed.
15. State remaining work.

Do not continue into the next major phase when the current phase does not compile or function correctly.

---

# 103. AI Coding Rules

The coding agent must:

* Prefer simple architecture
* Avoid unnecessary dependencies
* Avoid global mutable state
* Use idiomatic Go
* Use `context.Context`
* Avoid goroutine leaks
* Properly close connections
* Use bounded channels
* Validate network messages
* Enforce maximum payload sizes
* Separate protocol code from UI code
* Separate capture from transport
* Keep host authorization server-side
* Keep viewer strictly view-only
* Write tests for core networking logic
* Keep frontend components small and reusable
* Use TypeScript strictly
* Avoid unsafe HTML rendering

---

# 104. First Antigravity Prompt

Use this after placing the PRD in the repository as:

```text
PRD.md
```

Prompt:

```text
Read PRD.md completely before making changes.

We are starting LANMirror MVP development.

Implement Phase 1 only.

Requirements:

1. Initialize the Go application.
2. Initialize Wails.
3. Configure React + TypeScript.
4. Configure Tailwind CSS.
5. Create a clean host desktop application shell.
6. Create the Host Dashboard layout using mock data.
7. Include:
   - Start Sharing button
   - Display selector
   - Server status
   - Share URL placeholder
   - Pending Requests placeholder
   - Connected Viewers placeholder
   - Host Announcement placeholder
8. Do not implement networking.
9. Do not implement WebSocket.
10. Do not implement screen capture.
11. Do not implement viewer streaming.
12. Run the application.
13. Run build checks.
14. Fix all build/runtime errors.
15. Summarize the files created or changed.

Do not start Phase 2.
```

---

# 105. Second Antigravity Prompt

After Phase 1 works:

```text
Read PRD.md again.

Implement the next development phase only.

Create the local Go HTTP server and browser viewer frontend.

Requirements:

1. Start a Go HTTP server when screen sharing is started.
2. Default to port 8080.
3. Serve the viewer React application.
4. Make the viewer accessible through the host LAN IP.
5. Create the Request Access page.
6. Do not implement WebSocket approval yet.
7. Do not implement screen streaming.
8. Verify access from another device on the same LAN.
9. Handle port-in-use errors.
10. Stop the HTTP server cleanly when sharing is stopped.
11. Add relevant tests.
12. Run all build checks.
13. Fix all errors.

Do not implement later phases.
```

---

# 106. Core Product Rule

Every development decision should preserve this experience:

```text
HOST

Install LANMirror
      ↓
Start Sharing
      ↓
Get Local URL


VIEWER

Open Browser
      ↓
Open Host URL
      ↓
Request Access


HOST

Approve
      ↓


VIEWER

View Screen
```

The viewer should never be forced to:

* Install software
* Create an account
* Sign in
* Configure WebRTC
* Use a cloud service

---

# 107. Final Technical Architecture

```text
                         HOST COMPUTER

┌──────────────────────────────────────────────┐
│                     LANMirror                        │
│                                                      │
│                    Wails Host UI                     │
│                         │                            │
│                         ▼                            │
│                         Go                           │
│                                                      │
│   ┌─────────────┐   ┌──────────────┐                │
│   │ Display     │   │ Client       │                │
│   │ Capture     │   │ Approval     │                │
│   └──────┬──────┘   └───────┬──────┘                │
│          │                  │                        │
│          ▼                  │                        │
│     Framebuffer             │                        │
│          │                  │                        │
│          ▼                  │                        │
│   Dirty Rectangles          │                        │
│          │                  │                        │
│          ▼                  │                        │
│       Encoder               │                        │
│          │                  │                        │
│          └─────────┬────────┘                        │
│                    ▼                                 │
│              Broadcaster                             │
│                    │                                 │
│             Binary WebSocket                         │
│                    │                                 │
│        ┌───────────┴────────────┐                    │
│        │ HTTP Server            │                    │
│        │ Viewer Web App         │                    │
│        └───────────┬────────────┘                    │
└────────────────────┼─────────────────────────────────┘
                     │
                 Wi-Fi / LAN
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
     Chrome         Edge       Firefox
        │            │            │
        ▼            ▼            ▼
     Canvas         Canvas       Canvas
        │            │            │
        └──────── View Only ──────┘
```

---

# 108. Final Product Definition

**LANMirror is a local-network, browser-based, host-approved, view-only screen-sharing system built using Go, Wails, React, WebSocket, HTML Canvas, and native operating-system screen-capture APIs.**

The host installs one application.

Viewers only need a browser.

The host always controls who can see the screen.

The system works without internet access and without WebRTC.
