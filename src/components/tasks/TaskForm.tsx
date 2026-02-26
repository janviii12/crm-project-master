import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Plus,
  X,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Trash2
} from 'lucide-react';
import axiosInstance from '@/lib/axiosInstance';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface User {
  _id: string;
  name: string;
  email: string;
  role?: string;
}

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
}

interface Task {
  _id?: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'blocked' | 'completed';
  priority: 'low' | 'medium' | 'high';
  progress: number;
  assignedTo: string[];
  category: string;
  dueDate: string;
  subTasks: Array<{
    title: string;
    isCompleted: boolean;
  }>;
  clientId?: string;
}

interface TaskFormData {
  _id?: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'blocked' | 'completed';
  priority: 'low' | 'medium' | 'high';
  progress: number;
  assignedTo: string[];
  category: string;
  dueDate: string;
  subTasks: Array<{
    title: string;
    isCompleted: boolean;
  }>;
  clientId?: string;
}

interface TaskFormProps {
  task?: Task;
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: TaskFormData) => void;
  trigger?: React.ReactNode;
  users?: User[];
}

const TaskForm: React.FC<TaskFormProps> = ({
  task,
  isOpen,
  onClose,
  onSave,
  trigger,
  users: propUsers
}) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    progress: 0,
    assignedTo: [],
    category: '',
    dueDate: '',
    subTasks: []
  });

  // Use prop users if provided, otherwise fetch users for assignment - filter to only executives
  useEffect(() => {
    if (propUsers) {
      // Filter to only users with role 'executive'
      const executives = propUsers.filter((user: any) => user.roles && user.roles.includes('executive'));
      setUsers(executives);
    } else if (isOpen) {
      const fetchUsers = async () => {
        try {
          const response = await axiosInstance.get('/api/users');
          if (response.data.success) {
            // Filter to only users with role 'executive'
            const executives = response.data.data.filter((user: any) => user.roles && user.roles.includes('executive'));
            setUsers(executives);
          }
        } catch (error) {
          console.error('Error fetching users:', error);
        }
      };
      fetchUsers();
    }
  }, [isOpen, propUsers]);

  // Fetch customers when dialog opens
  useEffect(() => {
    if (isOpen) {
      const fetchCustomers = async () => {
        try {
          const response = await axiosInstance.get('/api/customers?page=1&limit=1000'); // Fetch all customers for dropdown
          if (response.data.success) {
            setCustomers(response.data.data);
          }
        } catch (error) {
          console.error('Error fetching customers:', error);
        }
      };
      fetchCustomers();
    }
  }, [isOpen]);

  // Initialize form data when editing
  useEffect(() => {
    if (task && isOpen) {
      setFormData({
        _id: task._id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        progress: task.progress,
        assignedTo: task.assignedTo,
        category: task.category,
        dueDate: task.dueDate,
        subTasks: task.subTasks,
        clientId: task.clientId
      });
    } else if (!task && isOpen) {
      // Reset form for new task
      setFormData({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        progress: 0,
        assignedTo: [],
        category: '',
        dueDate: '',
        subTasks: []
      });
    }
  }, [task, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        toast.error('Title is required');
        return;
      }

      if (!formData.dueDate) {
        toast.error('Due date is required');
        return;
      }

      // Validate assigned users exist
      if (formData.assignedTo.length > 0) {
        const validUsers = formData.assignedTo.filter(userId =>
          users.some(user => user._id === userId)
        );
        if (validUsers.length !== formData.assignedTo.length) {
          toast.error('Some assigned users are invalid');
          return;
        }
      }

      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const addSubTask = () => {
    setFormData(prev => ({
      ...prev,
      subTasks: [...prev.subTasks, { title: '', isCompleted: false }]
    }));
  };

  const updateSubTask = (index: number, title: string) => {
    setFormData(prev => ({
      ...prev,
      subTasks: prev.subTasks.map((st, i) =>
        i === index ? { ...st, title } : st
      )
    }));
  };

  const toggleSubTask = (index: number) => {
    setFormData(prev => ({
      ...prev,
      subTasks: prev.subTasks.map((st, i) =>
        i === index ? { ...st, isCompleted: !st.isCompleted } : st
      )
    }));
  };

  const removeSubTask = (index: number) => {
    setFormData(prev => ({
      ...prev,
      subTasks: prev.subTasks.filter((_, i) => i !== index)
    }));
  };

  const addAssignee = (userId: string) => {
    if (!formData.assignedTo.includes(userId)) {
      setFormData(prev => ({
        ...prev,
        assignedTo: [...prev.assignedTo, userId]
      }));
    }
  };

  const removeAssignee = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.filter(id => id !== userId)
    }));
  };

  const selectedUsers = users.filter(user => formData.assignedTo.includes(user._id));
  const availableUsers = users.filter(user => !formData.assignedTo.includes(user._id));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {task ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter task title"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter task description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g., Sales, Support, Marketing"
                />
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: 'low' | 'medium' | 'high') =>
                    setFormData(prev => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: Task['status']) =>
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="progress">Progress (%)</Label>
              <div className="space-y-2">
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    progress: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                  }))}
                />
                <Progress value={formData.progress} className="h-2" />
              </div>
            </div>
          </div>

          {/* Client Selection */}
          <div className="space-y-3">
            <Label>Client</Label>
            <Select
              value={formData.clientId || 'none'}
              onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value === 'none' ? undefined : value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a client..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No client</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer._id} value={customer._id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {customer.name ? customer.name.charAt(0).toUpperCase() : 'C'}
                        </AvatarFallback>
                      </Avatar>
                      {customer.name} - {customer.email}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.clientId && (
              <div className="text-sm text-muted-foreground">
                Selected client: {customers.find(c => c._id === formData.clientId)?.name}
              </div>
            )}
          </div>

          {/* Assignees */}
          <div className="space-y-3">
            <Label>Assigned To</Label>

            {/* Selected Assignees */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <Badge key={user._id} variant="secondary" className="flex items-center gap-1">
                    <Avatar className="w-4 h-4">
                      <AvatarFallback className="text-xs">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    {user.name || 'Unknown User'}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAssignee(user._id)}
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Add Assignee */}
            <Select onValueChange={addAssignee}>
              <SelectTrigger>
                <SelectValue placeholder="Add assignee..." />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map((user) => (
                  <SelectItem key={user._id} value={user._id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      {user.name || 'Unknown User'} - {user.email}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sub-tasks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Sub-tasks</Label>
              <Button type="button" variant="outline" size="sm" onClick={addSubTask}>
                <Plus className="w-4 h-4 mr-1" />
                Add Sub-task
              </Button>
            </div>

            {formData.subTasks.length > 0 && (
              <div className="space-y-2">
                {formData.subTasks.map((subTask, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSubTask(index)}
                      className="h-6 w-6 p-0"
                    >
                      {subTask.isCompleted ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-gray-300 rounded" />
                      )}
                    </Button>
                    <Input
                      value={subTask.title}
                      onChange={(e) => updateSubTask(index, e.target.value)}
                      placeholder="Sub-task title"
                      className={subTask.isCompleted ? 'line-through text-muted-foreground' : ''}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSubTask(index)}
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (task ? 'Update Task' : 'Create Task')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskForm;
