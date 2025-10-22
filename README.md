# Walkie-Talkie Web App

A real-time browser-based walkie-talkie application that enables push-to-talk audio communication through 5-digit channels. Users can instantly connect with others for clear voice transmission without needing an account or installation.

## Features

* Push-to-Talk (PTT): Press and hold to transmit, release to listen.
* Low Latency: Real-time audio streaming (approximately 30-90ms delay).
* Channel-Based: Connect using 5-digit codes from 00001 to 99999.
* VU Meter: Visual indicator of audio input and output levels.
* Mobile Speaker Output: Automatically routes sound to the loudspeaker on mobile devices.
* Multi-User Support: Displays active users and who is speaking.
* Vintage Design: Interface inspired by classic walkie-talkie hardware.
* Responsive: Optimized for desktop and mobile use.
* Simple and Secure: No login or data storage required.

## Technology Stack

* Frontend: HTML5, CSS3, Vanilla JavaScript, Web Audio API, MediaRecorder API.
* Backend: Node.js, Express, Socket.IO.
* Audio: Opus codec in WebM format, 48kHz sample rate.
* Build Tools: Webpack and Babel.

## Quick Start

### Local Development

1. Install dependencies:

```bash
npm install
```

2. Build the client bundle:

```bash
npm run build
```

3. Start the server:

```bash
npm start
```

4. Open the application in your browser:

```
http://localhost:3000
```

### Development Mode

Run with automatic reload on file changes:

```bash
npm run dev
```

## How to Use

1. Select a Channel: Choose a 5-digit channel number using the dial interface.
2. Join Channel: Press the "Join Channel" button.
3. Talk: Hold the PTT button to transmit your voice.
4. Listen: Release the PTT button to receive audio from others.
5. Monitor: Use the VU meter to track sound levels.
6. Leave: Select "Leave Channel" or reset the session.

### Channel Tips

* Channel 00000 is inactive.
* Channels 00001 to 99999 are available.
* Share the channel number with others to communicate.
* Use the "Rejoin" option to reconnect quickly.

## Deployment

### Render (Recommended)

1. Push the project to GitHub.
2. Go to Render Dashboard ([https://dashboard.render.com](https://dashboard.render.com)).
3. Create a new web service and connect the GitHub repository.
4. Render automatically detects the configuration and deploys the app.

### Docker Deployment

```bash
docker build -t walkietalkie .
docker run -p 3000:3000 walkietalkie
```

### Manual Deployment

```bash
npm install
npm run build
NODE_ENV=production node server.js
```

## Configuration

Environment Variables:

* PORT: Server port (default: 3000)
* NODE_ENV: Set to development or production

Requirements:

* HTTPS for microphone permissions.
* WebSocket support for real-time communication.
* WebRTC-capable browsers (Chrome, Firefox, Edge, Safari).

Users must grant microphone access when prompted.

## Architecture

Audio Flow:

```
Microphone → MediaRecorder (Opus/WebM) → Socket.IO → Server → Clients → Web Audio API → Speaker
```

### Components

Client Side:

* MediaRecorder API for audio capture.
* Web Audio API for playback and metering.
* Socket.IO for real-time data transfer.
* Canvas for visualization.

Server Side:

* Express for HTTP services.
* Socket.IO for managing channels and users.
* Audio relay and peer coordination.

Performance Parameters:

* Codec: Opus
* Sample Rate: 48kHz
* Bitrate: 24–32 kbps (adaptive)
* Latency: 30–90ms
* Packet Time Slice: 10ms

## User Interface

* Scrollable rotary-style channel selector.
* Analog VU meter with visual zones for signal intensity.
* Real-time connection and channel status indicators.
* User list display.
* PTT lock system ensuring only one user transmits at a time.

## Audio and Mobile Optimization

* 48kHz sampling rate for clarity.
* Echo cancellation and noise suppression.
* Automatic gain control.
* Loudspeaker routing on mobile devices.
* Touch-optimized controls.
* Full viewport scaling for different screen sizes.

Browser Support:

* Chrome (88+)
* Firefox (78+)
* Edge (88+)
* Safari (14+)
* Mobile Chrome and iOS Safari

## Contributing

Contributions are welcome. You may report issues, suggest features, or submit pull requests.

## License

MIT License. Refer to the LICENSE file for details.

## Acknowledgments

Developed using modern web technologies for seamless voice communication. Inspired by the design and simplicity of classic walkie-talkies.
