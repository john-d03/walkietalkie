# Walkie-Talkie App

A real-time, browser-based walkie-talkie application with push-to-talk audio communication.

## Features

- 🎙️ Push-to-talk audio communication
- 🚀 Real-time streaming with minimal latency
- 🏠 Room-based grouping
- 📱 Cross-platform (desktop, mobile, tablet)
- 🔒 Secure communication (HTTPS ready)
- 👥 Supports up to 15 concurrent users per room

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript, WebRTC, Socket.io Client, mediasoup-client
- **Backend**: Node.js, Express, Socket.io, mediasoup SFU

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open your browser and navigate to:
```
http://localhost:3000
```

## Development

Run in development mode with auto-restart:
```bash
npm run dev
```

## Usage

1. Enter a room code in the input field
2. Click "Join Room" to connect
3. Press and hold the PTT button to speak
4. Release the button to stop transmitting

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
