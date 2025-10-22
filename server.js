require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Create HTTP server
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

// Store rooms and their peers
const rooms = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-room', ({ roomId, peerId }, callback) => {
    try {
      socket.join(roomId);

      // Initialize room if it doesn't exist
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Map());
        console.log(`Room created: ${roomId}`);
      }

      const room = rooms.get(roomId);
      
      // Get existing peers before adding new one
      const existingPeers = Array.from(room.keys());
      
      room.set(peerId, { socketId: socket.id });

      console.log(`Peer ${peerId} joined room ${roomId}`);

      // Send existing peers list to the new joiner
      socket.emit('room-users', { peers: existingPeers });
      
      // Notify others in the room about the new peer
      socket.to(roomId).emit('peer-joined', { peerId });

      callback({ success: true });
    } catch (error) {
      console.error('Error joining room:', error);
      callback({ error: error.message });
    }
  });

  // Leave room explicitly without disconnecting socket
  socket.on('leave-room', ({ roomId, peerId }, callback) => {
    try {
      if (!rooms.has(roomId)) {
        return callback && callback({ error: 'Room not found' });
      }
      const roomPeers = rooms.get(roomId);
      if (!roomPeers.has(peerId)) {
        return callback && callback({ error: 'Peer not in room' });
      }
      // Remove peer
      roomPeers.delete(peerId);
      socket.leave(roomId);
      // Notify others
      socket.to(roomId).emit('peer-left', { peerId });
      // Delete room if empty
      if (roomPeers.size === 0) {
        rooms.delete(roomId);
        console.log(`Room ${roomId} deleted (empty)`);
      }
      callback && callback({ success: true });
      console.log(`Peer ${peerId} left room ${roomId}`);
    } catch (err) {
      console.error('Error leaving room:', err);
      callback && callback({ error: err.message });
    }
  });

  // Handle audio data from clients
  socket.on('audio-data', ({ roomId, peerId, audioData }) => {
    // Relay audio data to all other peers in the room
    socket.to(roomId).emit('audio-data', { peerId, audioData });
  });

  // PTT signaling
  socket.on('ptt-start', ({ roomId, peerId }) => {
    socket.to(roomId).emit('peer-talking-start', { peerId });
  });

  socket.on('ptt-stop', ({ roomId, peerId }) => {
    socket.to(roomId).emit('peer-talking-stop', { peerId });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);

    // Clean up peer from all rooms
    rooms.forEach((roomPeers, roomId) => {
      roomPeers.forEach((peerData, peerId) => {
        if (peerData.socketId === socket.id) {
          roomPeers.delete(peerId);

          // Notify others
          socket.to(roomId).emit('peer-left', { peerId });

          console.log(`Peer ${peerId} removed from room ${roomId}`);
        }
      });

      // Remove empty rooms
      if (roomPeers.size === 0) {
        rooms.delete(roomId);
        console.log(`Room ${roomId} deleted (empty)`);
      }
    });
  });
});

// Initialize server
function startServer() {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
  });
}

startServer();
