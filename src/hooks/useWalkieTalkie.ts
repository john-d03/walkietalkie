import { useState, useEffect, useRef, useCallback } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { v4 as uuidv4 } from 'uuid';
import { User, Message } from '../types';

export const useWalkieTalkie = (initialChannel = 1) => {
  const [userId] = useState(uuidv4().substring(0, 8));
  const [userName, setUserName] = useState(`User-${userId.substring(0, 4)}`);
  const [channel, setChannel] = useState(initialChannel);
  const [power, setPower] = useState(false);
  const [volume, setVolume] = useState(5);
  const [transmitting, setTransmitting] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(80);
  const [signalStrength, setSignalStrength] = useState(4);
  const [messages, setMessages] = useState<Message[]>([]);
  const [locked, setLocked] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  
  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<{ [key: string]: DataConnection }>({});
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioElementsRef = useRef<{ [key: string]: HTMLAudioElement }>({});
  const pttSoundRef = useRef<HTMLAudioElement | null>(null);
  const pttEndSoundRef = useRef<HTMLAudioElement | null>(null);
  const activePeerCallsRef = useRef<{ [key: string]: any }>({});
  const attemptedPeersRef = useRef<Set<string>>(new Set());
  const originalConsoleErrorRef = useRef<typeof console.error | null>(null);
  
  // Initialize PeerJS connection
  useEffect(() => {
    if (power && !peerRef.current) {
      // Store original console.error for later restoration
      if (!originalConsoleErrorRef.current) {
        originalConsoleErrorRef.current = console.error;
      }
      
      const peer = new Peer(`walkie-${userId}`, {
        debug: 0, // Disable debug output completely
      });
      
      peer.on('open', (id) => {
        console.log('My peer ID is: ' + id);
        addSystemMessage(`Connected to network as ${userName}`);
        
        // After connection is established, try to discover peers
        discoverPeers();
      });
      
      peer.on('connection', (conn) => {
        handleNewConnection(conn);
      });
      
      peer.on('error', (err) => {
        // Only log critical errors, ignore peer-unavailable errors
        if (err.type !== 'peer-unavailable') {
          console.error('PeerJS error:', err);
          addSystemMessage(`Connection error: ${err.type}`);
          setSignalStrength(1);
        }
      });
      
      peerRef.current = peer;
      
      // Set up audio call handling
      peer.on('call', (call) => {
        if (power) {
          console.log('Received call from:', call.peer);
          
          // Answer the call with an empty audio stream if we don't have permission yet
          navigator.mediaDevices.getUserMedia({ audio: true })
            .then((stream) => {
              // Answer the call with our audio stream
              call.answer(stream);
              
              // Handle incoming audio
              call.on('stream', (remoteStream) => {
                console.log('Received remote stream from:', call.peer);
                
                // Create audio element for this peer if it doesn't exist
                if (!audioElementsRef.current[call.peer]) {
                  const audio = new Audio();
                  audio.srcObject = remoteStream;
                  audio.volume = volume / 10;
                  audio.autoplay = true;
                  audioElementsRef.current[call.peer] = audio;
                  
                  // Ensure audio plays
                  audio.play().catch(e => {
                    console.error("Error playing audio:", e);
                    // Try to play again with user interaction
                    document.addEventListener('click', () => {
                      audio.play().catch(err => console.error("Still can't play audio:", err));
                    }, { once: true });
                  });
                } else {
                  // Update existing audio element
                  const audio = audioElementsRef.current[call.peer];
                  audio.srcObject = remoteStream;
                  audio.volume = volume / 10;
                  audio.play().catch(e => console.error("Error playing audio:", e));
                }
              });
            })
            .catch(err => {
              console.error('Failed to get local stream', err);
              addSystemMessage('Microphone access denied. Check permissions.');
              
              // Still answer the call, but without sending our audio
              call.answer();
              
              call.on('stream', (remoteStream) => {
                if (!audioElementsRef.current[call.peer]) {
                  const audio = new Audio();
                  audio.srcObject = remoteStream;
                  audio.volume = volume / 10;
                  audio.autoplay = true;
                  audioElementsRef.current[call.peer] = audio;
                  audio.play().catch(e => console.error("Error playing audio:", e));
                }
              });
            });
        }
      });
    }
    
    return () => {
      if (peerRef.current && !power) {
        Object.values(connectionsRef.current).forEach(conn => conn.close());
        connectionsRef.current = {};
        
        // Close all active calls
        Object.values(activePeerCallsRef.current).forEach(call => {
          if (call && typeof call.close === 'function') {
            call.close();
          }
        });
        activePeerCallsRef.current = {};
        
        peerRef.current.destroy();
        peerRef.current = null;
        
        // Clear attempted peers list when powering off
        attemptedPeersRef.current.clear();
        
        // Restore original console.error if it was replaced
        if (originalConsoleErrorRef.current) {
          console.error = originalConsoleErrorRef.current;
          originalConsoleErrorRef.current = null;
        }
      }
    };
  }, [power, userId, userName]);
  
  // Create and preload PTT sounds
  useEffect(() => {
    // Function to play a beep directly
    const playBeep = (frequency: number, duration: number): void => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency; // frequency in hertz
        
        gainNode.gain.value = 0.1; // volume
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Start and stop the oscillator
        oscillator.start();
        setTimeout(() => {
          oscillator.stop();
        }, duration);
      } catch (err) {
        console.error("Error playing beep:", err);
      }
    };
    
    // Store the play functions in refs
    pttSoundRef.current = {
      play: () => playBeep(1000, 100)
    } as any;
    
    pttEndSoundRef.current = {
      play: () => playBeep(800, 100)
    } as any;
    
    return () => {
      pttSoundRef.current = null;
      pttEndSoundRef.current = null;
    };
  }, []);
  
  // Update audio volume when volume changes
  useEffect(() => {
    Object.values(audioElementsRef.current).forEach(audio => {
      audio.volume = volume / 10;
    });
  }, [volume]);
  
  // Handle channel changes
  useEffect(() => {
    if (power && peerRef.current) {
      // Disconnect from all peers
      Object.values(connectionsRef.current).forEach(conn => conn.close());
      connectionsRef.current = {};
      
      // Close all active calls
      Object.values(activePeerCallsRef.current).forEach(call => {
        if (call && typeof call.close === 'function') {
          call.close();
        }
      });
      activePeerCallsRef.current = {};
      
      setUsers([]);
      
      // Reset attempted peers when changing channels
      attemptedPeersRef.current.clear();
      
      // Connect to channel server (simulated with a channel ID)
      connectToChannelPeers();
      
      addSystemMessage(`Switched to channel ${channel}`);
      
      // Discover peers on this channel
      discoverPeers();
    }
  }, [channel, power]);
  
  // Simulate battery drain
  useEffect(() => {
    if (power) {
      const interval = setInterval(() => {
        setBatteryLevel(prev => Math.max(0, prev - 1));
      }, 30000); // Drain 1% every 30 seconds
      return () => clearInterval(interval);
    }
  }, [power]);
  
  // Simulate random signal strength changes
  useEffect(() => {
    if (power) {
      const interval = setInterval(() => {
        setSignalStrength(Math.floor(Math.random() * 5) + 1);
      }, 15000); // Change every 15 seconds
      return () => clearInterval(interval);
    }
  }, [power]);
  
  // Handle audio stream setup
  useEffect(() => {
    if (power) {
      // Set up audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      // Clean up audio elements when component unmounts
      return () => {
        Object.values(audioElementsRef.current).forEach(el => {
          el.pause();
          el.srcObject = null;
        });
        audioElementsRef.current = {};
        
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach(track => track.stop());
          audioStreamRef.current = null;
        }
      };
    }
  }, [power]);
  
  // Periodically discover peers
  useEffect(() => {
    if (power) {
      const interval = setInterval(() => {
        discoverPeers();
      }, 60000); // Try to discover peers every 60 seconds (reduced frequency)
      
      return () => clearInterval(interval);
    }
  }, [power]);
  
  const discoverPeers = useCallback(() => {
    // In a real app, you would query a server for peers
    // For this demo, we'll simulate by connecting to peers with a specific ID pattern
    
    // Temporarily override console.error to suppress peer discovery errors
    const originalError = console.error;
    console.error = (...args: any[]) => {
      // Filter out PeerJS connection errors for random peers
      const errorMessage = args.join(' ');
      if (errorMessage.includes('PeerJS') && 
          (errorMessage.includes('Could not connect to peer walkie-random') || 
           errorMessage.includes('Could not connect to peer walkie-channel'))) {
        return; // Silently ignore these errors
      }
      originalError.apply(console, args);
    };
    
    try {
      // Generate a random peer ID to simulate finding a new peer
      const randomId = Math.floor(Math.random() * 1000);
      const randomPeerId = `walkie-random-${randomId}`;
      
      // Try to connect to this random peer (simulates discovering new peers)
      if (!attemptedPeersRef.current.has(randomPeerId)) {
        attemptedPeersRef.current.add(randomPeerId);
        connectToPeer(randomPeerId, true);
      }
      
      // Also try to connect to peers with similar channel IDs
      for (let i = 1; i <= 3; i++) {
        const channelPeerId = `walkie-channel-${channel}-${i}`;
        if (!attemptedPeersRef.current.has(channelPeerId)) {
          attemptedPeersRef.current.add(channelPeerId);
          connectToPeer(channelPeerId, true);
        }
      }
    } finally {
      // Restore original console.error
      setTimeout(() => {
        console.error = originalError;
      }, 1000); // Delay restoration to catch any async errors
    }
  }, [channel]);
  
  const connectToChannelPeers = useCallback(() => {
    // Broadcast our presence to the channel
    broadcastToPeers({
      type: 'user_joined',
      user: {
        id: userId,
        name: userName,
        channel: channel,
        isTalking: false
      }
    });
    
    // Add ourselves to the users list
    setUsers(prev => {
      if (!prev.find(u => u.id === userId)) {
        return [...prev, {
          id: userId,
          name: userName,
          channel: channel,
          isTalking: false
        }];
      }
      return prev;
    });
  }, [channel, userId, userName]);
  
  const handleNewConnection = useCallback((conn: DataConnection) => {
    conn.on('open', () => {
      console.log('Connection opened with peer:', conn.peer);
      connectionsRef.current[conn.peer] = conn;
      
      // Send our user info
      conn.send({
        type: 'user_info',
        user: {
          id: userId,
          name: userName,
          channel: channel,
          isTalking: transmitting
        }
      });
    });
    
    conn.on('data', (data: any) => {
      console.log('Received data:', data);
      
      if (data.type === 'user_info' || data.type === 'user_joined') {
        // Add or update user in our list
        setUsers(prev => {
          const existingUserIndex = prev.findIndex(u => u.id === data.user.id);
          if (existingUserIndex >= 0) {
            const updatedUsers = [...prev];
            updatedUsers[existingUserIndex] = data.user;
            return updatedUsers;
          } else {
            addSystemMessage(`${data.user.name} joined channel ${channel}`);
            return [...prev, data.user];
          }
        });
      } else if (data.type === 'user_left') {
        // Remove user from our list
        setUsers(prev => prev.filter(u => u.id !== data.userId));
        addSystemMessage(`${data.userName || 'A user'} left channel ${channel}`);
      } else if (data.type === 'talking_status') {
        // Update user's talking status
        setUsers(prev => {
          return prev.map(u => {
            if (u.id === data.userId) {
              return { ...u, isTalking: data.isTalking };
            }
            return u;
          });
        });
      } else if (data.type === 'text_message') {
        // Add text message to messages
        addMessage({
          id: data.id || uuidv4(),
          text: data.text,
          sender: data.sender,
          timestamp: data.timestamp || Date.now()
        });
      }
    });
    
    conn.on('close', () => {
      console.log('Connection closed with peer:', conn.peer);
      delete connectionsRef.current[conn.peer];
    });
    
    conn.on('error', (err) => {
      // Only log non-discovery related connection errors
      if (!conn.peer.includes('walkie-random') && !conn.peer.includes('walkie-channel')) {
        console.error('Connection error:', err);
      }
      delete connectionsRef.current[conn.peer];
    });
  }, [channel, transmitting, userId, userName]);
  
  const broadcastToPeers = useCallback((data: any) => {
    Object.values(connectionsRef.current).forEach(conn => {
      if (conn.open) {
        conn.send(data);
      }
    });
  }, []);
  
  const connectToPeer = useCallback((peerId: string, silent = false) => {
    if (!peerRef.current) return;
    
    // Don't connect to ourselves or if already connected
    if (peerId === `walkie-${userId}` || connectionsRef.current[peerId]) {
      return;
    }
    
    try {
      // For silent connections (discovery attempts), we don't need error handling
      // as we've already overridden console.error in the discoverPeers function
      const conn = peerRef.current.connect(peerId, { reliable: true });
      
      // For discovery connections, use minimal error handling
      if (silent) {
        conn.on('error', () => {
          // Silently ignore errors for discovery connections
        });
      }
      
      handleNewConnection(conn);
    } catch (err) {
      // Only log errors for non-silent connection attempts
      if (!silent) {
        console.error('Error connecting to peer:', err);
      }
    }
  }, [handleNewConnection, userId]);
  
  const startTransmitting = useCallback(async () => {
    if (!power || locked) return;
    
    try {
      // Play PTT start sound using AudioContext for better compatibility
      if (pttSoundRef.current && typeof pttSoundRef.current.play === 'function') {
        try {
          pttSoundRef.current.play();
        } catch (e) {
          console.error("Error playing PTT sound:", e);
          // Fallback to a simple beep using AudioContext
          try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.value = 1000; // frequency in hertz
            
            gainNode.gain.value = 0.1; // volume
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.start();
            setTimeout(() => oscillator.stop(), 100);
          } catch (err) {
            console.error("Fallback beep failed:", err);
          }
        }
      }
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      
      // Update our talking status
      setTransmitting(true);
      
      // Broadcast talking status to peers
      broadcastToPeers({
        type: 'talking_status',
        userId: userId,
        isTalking: true
      });
      
      // Call all peers with our audio stream
      Object.keys(connectionsRef.current).forEach(peerId => {
        if (peerRef.current && stream) {
          console.log('Calling peer:', peerId);
          
          try {
            // Extract the actual peer ID from the connection key
            const actualPeerId = peerId;
            
            // Create a call to this peer
            const call = peerRef.current.call(actualPeerId, stream);
            
            // Store the call reference
            activePeerCallsRef.current[actualPeerId] = call;
            
            call.on('stream', (remoteStream) => {
              console.log('Got stream from peer we called:', actualPeerId);
            });
            
            call.on('error', (err) => {
              console.error('Call error:', err);
              delete activePeerCallsRef.current[actualPeerId];
            });
            
            call.on('close', () => {
              console.log('Call closed with:', actualPeerId);
              delete activePeerCallsRef.current[actualPeerId];
            });
          } catch (err) {
            console.error('Error calling peer:', err);
          }
        }
      });
      
      addSystemMessage('Transmitting...');
    } catch (err) {
      console.error('Error accessing microphone:', err);
      addSystemMessage('Error accessing microphone. Check permissions.');
    }
  }, [broadcastToPeers, locked, power, userId]);
  
  const stopTransmitting = useCallback(() => {
    // Play PTT end sound
    if (pttEndSoundRef.current && typeof pttEndSoundRef.current.play === 'function') {
      try {
        pttEndSoundRef.current.play();
      } catch (e) {
        console.error("Error playing PTT end sound:", e);
        // Fallback to a simple beep using AudioContext
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.type = 'sine';
          oscillator.frequency.value = 800; // frequency in hertz
          
          gainNode.gain.value = 0.1; // volume
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.start();
          setTimeout(() => oscillator.stop(), 100);
        } catch (err) {
          console.error("Fallback beep failed:", err);
        }
      }
    }
    
    setTransmitting(false);
    
    // Broadcast talking status to peers
    broadcastToPeers({
      type: 'talking_status',
      userId: userId,
      isTalking: false
    });
    
    // Close all active calls
    Object.entries(activePeerCallsRef.current).forEach(([peerId, call]) => {
      if (call && typeof call.close === 'function') {
        call.close();
      }
    });
    activePeerCallsRef.current = {};
    
    // Stop microphone stream
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    
    addSystemMessage('Transmission ended');
  }, [broadcastToPeers, userId]);
  
  const sendTextMessage = useCallback((text: string) => {
    if (!power || !text.trim()) return;
    
    const messageData = {
      id: uuidv4(),
      text: text,
      sender: userName,
      timestamp: Date.now()
    };
    
    // Add message to our own list
    addMessage(messageData);
    
    // Broadcast message to peers
    broadcastToPeers({
      type: 'text_message',
      ...messageData
    });
  }, [broadcastToPeers, power, userName]);
  
  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [message, ...prev.slice(0, 19)]);
  }, []);
  
  const addSystemMessage = useCallback((text: string) => {
    addMessage({
      id: uuidv4(),
      text,
      sender: 'System',
      timestamp: Date.now(),
      system: true
    });
  }, [addMessage]);
  
  const togglePower = useCallback(() => {
    setPower(prev => !prev);
    if (!power) {
      setMessages([{
        id: uuidv4(),
        text: '*Power on* Welcome to WalkieTalk',
        sender: 'System',
        timestamp: Date.now(),
        system: true
      }]);
    } else {
      // Disconnect from all peers
      Object.values(connectionsRef.current).forEach(conn => {
        conn.send({
          type: 'user_left',
          userId: userId,
          userName: userName
        });
        conn.close();
      });
      connectionsRef.current = {};
      
      // Close all active calls
      Object.values(activePeerCallsRef.current).forEach(call => {
        if (call && typeof call.close === 'function') {
          call.close();
        }
      });
      activePeerCallsRef.current = {};
      
      // Clear attempted peers list when powering off
      attemptedPeersRef.current.clear();
      
      // Restore original console.error if it was replaced
      if (originalConsoleErrorRef.current) {
        console.error = originalConsoleErrorRef.current;
        originalConsoleErrorRef.current = null;
      }
      
      setMessages([]);
      setTransmitting(false);
      setUsers([]);
    }
  }, [power, userId, userName]);
  
  const toggleLock = useCallback(() => {
    if (power) {
      setLocked(prev => !prev);
      addSystemMessage(locked ? '*Controls unlocked*' : '*Controls locked*');
    }
  }, [addSystemMessage, locked, power]);
  
  const handleChannelChange = useCallback((increment: boolean) => {
    if (power && !locked) {
      setChannel(prev => {
        if (increment) {
          return prev < 16 ? prev + 1 : 1;
        } else {
          return prev > 1 ? prev - 1 : 16;
        }
      });
    }
  }, [locked, power]);
  
  const handleVolumeChange = useCallback((increment: boolean) => {
    if (power && !locked) {
      setVolume(prev => {
        if (increment) {
          return prev < 10 ? prev + 1 : 10;
        } else {
          return prev > 0 ? prev - 1 : 0;
        }
      });
    }
  }, [locked, power]);
  
  return {
    userId,
    userName,
    setUserName,
    channel,
    power,
    volume,
    transmitting,
    batteryLevel,
    signalStrength,
    messages,
    locked,
    users,
    togglePower,
    toggleLock,
    handleChannelChange,
    handleVolumeChange,
    startTransmitting,
    stopTransmitting,
    sendTextMessage
  };
};