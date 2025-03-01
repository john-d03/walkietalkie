import React from 'react';
import { Radio, Volume2, Mic, Battery, Signal, Lock, Power, Settings, Users } from 'lucide-react';
import { useWalkieTalkie } from '../hooks/useWalkieTalkie';
import { Message, User } from '../types';

const WalkieTalkie: React.FC = () => {
  const {
    userId,
    userName,
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
    stopTransmitting
  } = useWalkieTalkie();

  const formatMessage = (message: Message) => {
    if (message.system) {
      return message.text;
    }
    return `${message.sender}: ${message.text}`;
  };

  const getActiveUsers = () => {
    return users.filter(user => user.channel === channel);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className={`bg-gray-700 rounded-3xl overflow-hidden shadow-2xl border-8 ${power ? 'border-gray-600' : 'border-gray-800'} transition-all duration-300`}>
          {/* Display screen */}
          <div className={`p-4 ${power ? 'bg-black' : 'bg-gray-900'} transition-all duration-300`}>
            <div className={`h-40 rounded-lg p-3 overflow-hidden transition-all duration-300 ${power ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-transparent'}`}>
              {power && (
                <>
                  <div className="flex justify-between text-xs mb-2">
                    <div className="flex items-center gap-1">
                      <Battery size={14} className={batteryLevel < 20 ? 'animate-pulse text-red-400' : ''} />
                      <span>{batteryLevel}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Signal size={14} />
                      <span>{signalStrength}/5</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Lock size={14} className={locked ? 'text-red-400' : 'text-green-400'} />
                    </div>
                  </div>
                  
                  <div className="flex justify-between mb-2">
                    <div className="text-sm font-mono">CH: {channel.toString().padStart(2, '0')}</div>
                    <div className="text-sm font-mono">VOL: {volume}</div>
                    <div className="text-sm font-mono flex items-center gap-1">
                      <Users size={14} />
                      <span>{getActiveUsers().length}</span>
                    </div>
                  </div>
                  
                  <div className="h-20 overflow-y-auto font-mono text-xs">
                    {messages.map((msg, i) => (
                      <div key={i} className={`mb-1 ${msg.system ? 'text-yellow-300' : ''}`}>
                        &gt; {formatMessage(msg)}
                      </div>
                    ))}
                    {transmitting && (
                      <div className="animate-pulse text-red-300">&gt; *TRANSMITTING*</div>
                    )}
                    {users.filter(u => u.id !== userId && u.isTalking).map(user => (
                      <div key={`talking-${user.id}`} className="animate-pulse text-blue-300">
                        &gt; *{user.name} is talking*
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Controls */}
          <div className="bg-gray-800 p-4">
            <div className="grid grid-cols-3 gap-4">
              {/* Channel controls */}
              <div className="flex flex-col items-center">
                <button 
                  onClick={() => handleChannelChange(true)}
                  className={`w-12 h-12 rounded-full ${power && !locked ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-700'} flex items-center justify-center text-white font-bold text-xl transition-all`}
                >
                  +
                </button>
                <div className="my-2 text-white text-xs">CHANNEL</div>
                <button 
                  onClick={() => handleChannelChange(false)}
                  className={`w-12 h-12 rounded-full ${power && !locked ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-700'} flex items-center justify-center text-white font-bold text-xl transition-all`}
                >
                  -
                </button>
              </div>
              
              {/* Center controls */}
              <div className="flex flex-col items-center">
                <button 
                  onClick={togglePower}
                  className={`w-16 h-16 rounded-full ${power ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'} flex items-center justify-center text-white transition-all`}
                >
                  <Power size={24} />
                </button>
                <div className="my-2 text-white text-xs">POWER</div>
                <button 
                  onClick={toggleLock}
                  className={`w-12 h-12 rounded-full ${power ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-700'} flex items-center justify-center text-white transition-all`}
                >
                  <Settings size={20} />
                </button>
              </div>
              
              {/* Volume controls */}
              <div className="flex flex-col items-center">
                <button 
                  onClick={() => handleVolumeChange(true)}
                  className={`w-12 h-12 rounded-full ${power && !locked ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-700'} flex items-center justify-center text-white font-bold text-xl transition-all`}
                >
                  +
                </button>
                <div className="my-2 text-white text-xs">VOLUME</div>
                <button 
                  onClick={() => handleVolumeChange(false)}
                  className={`w-12 h-12 rounded-full ${power && !locked ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-700'} flex items-center justify-center text-white font-bold text-xl transition-all`}
                >
                  -
                </button>
              </div>
            </div>
            
            {/* Push to talk button */}
            <div className="mt-6 flex justify-center">
              <button 
                onMouseDown={startTransmitting}
                onMouseUp={stopTransmitting}
                onTouchStart={startTransmitting}
                onTouchEnd={stopTransmitting}
                onMouseLeave={() => transmitting && stopTransmitting()}
                className={`w-full py-6 rounded-lg ${power && !locked ? 'bg-yellow-600 hover:bg-yellow-500 active:bg-red-600' : 'bg-gray-700'} flex items-center justify-center gap-3 text-white font-bold transition-all`}
              >
                <Mic size={24} className={transmitting ? 'animate-pulse text-red-300' : ''} />
                <span>PUSH TO TALK</span>
              </button>
            </div>
          </div>
          
          {/* Bottom section with speaker */}
          <div className="bg-gray-900 p-4">
            <div className="grid grid-cols-5 gap-2">
              {[...Array(15)].map((_, i) => (
                <div key={i} className="h-3 bg-gray-800 rounded-full"></div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center text-gray-400 text-sm">
          <p>WalkieTalk™ Digital Radio Simulator</p>
          <p className="mt-2 text-xs">Press the power button to turn on the device</p>
          <p className="mt-1 text-xs">Your ID: {power ? userId : '----'}</p>
          <p className="mt-1 text-xs">Active users: {power ? getActiveUsers().length : 0}</p>
        </div>
      </div>
    </div>
  );
};

export default WalkieTalkie;