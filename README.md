````markdown
# 📻 Walkie-Talkie Web App

A real-time, browser-based walkie-talkie application with push-to-talk audio communication. Connect instantly with others through 5-digit channel codes for crystal-clear voice communication.

## ✨ Features

- 🎙️ **Push-to-Talk (PTT)** - Press and hold to transmit, release to listen
- ⚡ **Low Latency** - Near real-time audio streaming (~30-90ms)
- 📡 **Channel-Based** - Connect via 5-digit channel codes (00001-99999)
- 📊 **VU Meter** - Visual audio level indicator for both transmit and receive
- � **Mobile Speaker Output** - Automatic speakerphone routing on mobile devices
- � **Multi-User** - See who's connected and talking in real-time
- 🎨 **Vintage Design** - Retro walkie-talkie inspired interface
- 📱 **Responsive** - Works on desktop, tablets, and mobile devices
- 🔐 **Simple & Secure** - No login required, just join a channel

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3, Web Audio API, MediaRecorder API
- **Backend**: Node.js, Express, Socket.IO
- **Audio**: Opus codec via WebM containers, 48kHz sample rate
- **Build**: Webpack, Babel

## 🚀 Quick Start

### Local Development

1. **Install dependencies:**
```bash
npm install
```

2. **Build the client bundle:**
```bash
npm run build
```

3. **Start the server:**
```bash
npm start
```

4. **Open your browser:**
```
http://localhost:3000
```

### Development Mode

Run with auto-restart on file changes:
```bash
npm run dev
```

## 📖 How to Use

1. **Select a Channel** - Use the scrollable dials to choose a 5-digit channel code
2. **Join Channel** - Click the "JOIN CHANNEL" button
3. **Talk** - Press and hold the red PTT button to transmit
4. **Listen** - Release the button to hear others
5. **Monitor** - Watch the VU meter for audio levels
6. **Leave** - Click "LEAVE CHANNEL" or use the Reset button

### Channel Tips
- Channel `00000` is inactive (blocked)
- Use any code from `00001` to `99999`
- Share your channel code with others to communicate
- Use the "REJOIN" button to quickly reconnect to your last channel

## 🚢 Deployment

### Render (Recommended)

The app is configured for one-click deployment to Render:

1. **Push to GitHub** (already done)
2. **Connect to Render:**
   - Visit [dashboard.render.com](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Render will auto-detect `render.yaml`
3. **Deploy** - Click "Create Web Service"

The app will automatically:
- Install dependencies
- Build the webpack bundle
- Start the server
- Provide a live URL

### Docker

Build and run using Docker:

```bash
# Build the image
docker build -t walkietalkie .

# Run the container
docker run -p 3000:3000 walkietalkie
```

### Manual Deployment

For VPS or other platforms:

```bash
# Install dependencies
npm install

# Build client bundle
npm run build

# Start server (use PM2 or similar for production)
NODE_ENV=production node server.js
```

## ⚙️ Configuration

### Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development/production)

### Network Requirements

- **WebRTC Capable Browser** - Chrome, Firefox, Edge, Safari
- **HTTPS** - Required for microphone access in production
- **WebSocket Support** - For Socket.IO communication

### Browser Permissions

Users must grant microphone access when prompted to use PTT functionality.

## 🏗️ Architecture

### Audio Flow
```
User Mic → MediaRecorder (Opus/WebM) → Socket.IO → Server → Socket.IO → Other Users → Web Audio API → Speaker
```

### Key Components

- **Client-Side:**
  - MediaRecorder API for audio capture
  - Web Audio API for playback and VU metering
  - Canvas for visual feedback
  - Socket.IO client for real-time communication

- **Server-Side:**
  - Express for HTTP serving
  - Socket.IO for WebSocket signaling
  - Room-based audio relay
  - Peer management

### Performance

- **Audio Codec:** Opus (optimized for speech)
- **Sample Rate:** 48kHz
- **Bitrate:** Adaptive (typically 24-32 kbps)
- **Latency:** 30-90ms end-to-end
- **Timeslice:** 10ms chunks for smooth encoding

## 🎨 UI Features

- **Scrollable Channel Dials** - Vintage roller-style digit selection
- **Analog VU Meter** - Needle gauge with color zones (green/yellow/red)
- **Status Indicators** - Connection status and channel info
- **Peer List** - See who's in your channel
- **Responsive Design** - Optimized for mobile and desktop
- **PTT Locking** - Only one person can talk at a time

## 🔧 Technical Details

### Audio Optimization
- High-quality 48kHz sampling for clarity
- Opus codec for efficient compression
- Echo cancellation and noise suppression enabled
- Automatic gain control for consistent levels

### Mobile Enhancements
- Automatic speaker routing (loudspeaker)
- Volume boost for outdoor use
- Touch-optimized PTT button
- Full-height viewport optimization

### Browser Support
- ✅ Chrome/Edge (88+)
- ✅ Firefox (78+)
- ✅ Safari (14+)
- ✅ Mobile browsers (iOS Safari, Chrome Android)

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 📝 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

Built with modern web technologies for real-time voice communication. Inspired by classic walkie-talkie design and functionality.

---

**Made with ❤️ for instant communication**

````
