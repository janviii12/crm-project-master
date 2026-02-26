import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Briefcase, X, ChevronRight } from 'lucide-react';

interface Reminder {
  _id: string;
  title: string;
  description: string;
  time: string;
  clientName: string;
  clientCompany: string;
  handledBy: string;
  status: string;
  priority: string;
}

interface ReminderDate {
  date: string;
  count: number;
  reminders: Reminder[];
}

interface LoginReminderPopupProps {
  isOpen: boolean;
  onClose: () => void;
  reminderDates: ReminderDate[];
  onViewCalendar?: () => void;
}

const LoginReminderPopup: React.FC<LoginReminderPopupProps> = ({
  isOpen,
  onClose,
  reminderDates,
  onViewCalendar
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateString === today.toISOString().split('T')[0]) {
      return 'Today';
    } else if (dateString === tomorrow.toISOString().split('T')[0]) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'missed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalReminders = reminderDates.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calendar className="w-5 h-5 text-blue-600" />
            Upcoming Reminders
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {reminderDates.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No upcoming reminders</p>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  You have <strong>{totalReminders}</strong> reminder{totalReminders !== 1 ? 's' : ''} across <strong>{reminderDates.length}</strong> date{reminderDates.length !== 1 ? 's' : ''}
                </p>
              </div>

              {reminderDates.map((reminderDate) => (
                <Card key={reminderDate.date} className="overflow-hidden">
                  <CardHeader className="bg-gray-50 py-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        {formatDate(reminderDate.date)}
                      </span>
                      <Badge variant="outline" className="bg-white">
                        {reminderDate.count} reminder{reminderDate.count !== 1 ? 's' : ''}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 space-y-2">
                    {reminderDate.reminders.map((reminder) => (
                      <div 
                        key={reminder._id} 
                        className="border rounded-lg p-3 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-medium text-sm">{reminder.title}</h4>
                          <div className="flex gap-1">
                            <Badge className={`text-xs ${getPriorityColor(reminder.priority)}`}>
                              {reminder.priority}
                            </Badge>
                          </div>
                        </div>
                        
                        {reminder.description && (
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                            {reminder.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {reminder.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {reminder.clientName}
                          </span>
                          {reminder.clientCompany && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-3 h-3" />
                              {reminder.clientCompany}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>

        <div className="flex-shrink-0 flex justify-between items-center pt-4 border-t mt-4">
          <Button
            variant="outline"
            onClick={onClose}
          >
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
          {onViewCalendar && reminderDates.length > 0 && (
            <Button
              onClick={onViewCalendar}
              className="gap-2"
            >
              View in Calendar
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginReminderPopup;
