import { useEffect, useRef } from 'react';
import io from 'socket.io-client';

export const useSocket = (url = 'http://localhost:5000') => {
  const socketRef = useRef();

  useEffect(() => {
    socketRef.current = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Connected to server');
    });

    socketRef.current.on('disconnect', () => {
      console.log('🔌 Disconnected from server');
    });

    socketRef.current.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [url]);

  return socketRef;
};