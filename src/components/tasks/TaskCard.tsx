import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  MessageSquare,
  MoreHorizontal,
  Edit,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';


interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'blocked' | 'completed';
  priority: 'low' | 'medium' | 'high';
  progress: number;
  assignedTo: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  category: string;
  dueDate: string;
  subTasks: Array<{
    title: string;
    isCompleted: boolean;
  }>;
  comments: Array<{
    text: string;
    createdBy: {
      _id: string;
      name: string;
    };
    createdAt: string;
  }>;
  createdAt: string;
  clientId?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    company?: string;
  };
}

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onStatusChange?: (taskId: string, status: Task['status']) => void;
  onClick?: (task: Task) => void;
  showActions?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  onClick,
  showActions = true
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'blocked':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-3 h-3" />;
      case 'in-progress':
        return <AlertTriangle className="w-3 h-3" />;
      case 'blocked':
        return <AlertTriangle className="w-3 h-3" />;
      case 'completed':
        return <CheckCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const completedSubTasks = task.subTasks?.filter(st => st.isCompleted).length || 0;
  const totalSubTasks = task.subTasks?.length || 0;
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';

  return (
    <Card
      className={`hover:shadow-md transition-shadow cursor-pointer ${isOverdue ? 'border-red-300' : ''}`}
      onClick={() => onClick?.(task)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{task.title}</h3>
              {task.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {task.description}
                </p>
              )}
            </div>
            </div>

          {/* Status and Priority */}
          <div className="flex items-center gap-2">
            <Badge className={`text-xs ${getStatusColor(task.status)}`}>
              <div className="flex items-center gap-1">
                {getStatusIcon(task.status)}
                {task.status.replace('-', ' ')}
              </div>
            </Badge>
            <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </Badge>
            {task.category && (
              <Badge variant="outline" className="text-xs">
                {task.category}
              </Badge>
            )}
          </div>

          {/* Progress */}
          {task.progress !== undefined && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Progress</span>
                <span>{task.progress}%</span>
              </div>
              <Progress value={task.progress} className="h-2" />
            </div>
          )}

          {/* Sub-tasks */}
          {totalSubTasks > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="w-3 h-3" />
              <span>{completedSubTasks}/{totalSubTasks} sub-tasks</span>
            </div>
          )}

          {/* Client Information */}
          {task.clientId && (
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded border">
              <User className="w-4 h-4 text-blue-600" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-blue-900 truncate">
                  {task.clientId.name}
                </div>
                <div className="text-xs text-blue-700 truncate">
                  {task.clientId.email}
                </div>
                {task.clientId.phone && (
                  <div className="text-xs text-blue-600 truncate">
                    {task.clientId.phone}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assignees */}
          {task.assignedTo && task.assignedTo.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {task.assignedTo.slice(0, 3).map((user) => (
                  <Avatar key={user._id} className="w-6 h-6 border-2 border-white">
                    <AvatarImage src="" alt={user.name} />
                    <AvatarFallback className="text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {task.assignedTo.length > 3 && (
                  <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                    <span className="text-xs text-gray-600">+{task.assignedTo.length - 3}</span>
                  </div>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {task.assignedTo.length === 1 ? '1 assignee' : `${task.assignedTo.length} assignees`}
              </span>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
             <span>
  {task.dueDate
    ? format(new Date(task.dueDate), 'MMM dd')
    : 'No date'}
</span>

              </div>
              {task.comments && task.comments.length > 0 && (
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  <span>{task.comments.length}</span>
                </div>
              )}
            </div>
            <span>{format(new Date(task.createdAt), 'MMM dd')}</span>
          </div>

          {/* Overdue indicator */}
          {isOverdue && (
            <div className="text-xs text-red-600 font-medium">
              Overdue
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;

