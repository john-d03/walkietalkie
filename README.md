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

## Deployment

### Render

1. Create a `render.yaml` configuration
2. Set environment variables (ANNOUNCED_IP for your server's public IP)
3. Deploy via Render dashboard or CLI

### Docker

1. Build the image:
```bash
docker build -t walkietalkie .
```

2. Run the container:
```bash
docker run -p 3000:3000 walkietalkie
```

## Environment Variables

- `PORT`: Server port (default: 3000)
- `ANNOUNCED_IP`: Public IP address for WebRTC (required for production)
 - `MEDIASOUP_LISTEN_IPS`: JSON array of listen IP objects, e.g. `[{"ip":"0.0.0.0","announcedIp":"203.0.113.10"}]`
 - `MEDIASOUP_ENABLE_UDP`: Set to `false` to disable UDP (default: true)
 - `MEDIASOUP_ENABLE_TCP`: Set to `true` to allow TCP fallback (default: false)
 - `MEDIASOUP_PREFER_UDP`: Prefer UDP when both available (default: true)
 - `MEDIASOUP_MIN_PORT` / `MEDIASOUP_MAX_PORT`: Optional port range to constrain RTP/RTCP (e.g. 40000 / 40100)

### STUN / TURN Considerations

Mediasoup acts as an ICE-Lite server. You do not configure traditional `iceServers` in the client; instead:

1. Ensure `ANNOUNCED_IP` is set to the **public** IP (or use multiple in `MEDIASOUP_LISTEN_IPS`).
2. Open the selected UDP (and optionally TCP) ports in your firewall.
3. For very restrictive enterprise or carrier-grade NATs, a separate TURN server (e.g. coturn) can be deployed. TURN does not get referenced directly in this code; instead you would terminate TURN traffic and route it to the SFU at the network layer or deploy the SFU on public IP/port 443 UDP/TCP to maximize reachability.
4. Enable TCP fallback (`MEDIASOUP_ENABLE_TCP=true`) so clients behind blocked UDP can still connect, albeit with higher latency.

Example production `.env`:
```
PORT=3000
ANNOUNCED_IP=203.0.113.10
MEDIASOUP_LISTEN_IPS=[{"ip":"0.0.0.0","announcedIp":"203.0.113.10"}]
MEDIASOUP_ENABLE_TCP=true
MEDIASOUP_MIN_PORT=40000
MEDIASOUP_MAX_PORT=40100
```

If you add a TURN server for edge cases, keep its credentials out of this repo and document it operationally; mediasoup itself will still advertise its ICE candidates via the server transports configured above.

## License

MIT
