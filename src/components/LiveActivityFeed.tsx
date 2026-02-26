import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, User, FileText, MessageSquare, Shield, AlertTriangle } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

interface ActivityItem {
  id: string;
  activityType: string;
  description: string;
  userName: string;
  userRole: string;
  timestamp: string;
}

const LiveActivityFeed: React.FC = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    if (socket && user) {
      // Join activity room
      socket.emit('join-activity-room', user.id);

      // Listen for new activities
      socket.on('new-activity', (data) => {
        const newActivity: ActivityItem = {
          id: data.activity._id,
          activityType: data.activity.activityType,
          description: data.activity.description,
          userName: user.name || 'Unknown User',
          userRole: user.roles?.[0] || 'User',
          timestamp: data.activity.timestamp
        };

        setActivities(prev => [newActivity, ...prev.slice(0, 49)]); // Keep last 50 activities
      });

      return () => {
        socket.off('new-activity');
      };
    }
  }, [socket, user]);

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'login':
      case 'logout':
        return <User className="w-4 h-4" />;
      case 'customer_update':
      case 'task_update':
        return <FileText className="w-4 h-4" />;
      case 'chat_message':
        return <MessageSquare className="w-4 h-4" />;
      case 'note_create':
      case 'note_edit':
      case 'note_share':
        return <FileText className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case 'login':
        return 'bg-green-500';
      case 'logout':
        return 'bg-gray-500';
      case 'customer_update':
        return 'bg-blue-500';
      case 'task_update':
        return 'bg-purple-500';
      case 'chat_message':
        return 'bg-cyan-500';
      case 'note_create':
      case 'note_edit':
      case 'note_share':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="w-5 h-5 text-blue-500" />
          Live Activity Feed
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] px-4">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Activity className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No recent activities</p>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-600"
                >
                  <div className={`p-2 rounded-full ${getActivityColor(activity.activityType)} text-white flex-shrink-0`}>
                    {getActivityIcon(activity.activityType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">{activity.userName}</span>
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        {activity.userRole}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1 line-clamp-2">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(activity.timestamp), 'HH:mm:ss')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default LiveActivityFeed;
