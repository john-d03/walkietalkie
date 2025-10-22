# Project Brief: Browser-Based Walkie-Talkie AppProject Brief: Browser-Based Walkie-Talkie App

	1.	Project Overview

## 1. Project OverviewThe goal is to build a real-time, browser-based walkie-talkie that allows small groups (up to 15 users) to communicate via push-to-talk (PTT) audio. Users connect via a URL, press a button to speak, and hear audio from others instantly.



A real-time, browser-based walkie-talkie application that enables instant voice communication via push-to-talk (PTT). Users connect through 5-digit channel codes for secure, isolated communication without requiring accounts or downloads.Key Features:

	•	Push-to-talk audio communication

### Key Features:	•	Real-time streaming with minimal latency

- Push-to-talk audio communication with visual feedback	•	Room-based grouping

- Channel-based grouping (00001-99999)	•	Cross-platform: desktop, mobile, tablet

- Real-time streaming with minimal latency (~30-90ms)	•	Secure communication over HTTPS

- Cross-platform: desktop, mobile, tablet	•	Optional TURN server for NAT traversal

- Vintage walkie-talkie inspired interface	•	Scalable to handle ~15 concurrent users per room

- No installation or registration required

- Multi-user support with PTT locking	2.	Technology Stack

Frontend:

## 2. Technology Stack

	•	HTML / CSS / JavaScript

### Frontend:	•	WebRTC API

- Vanilla JavaScript (ES6+)	•	Socket.io

- HTML5 / CSS3	•	Optional: mediasoup-client

- MediaRecorder API (audio capture)

- Web Audio API (playback & VU metering)Backend:

- Canvas API (visual gauges)	•	Node.js + Express

- Socket.IO Client	•	Socket.io

	•	mediasoup for SFU

### Backend:	•	HTTPS via Let’s Encrypt

- Node.js + Express	•	Optional: Redis for room state

- Socket.IO (WebSocket communication)

- Simple audio relay (no SFU required)Media Traversal:

	•	STUN server

### Build Tools:	•	TURN server (coturn)

- Webpack

- Babel	3.	Architecture

Browser <-> Node.js Server + mediasoup SFU <-> Browser

### Deployment:Server handles signaling and forwards audio streams. TURN/STUN ensures connectivity across networks.

- Docker support	4.	Functional Flow

- Render.com ready	5.	User opens room URL

- HTTPS required for production	6.	Client requests RTP capabilities

	7.	Client creates send transport

## 3. Architecture	8.	User presses PTT button (audio captured and sent)

	9.	Server forwards audio to other users

```	10.	Others hear audio in real-time

User Mic → MediaRecorder → Socket.IO → Server → Socket.IO → Other Users → Web Audio API → Speaker	11.	User releases PTT

```	12.	Cleanup on disconnect

	13.	Scalability

**Simplified Design:**

- Direct audio chunk relay via Socket.IO	•	15 audio-only users per room on 2 vCPU, 4GB RAM VPS

- No complex WebRTC signaling required	•	Multiple rooms supported

- Server acts as a simple relay/router	•	Additional mediasoup workers for higher scale

- Rooms are isolated by channel codes

	6.	Security

## 4. Functional Flow

	•	HTTPS (TLS)

1. User opens app and selects 5-digit channel code	•	TURN credentials

2. User clicks "JOIN CHANNEL"	•	Optional authentication

3. Server adds user to room (channel)	•	No persistent recording by default

4. Server sends list of existing peers

5. User presses PTT button	7.	Deployment Plan

6. MediaRecorder captures microphone audio	8.	Deploy Node.js + mediasoup on VPS

7. Audio chunks encoded as Opus/WebM	9.	Configure TLS/HTTPS

8. Binary data sent via Socket.IO to server	10.	Install TURN server (coturn)

9. Server relays audio to all other users in channel	11.	Map domain to server IP

10. Other users decode and play audio	12.	Serve frontend via Express or CDN

11. VU meter shows audio levels during playback	13.	Test multi-device access

12. User releases PTT button	14.	Optional monitoring

13. Recording stops and final audio transmitted	15.	Key Challenges & Solutions

14. PTT re-enables for other users| Challenge | Solution |

|———–|———|

## 5. Scalability| NAT/firewall | TURN server |

| Multiple users | SFU (mediasoup) |

**Current Implementation:**| Latency | Audio-only Opus codec |

- Lightweight relay architecture| Security | HTTPS + TURN credentials |

- Multiple isolated channels/rooms| Browser compatibility | Test across Chrome, Firefox, Edge, Safari |

- ~10-20 users per channel recommended	16.	Future Enhancements

- Minimal server resources required

- Horizontal scaling via multiple instances	•	Improved PTT UI

	•	Multi-room routing

## 6. Security	•	Optional recording/transcription

	•	Mobile-optimized layout

- HTTPS/TLS in production (required for mic access)	•	Integration with chat or workflow systems

- Channel-based isolation (no cross-channel leaks)

- No persistent storage or recording	10.	Project Completion Checklist

- Optional: Add authentication layer

- Optional: Channel password protection	•	Backend with Socket.io signaling

	•	Mediasoup SFU

## 7. Deployment Plan	•	Frontend PTT button

	•	STUN/TURN integration

1. Build webpack bundle (`npm run build`)	•	Room creation/joining

2. Deploy to Render.com (auto-configured via render.yaml)	•	HTTPS deployment plan

3. Or deploy to any Node.js hosting platform	•	Tested with 15 users

4. Or use Docker container

5. Ensure HTTPS is configured	11.	Outcome

6. Share URL with users

	•	Fully functional browser walkie-talkie for up to 15 users

## 8. Key Challenges & Solutions	•	Instant global communication without installation

	•	Scalable, secure, deployable globally

| Challenge | Solution |	•	Ready for enhancements
|-----------|----------|
| Audio latency | Opus codec, 48kHz, 10ms timeslices |
| Mobile audio routing | Automatic speaker detection & volume boost |
| Multi-user coordination | PTT locking, peer-talking events |
| Binary data transfer | Uint8Array via Socket.IO binary events |
| Browser compatibility | MediaRecorder/Web Audio API polyfills |
| Connection stability | Socket.IO auto-reconnect |

## 9. UI Components

### Channel Selector
- 5 scrollable dial wheels (0-9 each)
- Infinite scroll with snap behavior
- Visual feedback on selection

### VU Meter
- Canvas-based analog gauge
- Needle animation
- Color zones (green/yellow/red)
- Shows levels during transmit and receive

### PTT Button
- Large circular button
- Press-and-hold interaction
- Visual feedback (color change)
- Disabled state when others are talking

### Status Display
- Connection indicator (online/offline/talking)
- Channel info display
- Peer count and list
- Reception indicator

## 10. Performance Characteristics

- **Audio Quality:** 48kHz, Opus codec, ~24-32 kbps
- **Latency:** 30-90ms end-to-end (capture + encode + network + decode)
- **Bandwidth:** ~3-4 KB/s per active talker
- **Browser Load:** Minimal (native audio APIs)
- **Server Load:** Very light (simple relay)

## 11. Future Enhancements

- [ ] Channel passwords/authentication
- [ ] Recording capability (optional)
- [ ] Text chat alongside voice
- [ ] Channel history/favorites
- [ ] Desktop notifications
- [ ] Keyboard shortcuts (spacebar PTT)
- [ ] Audio effects/filters
- [ ] Channel discovery/public channels
- [ ] Admin controls (mute, kick)
- [ ] Statistics/analytics

## 12. Project Status

✅ **Completed:**
- Core PTT functionality
- Channel-based rooms
- VU meter visualization
- Mobile optimization
- Speaker routing
- Multi-user support
- Low-latency audio
- Reset/rejoin functionality
- Responsive design
- Docker deployment
- Render.com deployment

## 13. Success Criteria

✅ Users can communicate with <100ms latency
✅ Works on mobile and desktop browsers
✅ No installation required
✅ Supports multiple concurrent channels
✅ Visual feedback for audio levels
✅ Reliable connection handling
✅ Professional, intuitive UI

## 14. Outcome

A fully functional, production-ready browser-based walkie-talkie that requires no installation, supports multiple users, and provides instant voice communication through simple channel codes. The app is deployable globally, scales horizontally, and works across all modern devices.

---

**Status:** Production Ready 🚀
**License:** MIT
**Repository:** https://github.com/john-d03/walkietalkie
