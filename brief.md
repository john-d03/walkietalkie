Project Brief: Browser-Based Walkie-Talkie App
	1.	Project Overview
The goal is to build a real-time, browser-based walkie-talkie that allows small groups (up to 15 users) to communicate via push-to-talk (PTT) audio. Users connect via a URL, press a button to speak, and hear audio from others instantly.

Key Features:
	•	Push-to-talk audio communication
	•	Real-time streaming with minimal latency
	•	Room-based grouping
	•	Cross-platform: desktop, mobile, tablet
	•	Secure communication over HTTPS
	•	Optional TURN server for NAT traversal
	•	Scalable to handle ~15 concurrent users per room

	2.	Technology Stack
Frontend:

	•	HTML / CSS / JavaScript
	•	WebRTC API
	•	Socket.io
	•	Optional: mediasoup-client

Backend:
	•	Node.js + Express
	•	Socket.io
	•	mediasoup for SFU
	•	HTTPS via Let’s Encrypt
	•	Optional: Redis for room state

Media Traversal:
	•	STUN server
	•	TURN server (coturn)

	3.	Architecture
Browser <-> Node.js Server + mediasoup SFU <-> Browser
Server handles signaling and forwards audio streams. TURN/STUN ensures connectivity across networks.
	4.	Functional Flow
	5.	User opens room URL
	6.	Client requests RTP capabilities
	7.	Client creates send transport
	8.	User presses PTT button (audio captured and sent)
	9.	Server forwards audio to other users
	10.	Others hear audio in real-time
	11.	User releases PTT
	12.	Cleanup on disconnect
	13.	Scalability

	•	15 audio-only users per room on 2 vCPU, 4GB RAM VPS
	•	Multiple rooms supported
	•	Additional mediasoup workers for higher scale

	6.	Security

	•	HTTPS (TLS)
	•	TURN credentials
	•	Optional authentication
	•	No persistent recording by default

	7.	Deployment Plan
	8.	Deploy Node.js + mediasoup on VPS
	9.	Configure TLS/HTTPS
	10.	Install TURN server (coturn)
	11.	Map domain to server IP
	12.	Serve frontend via Express or CDN
	13.	Test multi-device access
	14.	Optional monitoring
	15.	Key Challenges & Solutions
| Challenge | Solution |
|———–|———|
| NAT/firewall | TURN server |
| Multiple users | SFU (mediasoup) |
| Latency | Audio-only Opus codec |
| Security | HTTPS + TURN credentials |
| Browser compatibility | Test across Chrome, Firefox, Edge, Safari |
	16.	Future Enhancements

	•	Improved PTT UI
	•	Multi-room routing
	•	Optional recording/transcription
	•	Mobile-optimized layout
	•	Integration with chat or workflow systems

	10.	Project Completion Checklist

	•	Backend with Socket.io signaling
	•	Mediasoup SFU
	•	Frontend PTT button
	•	STUN/TURN integration
	•	Room creation/joining
	•	HTTPS deployment plan
	•	Tested with 15 users

	11.	Outcome

	•	Fully functional browser walkie-talkie for up to 15 users
	•	Instant global communication without installation
	•	Scalable, secure, deployable globally
	•	Ready for enhancements