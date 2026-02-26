import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import axiosInstance from '../lib/axiosInstance';

interface Notification {
  _id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: (page?: number, filter?: string, search?: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications
  const fetchNotifications = async (page = 1, filter = 'all', search = '') => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        filter,
        search
      });

      const response = await axiosInstance.get(`/api/notifications?${params}`);

      if (response.data.success) {
        if (page === 1) {
          setNotifications(response.data.data);
        } else {
          setNotifications(prev => [...prev, ...response.data.data]);
        }
      } else {
        setError(response.data.message || 'Failed to fetch notifications');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('fetchNotifications error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get unread count
  const refreshUnreadCount = async () => {
    if (!user) return;

    try {
      const response = await axiosInstance.get('/api/notifications/unread-count');

      if (response.data.success) {
        setUnreadCount(response.data.count);
      }
    } catch (err) {
      console.error('refreshUnreadCount error:', err);
    }
  };

  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      const response = await axiosInstance.patch(`/api/notifications/${id}/read`);

      if (response.data.success) {
        setNotifications(prev =>
          prev.map(notification =>
            notification._id === id
              ? { ...notification, read: true, readAt: new Date().toISOString() }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('markAsRead error:', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await axiosInstance.patch('/api/notifications/mark-all-read');

      if (response.data.success) {
        setNotifications(prev =>
          prev.map(notification => ({
            ...notification,
            read: true,
            readAt: new Date().toISOString()
          }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('markAllAsRead error:', err);
    }
  };

  // Delete notification
  const deleteNotification = async (id: string) => {
    try {
      const response = await axiosInstance.delete(`/api/notifications/${id}`);

      if (response.data.success) {
        setNotifications(prev => prev.filter(notification => notification._id !== id));
        // Update unread count if deleted notification was unread
        const deletedNotification = notifications.find(n => n._id === id);
        if (deletedNotification && !deletedNotification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error('deleteNotification error:', err);
    }
  };

  // Initialize notifications when user logs in
  useEffect(() => {
    if (user) {
      fetchNotifications();
      refreshUnreadCount();

      // Set up polling for real-time updates
      const interval = setInterval(() => {
        refreshUnreadCount();
      }, 30000); // Poll every 30 seconds

      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  // Listen for real-time socket events
  useEffect(() => {
    if (socket && user) {
      // Join activity room
      socket.emit('join-activity-room', user.id);

      // Listen for new notifications
      socket.on('new-notification', (data) => {
        setNotifications(prev => [data.notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });

      // Listen for new activities
      socket.on('new-activity', (data) => {
        // Handle activity updates (can be used for live activity feed)
        console.log('New activity:', data);
      });

      return () => {
        socket.off('new-notification');
        socket.off('new-activity');
      };
    }
  }, [socket, user]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshUnreadCount
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
