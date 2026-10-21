import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../config';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Create socket connection
      const newSocket = io(API_BASE_URL, {
        auth: {
          token: localStorage.getItem('token')
        },
        transports: ['websocket', 'polling']
      });

      // Connection events
      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setIsConnected(true);

        // (Re)join the personal room on every connect, so reminders still arrive after a reconnect
        newSocket.emit('join-activity-room', user.id);

        // Join role-based rooms for admin/manager users
        if (user.roles?.includes('admin')) {
          newSocket.emit('join-activity-room', 'admin');
          newSocket.emit('join-security-room', 'admin');
        }
        if (user.roles?.includes('manager')) {
          newSocket.emit('join-activity-room', 'manager');
          newSocket.emit('join-security-room', 'manager');
        }
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      setSocket(newSocket);

      // Cleanup on unmount or auth change
      return () => {
        console.log('Cleaning up socket connection');
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
      };
    } else {
      // Disconnect if not authenticated
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [isAuthenticated, user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
