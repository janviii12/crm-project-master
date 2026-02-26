import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Clock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface FollowUp {
  _id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  status: 'pending' | 'completed' | 'missed';
  priority: 'low' | 'medium' | 'high';
  clientId: {
    _id: string;
    name: string;
    email: string;
    company: string;
  };
}

const ReminderWidget: React.FC = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const response = await axios.get('/api/followups/reminders');
      setReminders(response.data.data);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimeUntil = (date: string, time: string) => {
    const followUpDateTime = new Date(`${date.split('T')[0]}T${time}`);
    const now = new Date();
    const diffMs = followUpDateTime.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffMs < 0) {
      return 'Overdue';
    } else if (diffDays > 0) {
      return `In ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `In ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else if (diffMinutes > 0) {
      return `In ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    } else {
      return 'Now';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Upcoming Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="w-5 h-5 mr-2" />
          Upcoming Reminders
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reminders.length === 0 ? (
          <div className="text-center py-4">
            <AlertCircle className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">No upcoming reminders</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <div key={reminder._id} className="border rounded-lg p-3 bg-white">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-sm">{reminder.title}</h4>
                  <Badge className={`text-xs ${getPriorityColor(reminder.priority)}`}>
                    {reminder.priority}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center text-xs text-gray-600">
                    <User className="w-3 h-3 mr-1" />
                    {reminder.clientId.name}
                  </div>
                  <div className="flex items-center text-xs text-gray-600">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(reminder.date).toLocaleDateString()} at {reminder.time}
                  </div>
                  <div className="text-xs text-blue-600 font-medium">
                    {formatTimeUntil(reminder.date, reminder.time)}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 text-xs"
                  onClick={() => window.location.href = '/calendar'}
                >
                  View in Calendar
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReminderWidget;
