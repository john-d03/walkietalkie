/******/ (() => { // webpackBootstrap
/*!**************************!*\
  !*** ./public/client.js ***!
  \**************************/
// Initialize Socket.io
const socket = io();

// Web Audio API variables for simple audio transmission
let audioContext;
let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let remoteAudioBuffers = new Map(); // peerId -> AudioBuffer queue
let analyser;
let vuDataArray;
let vuAnimationId;
let currentRoom = null;
let peerId = generatePeerId();
let peers = new Map();
let activeTalkers = new Set();

// DOM elements
const joinBtn = document.getElementById('joinBtn');
const roomInfo = document.getElementById('roomInfo');
const statusText = document.getElementById('statusText');
const statusDot = document.getElementById('statusDot');
const pttButton = document.getElementById('pttButton');
const peersCount = document.getElementById('peersCount');
const peersListItems = document.getElementById('peersListItems');
const incomingIndicator = document.getElementById('incomingIndicator');
const vuGaugeCanvas = document.getElementById('vuGauge');

// Channel dial elements
const dial1 = document.getElementById('dial1');
const dial2 = document.getElementById('dial2');
const dial3 = document.getElementById('dial3');
const dial4 = document.getElementById('dial4');
const dial5 = document.getElementById('dial5');
const dials = [dial1, dial2, dial3, dial4, dial5];

// Initialize dials with all digits
dials.forEach(dial => {
  dial.innerHTML = '';
  // Add digits 0-9 three times for smooth scrolling
  for (let cycle = 0; cycle < 3; cycle++) {
    for (let i = 0; i <= 9; i++) {
      const digitEl = document.createElement('div');
      digitEl.className = 'dial-digit';
      digitEl.textContent = i;
      dial.appendChild(digitEl);
    }
  }

  // Set initial scroll position after a brief delay to ensure rendering
  setTimeout(() => {
    const dialHeight = dial.querySelector('.dial-digit').offsetHeight;
    dial.scrollTop = dialHeight * 10; // Start at middle cycle (digit 0)
    dial.dataset.value = '0';
  }, 50);

  // Snap to nearest digit on scroll end
  let scrollTimeout;
  dial.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const dialHeight = dial.querySelector('.dial-digit').offsetHeight;
      const scrollPos = dial.scrollTop;
      const digitIndex = Math.round(scrollPos / dialHeight);
      const snappedPos = digitIndex * dialHeight;
      dial.scrollTop = snappedPos;

      // Update data-value (mod 10 to get actual digit)
      const actualDigit = digitIndex % 10;
      dial.dataset.value = actualDigit;

      // Loop scroll if needed
      if (digitIndex < 5) {
        dial.scrollTop = snappedPos + dialHeight * 10;
      } else if (digitIndex > 25) {
        dial.scrollTop = snappedPos - dialHeight * 10;
      }
    }, 150);
  });
});

// Generate unique peer ID
function generatePeerId() {
  return `peer_${Math.random().toString(36).substr(2, 9)}`;
}

// Update UI status
function updateStatus(status, message) {
  statusText.textContent = message.toUpperCase();
  statusDot.className = 'status-dot';
  if (status === 'connected') {
    statusDot.classList.add('connected');
  } else if (status === 'talking') {
    statusDot.classList.add('talking');
  }
}

// Update peers count and list
function updatePeersList() {
  peersCount.textContent = peers.size + 1; // +1 for self

  peersListItems.innerHTML = '';
  const selfItem = document.createElement('li');
  selfItem.textContent = 'You';
  selfItem.style.fontWeight = 'bold';
  peersListItems.appendChild(selfItem);
  peers.forEach((peer, id) => {
    const li = document.createElement('li');
    li.id = `peer-item-${id}`;
    li.textContent = id.substr(0, 12);
    if (activeTalkers.has(id)) li.classList.add('talking');
    peersListItems.appendChild(li);
  });
}
function getChannelId() {
  return dials.map(d => d.dataset.value || '0').join('');
}

// Reset button - leave channel and reset all dials to 0
const resetBtn = document.getElementById('resetBtn');
const rejoinBtn = document.getElementById('rejoinBtn');
let lastChannel = null;
resetBtn.addEventListener('click', () => {
  // Leave channel if connected
  if (currentRoom) {
    socket.emit('leave-room', {
      roomId: currentRoom,
      peerId
    }, resp => {
      if (resp && resp.error) {
        console.error('Leave error:', resp.error);
      }
    });
    currentRoom = null;
    joinBtn.textContent = 'JOIN CHANNEL';
    joinBtn.classList.remove('leave-btn');
    joinBtn.classList.add('join-btn');
    joinBtn.disabled = false;
    updateStatus('disconnected', 'Offline');
    pttButton.disabled = true;
    peers.clear();
    updatePeersList();

    // Stop any ongoing recording
    if (isRecording && mediaRecorder) {
      mediaRecorder.stop();
      isRecording = false;
    }
    if (vuAnimationId) {
      cancelAnimationFrame(vuAnimationId);
      vuAnimationId = null;
    }
    rejoinBtn.style.display = 'none';
  }

  // Reset all dials to 0
  dials.forEach(dial => {
    // Get actual dial height from first digit element
    const actualHeight = dial.querySelector('.dial-digit').offsetHeight;
    // Scroll to middle cycle (digit 0)
    dial.scrollTop = actualHeight * 10;
    dial.dataset.value = '0';
  });
  roomInfo.textContent = '';
  lastChannel = null;
});

// Rejoin button - reconnect to last channel
rejoinBtn.addEventListener('click', async () => {
  if (!lastChannel || lastChannel === '00000') {
    alert('No previous channel to rejoin.');
    return;
  }
  const channelToRejoin = lastChannel;

  // If currently in a room, leave it first
  if (currentRoom) {
    socket.emit('leave-room', {
      roomId: currentRoom,
      peerId
    }, resp => {
      if (resp && resp.error) {
        console.error('Leave error:', resp.error);
      }
    });

    // Stop recording if active
    if (isRecording) {
      try {
        mediaRecorder.stop();
        isRecording = false;
      } catch (e) {
        console.error('Error stopping recorder:', e);
      }
    }

    // Clear VU meter
    if (vuAnimationId) {
      cancelAnimationFrame(vuAnimationId);
      vuAnimationId = null;
    }
    const ctx = vuGaugeCanvas.getContext('2d');
    drawGauge(ctx, vuGaugeCanvas.width, vuGaugeCanvas.height, 0);
    currentRoom = null;
    joinBtn.textContent = 'JOIN CHANNEL';
    joinBtn.classList.remove('leave-btn');
    joinBtn.classList.add('join-btn');
    updateStatus('disconnected', 'Offline');
    pttButton.disabled = true;
    peers.clear();
    updatePeersList();
    roomInfo.textContent = '';
  }

  // Set dials to last channel
  const digits = channelToRejoin.split('');
  dials.forEach((dial, index) => {
    const digit = parseInt(digits[index] || '0');
    const dialHeight = dial.querySelector('.dial-digit').offsetHeight;
    const targetPos = dialHeight * (10 + digit); // Middle cycle + digit
    dial.scrollTop = targetPos;
    dial.dataset.value = digit.toString();
  });

  // Trigger join after a brief delay
  setTimeout(() => {
    joinBtn.click();
  }, 300);
});

// Join / Leave channel
joinBtn.addEventListener('click', async () => {
  if (currentRoom) {
    // Leave flow
    socket.emit('leave-room', {
      roomId: currentRoom,
      peerId
    }, resp => {
      if (resp && resp.error) {
        console.error('Leave error:', resp.error);
        return;
      }
      lastChannel = currentRoom;
      currentRoom = null;
      joinBtn.textContent = 'JOIN CHANNEL';
      joinBtn.classList.remove('leave-btn');
      joinBtn.classList.add('join-btn');
      updateStatus('disconnected', 'Offline');
      pttButton.disabled = true;
      peers.clear();
      updatePeersList();
      roomInfo.textContent = '';
      rejoinBtn.style.display = 'inline-block';
    });
    return;
  }
  const roomId = getChannelId();

  // Prevent joining inactive channel 00000
  if (roomId === '00000') {
    alert('Channel 00000 is inactive. Please select a different channel.');
    return;
  }
  try {
    joinBtn.disabled = true;
    updateStatus('connecting', 'Connecting');
    socket.emit('join-room', {
      roomId,
      peerId
    }, async response => {
      if (response.error) throw new Error(response.error);
      currentRoom = roomId;
      lastChannel = roomId;
      roomInfo.textContent = `Connected to ${roomId}`;

      // Create audio context with speaker output preference on mobile
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      audioContext = new (window.AudioContext || window.webkitAudioContext)({
        latencyHint: 'interactive',
        sampleRate: 48000
      });

      // On iOS, ensure audio routing to speaker
      if (isMobile && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Trigger audio session for speaker output
        try {
          const dummyStream = await navigator.mediaDevices.getUserMedia({
            audio: true
          });
          dummyStream.getTracks().forEach(track => track.stop());
        } catch (e) {
          console.log('Could not initialize audio session:', e);
        }
      }
      updateStatus('connected', 'Online');
      pttButton.disabled = false;
      joinBtn.disabled = false;
      joinBtn.textContent = 'LEAVE CHANNEL';
      joinBtn.classList.remove('join-btn');
      joinBtn.classList.add('leave-btn');
      rejoinBtn.style.display = 'inline-block';
      // Don't call updatePeersList yet - wait for room-users event
    });
  } catch (error) {
    console.error('Error joining room:', error);
    alert('Failed to join channel: ' + error.message);
    joinBtn.disabled = false;
    updateStatus('disconnected', 'Offline');
  }
});

// Handle room users list (sent on join)
socket.on('room-users', ({
  peers: peersList
}) => {
  console.log('Room users:', peersList);
  // Add all existing peers
  peersList.forEach(pid => {
    if (pid !== peerId && !peers.has(pid)) {
      peers.set(pid, {});
    }
  });
  updatePeersList();
});

// Handle peer joined
socket.on('peer-joined', ({
  peerId: newPeerId
}) => {
  console.log('Peer joined:', newPeerId);
  if (!peers.has(newPeerId)) {
    peers.set(newPeerId, {});
  }
  updatePeersList();
});

// Handle peer left
socket.on('peer-left', ({
  peerId: leftPeerId
}) => {
  console.log('Peer left:', leftPeerId);
  if (peers.has(leftPeerId)) {
    peers.delete(leftPeerId);
  }
  updatePeersList();
});

// PTT button handlers
let audioStream = null;
pttButton.addEventListener('mousedown', startTalking);
pttButton.addEventListener('mouseup', stopTalking);
pttButton.addEventListener('mouseleave', stopTalking);
pttButton.addEventListener('touchstart', startTalking);
pttButton.addEventListener('touchend', stopTalking);
async function startTalking(e) {
  e.preventDefault();
  if (!currentRoom || isRecording) return;
  try {
    // Get microphone access
    audioStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
        // High sample rate for low latency
        latency: 0 // Request lowest possible latency
      }
    });

    // Setup MediaRecorder
    mediaRecorder = new MediaRecorder(audioStream, {
      mimeType: 'audio/webm;codecs=opus'
    });
    audioChunks = [];
    mediaRecorder.ondataavailable = event => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };
    mediaRecorder.onstop = async () => {
      if (audioChunks.length > 0) {
        const audioBlob = new Blob(audioChunks, {
          type: 'audio/webm;codecs=opus'
        });
        const arrayBuffer = await audioBlob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        socket.emit('audio-data', {
          roomId: currentRoom,
          peerId,
          audioData: uint8Array
        });
      }
      // Stop all tracks
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
    };

    // Start recording with minimal timeslice for responsiveness
    mediaRecorder.start(10); // Collect data every 10ms for smoother encoding
    isRecording = true;

    // Setup VU meter
    setupVUMeter(audioStream);

    // Play transmission start sound
    playTransmissionSound('start');

    // Update UI
    socket.emit('ptt-start', {
      roomId: currentRoom,
      peerId
    });
    pttButton.classList.add('talking');
    updateStatus('talking', 'Talking');
  } catch (err) {
    console.error('PTT start error', err);
    alert('Could not access microphone: ' + err.message);
  }
}
function stopTalking() {
  if (!isRecording) return;

  // Stop recording
  mediaRecorder.stop();
  isRecording = false;

  // Stop VU meter
  if (vuAnimationId) {
    cancelAnimationFrame(vuAnimationId);
    vuAnimationId = null;
  }

  // Play transmission end sound
  playTransmissionSound('end');

  // Update UI
  socket.emit('ptt-stop', {
    roomId: currentRoom,
    peerId
  });
  pttButton.classList.remove('talking');
  updateStatus('connected', 'Online');
}
function setupVUMeter(stream) {
  try {
    audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    const bufferLength = analyser.frequencyBinCount;
    vuDataArray = new Uint8Array(bufferLength);
    source.connect(analyser);
    const ctx = vuGaugeCanvas.getContext('2d');
    const w = vuGaugeCanvas.width;
    const h = vuGaugeCanvas.height;
    const draw = () => {
      analyser.getByteFrequencyData(vuDataArray);
      let sum = 0;
      const len = Math.floor(vuDataArray.length / 6);
      for (let i = 0; i < len; i++) sum += vuDataArray[i];
      const avg = sum / len;
      const level = Math.min(1, avg / 255);
      drawGauge(ctx, w, h, level);
      vuAnimationId = requestAnimationFrame(draw);
    };
    if (vuAnimationId) cancelAnimationFrame(vuAnimationId);
    draw();
  } catch (e) {
    console.warn('VU meter setup failed', e);
  }
}

// Reusable gauge drawing function
function drawGauge(ctx, w, h, level) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#0f161b';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#2c3e50';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(w / 2, h * 0.9, h * 0.8, Math.PI, Math.PI * 2, false);
  ctx.stroke();
  for (let i = 0; i <= 10; i++) {
    const ratio = i / 10;
    const angle = Math.PI + ratio * Math.PI;
    const r = h * 0.8;
    const x1 = w / 2 + Math.cos(angle) * (r - 10);
    const y1 = h * 0.9 + Math.sin(angle) * (r - 10);
    const x2 = w / 2 + Math.cos(angle) * (r - 2);
    const y2 = h * 0.9 + Math.sin(angle) * (r - 2);
    ctx.strokeStyle = i < 7 ? '#27ae60' : i < 9 ? '#f1c40f' : '#e74c3c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  const needleAngle = Math.PI + level * Math.PI;
  ctx.strokeStyle = '#ffedc2';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(w / 2, h * 0.9);
  ctx.lineTo(w / 2 + Math.cos(needleAngle) * (h * 0.8 - 18), h * 0.9 + Math.sin(needleAngle) * (h * 0.8 - 18));
  ctx.stroke();
  ctx.fillStyle = '#b38b57';
  ctx.beginPath();
  ctx.arc(w / 2, h * 0.9, 10, 0, Math.PI * 2);
  ctx.fill();
}

// Handle incoming audio data from other peers
// Handle received audio data
socket.on('audio-data', async ({
  peerId: senderId,
  audioData
}) => {
  if (senderId === peerId) return; // Don't play our own audio

  try {
    // Play incoming transmission start sound
    playReceptionSound('start');

    // Disable PTT during reception
    const wasPttEnabled = !pttButton.disabled;
    if (wasPttEnabled) {
      pttButton.disabled = true;
      pttButton.style.opacity = '0.3';
    }

    // Convert received data to ArrayBuffer
    let arrayBuffer;
    if (audioData instanceof ArrayBuffer) {
      arrayBuffer = audioData;
    } else if (audioData.buffer instanceof ArrayBuffer) {
      // It's a typed array, get its buffer
      arrayBuffer = audioData.buffer.slice(audioData.byteOffset, audioData.byteOffset + audioData.byteLength);
    } else {
      // Fallback: convert to Uint8Array first
      const uint8 = new Uint8Array(audioData);
      arrayBuffer = uint8.buffer;
    }

    // Decode audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Create source and analyser for VU meter during playback
    const source = audioContext.createBufferSource();
    const analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 512;
    source.buffer = audioBuffer;
    source.connect(analyserNode);

    // Create a GainNode for volume control
    const gainNode = audioContext.createGain();
    analyserNode.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Force speaker output on mobile devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      // Increase volume to ensure it plays on speaker
      gainNode.gain.value = 2.0;

      // Try to set audio to speaker if supported
      if (audioContext.setSinkId) {
        try {
          await audioContext.setSinkId('');
        } catch (e) {
          console.log('setSinkId not supported:', e);
        }
      }
    } else {
      gainNode.gain.value = 1.0;
    }

    // Resume audio context if suspended (required by some browsers)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    // Show VU meter during playback
    const playbackDataArray = new Uint8Array(analyserNode.frequencyBinCount);
    const ctx = vuGaugeCanvas.getContext('2d');
    const w = vuGaugeCanvas.width;
    const h = vuGaugeCanvas.height;
    let playbackAnimationId;
    const drawPlaybackVU = () => {
      analyserNode.getByteFrequencyData(playbackDataArray);
      let sum = 0;
      const len = Math.floor(playbackDataArray.length / 6);
      for (let i = 0; i < len; i++) sum += playbackDataArray[i];
      const avg = sum / len;
      const level = Math.min(1, avg / 255);
      drawGauge(ctx, w, h, level);
      playbackAnimationId = requestAnimationFrame(drawPlaybackVU);
    };
    drawPlaybackVU();
    source.start();
    console.log('Playing audio from:', senderId);

    // Play end sound and re-enable PTT after audio finishes
    source.onended = () => {
      playReceptionSound('end');
      cancelAnimationFrame(playbackAnimationId);
      drawGauge(ctx, w, h, 0);
      if (wasPttEnabled && currentRoom) {
        pttButton.disabled = false;
        pttButton.style.opacity = '';
      }
    };
  } catch (error) {
    console.error('Error playing received audio:', error);
    // Re-enable PTT on error
    if (currentRoom && !pttButton.classList.contains('talking')) {
      pttButton.disabled = false;
      pttButton.style.opacity = '';
    }
  }
});
function wireTransportDebug(transport, direction) {
  transport.on('connectionstatechange', state => {
    console.log(`[transport ${direction}] connectionstate=${state}`);
    const el = document.getElementById('statusText');
    if (state === 'failed') el.textContent = 'Transport failed';else if (state === 'connected') el.textContent = 'Connected';
  });
  transport.on('dtlsstatechange', state => {
    console.log(`[transport ${direction}] dtls=${state}`);
  });
  transport.on('icegatheringstatechange', () => {
    console.log(`[transport ${direction}] iceGatheringState=${transport.iceGatheringState}`);
  });
}

// Handle producer closed (cleanup consumer audio elements)
socket.on('producer-closed', ({
  peerId: closedPeerId,
  producerId
}) => {
  const peer = peers.get(closedPeerId);
  if (!peer) return;
  peer.consumers = peer.consumers.filter(c => {
    if (c.producerId === producerId) {
      try {
        c.close();
      } catch (_) {}
      return false;
    }
    return true;
  });
  const el = document.querySelector(`#remoteAudioContainer audio[data-peer='${closedPeerId}'][data-producer='${producerId}']`);
  if (el) el.remove();
});

// Handle room users list (sent on join)
socket.on('room-users', ({
  peers: peersList
}) => {
  console.log('Room users:', peersList);
  // Add all existing peers
  peersList.forEach(pid => {
    if (pid !== peerId && !peers.has(pid)) {
      peers.set(pid, {
        consumers: []
      });
    }
  });
  updatePeersList();
});

// Handle peer joined
socket.on('peer-joined', ({
  peerId: newPeerId
}) => {
  console.log('Peer joined:', newPeerId);
  if (!peers.has(newPeerId)) {
    peers.set(newPeerId, {
      consumers: []
    });
  }
  updatePeersList();
});

// Handle peer left
socket.on('peer-left', ({
  peerId: leftPeerId
}) => {
  console.log('Peer left:', leftPeerId);
  if (peers.has(leftPeerId)) {
    const peer = peers.get(leftPeerId);
    peer.consumers.forEach(consumer => consumer.close());
    peers.delete(leftPeerId);
  }
  updatePeersList();
});

// Handle disconnect
socket.on('disconnect', () => {
  updateStatus('disconnected', 'Offline');
  pttButton.disabled = true;
  joinBtn.disabled = false;
  joinBtn.textContent = 'JOIN CHANNEL';
  joinBtn.classList.remove('leave-btn');
  joinBtn.classList.add('join-btn');
  currentRoom = null;
  peers.clear();
  updatePeersList();
}); // Remote peer PTT indicators
socket.on('peer-talking-start', ({
  peerId: talker
}) => {
  if (talker === peerId) return; // ignore self events
  activeTalkers.add(talker);
  const li = document.getElementById(`peer-item-${talker}`);
  if (li) li.classList.add('talking');
  showIncomingIndicator();
  playReceptionSound('start');

  // Disable PTT for all other users when someone is transmitting
  if (!isRecording && currentRoom) {
    pttButton.disabled = true;
    pttButton.style.opacity = '0.3';
  }
});
socket.on('peer-talking-stop', ({
  peerId: talker
}) => {
  activeTalkers.delete(talker);
  const li = document.getElementById(`peer-item-${talker}`);
  if (li) li.classList.remove('talking');
  if (activeTalkers.size === 0) hideIncomingIndicator();
  playReceptionSound('end');

  // Re-enable PTT when no one else is transmitting
  if (activeTalkers.size === 0 && currentRoom && !isRecording) {
    pttButton.disabled = false;
    pttButton.style.opacity = '';
  }
});
function showIncomingIndicator() {
  if (!incomingIndicator) return;
  incomingIndicator.classList.add('active');
}
function hideIncomingIndicator() {
  if (!incomingIndicator) return;
  incomingIndicator.classList.remove('active');
}
function playTransmissionSound(type = 'start') {
  try {
    const ctx = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    audioContext = ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    const duration = 0.2;
    const freq = type === 'start' ? 800 : 600; // Higher pitch for start, lower for end
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.3, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  } catch (e) {
    // ignore audio context errors
  }
}
function playReceptionSound(type = 'start') {
  try {
    const ctx = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    audioContext = ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    const duration = 0.15;
    const freq = type === 'start' ? 1000 : 400; // Very high pitch for incoming start, low for end
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.4, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  } catch (e) {
    // ignore audio context errors
  }
}
/******/ })()
;
//# sourceMappingURL=bundle.js.map