import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
let socket = null;

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  useEffect(() => {
    if (!socket) {
      socket = io(SOCKET_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10,
        reconnectionAttemptDelay: 1000
      });
    }

    const onConnect = () => {
      setIsConnected(true);
      setConnectionAttempts(0);
      console.log('Socket connected');
    };
    
    const onDisconnect = () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    };

    const onReconnectAttempt = () => {
      setConnectionAttempts(prev => prev + 1);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('reconnect_attempt', onReconnectAttempt);

    if (socket.connected) {
      setIsConnected(true);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('reconnect_attempt', onReconnectAttempt);
    };
  }, []);

  return { socket, isConnected, connectionAttempts };
};
