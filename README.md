# LANMirror

Lightweight, view-only local-network screen sharing desktop application built with **Go**, **Wails v2**, **React 19**, **TypeScript**, and **Tailwind CSS**.

---

## Features

- **No Viewer Installation Required**: Any device on the same local Wi-Fi/LAN (iPhone, iPad, Android, Mac, Windows, Linux) opens the host URL in a web browser.
- **Explicit Host Authorization**: Viewers must request access and be approved by the host before receiving any screen data.
- **Real-Time Live Streaming**: Hardware-accelerated desktop capture with binary WebSocket frame transport to an HTML5 canvas.
- **Host Announcements**: Send one-way message banners to all connected viewers in real time.
- **Zero Internet / Cloud Dependency**: Operates entirely offline on the local network (no cloud relays, no WebRTC/STUN/TURN required).

---

## Development

### Prerequisites
- [Go](https://go.dev/) (1.20+)
- [Node.js](https://nodejs.org/) (18+)
- [Wails CLI v2](https://wails.io/)

### Run Live Development Mode
```bash
# Set PATH if necessary
export PATH=$PATH:/opt/homebrew/bin:$HOME/go/bin

# Start with hot-reloading
wails dev
```

---

## Building Installers

### 1. macOS (.dmg Installer & .app Bundle)

Build the production application:
```bash
wails build
```
This generates the `.app` bundle at `build/bin/LANMirror.app`.

To package into a drag-and-drop `.dmg` installer:
```bash
hdiutil create -volname "LANMirror" -srcfolder build/bin/LANMirror.app -ov -format UDZO build/bin/LANMirror-Installer.dmg
```
Your installer will be ready at:
`build/bin/LANMirror-Installer.dmg`

---

### 2. Windows (.exe Installer via NSIS)

To build a standalone Windows installer (.exe):
```bash
wails build -platform windows/amd64 -nsis
```
*(Note: Requires NSIS installed on Windows or via cross-compilation toolchain).*

---

### 3. Testing in Browser

1. Start LANMirror and click **Start Sharing**.
2. Open the displayed URL (e.g. `http://10.163.220.48:8080`) on any phone, tablet, or browser on the same Wi-Fi.
3. Enter your name and tap **Request Access**.
4. In the LANMirror desktop app, click **Approve**.
