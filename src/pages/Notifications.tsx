import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, CheckCircle, AlertCircle, Search, Trash2, Check } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';

const Notifications = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();

  useEffect(() => {
    fetchNotifications(currentPage, filter, searchTerm);
  }, [currentPage, filter, searchTerm]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
  };

  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p className="text-red-500">Error loading notifications: {error}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground mt-2">
              Stay updated with your CRM activities
            </p>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount} unread</Badge>
            )}
            <Button variant="outline" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Notifications</SelectItem>
              <SelectItem value="unread">Unread Only</SelectItem>
              <SelectItem value="read">Read Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification._id}
              className={`hover:shadow-lg transition-shadow ${
                !notification.read ? 'border-primary border-l-4' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${getColor(notification.type)}`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="font-semibold text-foreground">
                        {notification.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                        <div className="flex gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification._id)}
                              className="h-8 w-8 p-0"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(notification._id)}
                            className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More Button */}
        {notifications.length > 0 && !loading && (
          <div className="text-center">
            <Button variant="outline" onClick={handleLoadMore}>
              Load More
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Loading notifications...</p>
          </div>
        )}

        {/* Empty State */}
        {notifications.length === 0 && !loading && (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No notifications yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
