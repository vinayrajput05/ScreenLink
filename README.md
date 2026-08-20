# ScreenLink

Lightweight, view-only local-network screen sharing desktop application built with **Go**, **Wails v2**, **React 19**, **TypeScript**, and **Tailwind CSS**.

---

## Features

- **Zero-Install Web Viewer**: Any device on the same local Wi-Fi/LAN (iPhone, iPad, Android, Mac, Windows, Linux) opens the host URL in a web browser.
- **Explicit Host Authorization**: Viewers must request access and be approved by the host before receiving screen data.
- **Real-Time Live Streaming**: Hardware-accelerated desktop capture with binary WebSocket frame transport to an HTML5 canvas.
- **Host Announcements**: Broadcast one-way message banners to all connected viewers in real time with quick preset templates.
- **Zero Internet / Cloud Dependency**: Operates entirely offline on the local network (no cloud relays, accounts, or WebRTC required).

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
This generates the `.app` bundle at `build/bin/ScreenLink.app`.

To package into a drag-and-drop `.dmg` installer:
```bash
hdiutil create -volname "ScreenLink" -srcfolder build/bin/ScreenLink.app -ov -format UDZO build/bin/ScreenLink-Installer.dmg
```
Your installer will be ready at:
`build/bin/ScreenLink-Installer.dmg`

---

### 2. Windows (.exe Installer via NSIS)

To build a standalone Windows installer (.exe):
```bash
wails build -platform windows/amd64 -nsis
```

---

## Testing in Browser

1. Start ScreenLink and click **Start Sharing Screen**.
2. Open the displayed URL (e.g. `http://10.163.220.48:8080`) on any phone, tablet, or browser on the same Wi-Fi.
3. Enter your name and tap **Request Screen Access**.
4. In the ScreenLink desktop app, click **Approve**.
