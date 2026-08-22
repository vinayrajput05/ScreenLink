# 🖥️ ScreenLink

**Fast, private, local screen sharing — directly in your browser.**

ScreenLink is a lightweight, open-source screen sharing app for devices connected to the same **Wi-Fi or LAN**.

Viewers don't need to install anything. Just open the ScreenLink URL in a browser, request access, and wait for host approval.

Built with **Go, Wails v2, React 19, TypeScript, Tailwind CSS, and WebSockets**.

---

## ✨ Features

* 🌐 **Zero-Install Viewer** — Open the host URL in any modern browser.
* 🔐 **Host Approval** — Every viewer must request permission.
* ⚡ **Live Screen Streaming** — Real-time streaming over WebSockets.
* 💬 **Host Announcements** — Send text, links, instructions, or code snippets.
* 📡 **Works Offline** — No cloud server, account, or Internet required.
* 📱 **Cross-Device** — Works on phones, tablets, laptops, and desktops.

---

## 🚀 How It Works

```text
ScreenLink Host
      │
      │ Wi-Fi / LAN
      ▼
Viewer Browser
      │
      ▼
Request Access
      │
      ▼
Host Approves
      │
      ▼
Live Screen
```

---

## 🛠️ Tech Stack

| Area      | Technology   |
| --------- | ------------ |
| Backend   | Go           |
| Desktop   | Wails v2     |
| Frontend  | React 19     |
| Language  | TypeScript   |
| Styling   | Tailwind CSS |
| Streaming | WebSockets   |
| Viewer    | HTML5 Canvas |

---

## 💻 Development

### Requirements

* Go 1.20+
* Node.js 18+
* Wails CLI v2

Install Wails:

```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

Clone the repository:

```bash
git clone https://github.com/vinayrajput05/ScreenLink.git
cd ScreenLink
```

Install dependencies:

```bash
cd frontend
npm install
cd ..
```

### 🍎 macOS

If Go, Wails, or Homebrew commands are not found, add them to your `PATH`:

```bash
export PATH=$PATH:/opt/homebrew/bin:$HOME/go/bin
```

Then verify Wails:

```bash
wails version
```

You can also add the PATH permanently:

```bash
echo 'export PATH=$PATH:/opt/homebrew/bin:$HOME/go/bin' >> ~/.zshrc
source ~/.zshrc
```

### Run ScreenLink

```bash
wails dev
```

---

## 🧪 Test Screen Sharing

1. Start ScreenLink.
2. Click **Start Sharing Screen**.
3. Open the displayed URL on another device using the same Wi-Fi/LAN.
4. Enter your name and click **Request Screen Access**.
5. Approve the request from the host app.
6. Start viewing the screen.

Example:

```text
http://192.168.1.10:8080
```

---

## 📦 Build

### 🍎 macOS

```bash
export PATH=$PATH:/opt/homebrew/bin:$HOME/go/bin
wails build
```

Output:

```text
build/bin/ScreenLink.app
```

Create a DMG:

```bash
hdiutil create \
-volname "ScreenLink" \
-srcfolder build/bin/ScreenLink.app \
-ov \
-format UDZO \
build/bin/ScreenLink-Installer.dmg
```

### 🪟 Windows

```bash
wails build -platform windows/amd64 -nsis
```

---

## 🤝 Contributing

Contributions are welcome! ❤️

You can help with:

* 🐛 Bug fixes
* ✨ New features
* 🎨 UI improvements
* ⚡ Performance
* 📖 Documentation
* 🧪 Testing
* 🍎 macOS support
* 🪟 Windows support

Create a branch:

```bash
git checkout -b feature/my-feature
```

Make your changes, test them, and open a **Pull Request**.

Look for issues labeled:

`good first issue` • `help wanted` • `bug` • `enhancement`

---

## 🗺️ Roadmap

* [ ] Multi-monitor selection
* [ ] Window sharing
* [ ] Stream quality controls
* [ ] Viewer statistics
* [ ] QR code connection
* [ ] Better reconnect support
* [ ] Windows optimization
* [ ] Linux host support
* [ ] Optional HTTPS

Have an idea? **Open an issue and share it.**

---

## 🔒 Privacy

ScreenLink is designed for **trusted local networks**.

**No cloud relay. No account. No Internet required.**

> Your screen shouldn't need to travel through the cloud to reach a device sitting next to you.

---

## ⭐ Support ScreenLink

If you like the project:

**⭐ Star • 🍴 Fork • 🐛 Report Bugs • 💡 Suggest Features • 🤝 Contribute**

### ☕ Support the Developer

If ScreenLink is useful to you and you'd like to support its development, you can contribute here:

**❤️ [Support Me](https://razorpay.me/@vinayrajput05)** 

<a href="https://razorpay.me/@vinayrajput05">
  <img src="./payment_qr.png" width="160" alt="Support ScreenLink via Razorpay">
</a>

Your support helps keep ScreenLink open source and improving. 🚀
