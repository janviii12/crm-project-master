import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Mail, Phone, FileText, Download, Check, Clock, MessageSquare, Loader2, RotateCcw, Target, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import axiosInstance from '../lib/axiosInstance';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface TaskManagementTask {
  _id: string;
  type: 'task';
  title: string;
  description: string;
  status: "pending" | "in-progress" | "blocked" | "completed";
  priority: "low" | "medium" | "high";
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
    _id?: string;
    text: string;
    createdBy: {
      _id: string;
      name: string;
    };
    createdAt: string;
  }>;
  createdAt: string;
}

interface CustomerTask {
  _id: string;
  type: 'customer';
  name: string;
  email: string;
  phone: string;
  serviceType?: string;
  address?: string;
  remarks?: string;
  status: "pending" | "in-progress" | "blocked" | "completed";
  files?: Array<{
    fileOriginalName: string;
    filePath: string;
  }>;
  createdAt: string;
}

type Task = TaskManagementTask | CustomerTask;

const MyTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [updatingTask, setUpdatingTask] = useState<string | null>(null);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [reassignTaskId, setReassignTaskId] = useState<string | null>(null);
  const [newAssignedStaff, setNewAssignedStaff] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [reassigning, setReassigning] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [showViewWorkDialog, setShowViewWorkDialog] = useState(false);
  const [viewWorkTask, setViewWorkTask] = useState<Task | null>(null);
  const [newComment, setNewComment] = useState('');
  const [showAddCommentDialog, setShowAddCommentDialog] = useState(false);
  const [commentTask, setCommentTask] = useState<Task | null>(null);
  const [commentText, setCommentText] = useState('');
  const [addingComment, setAddingComment] = useState(false);

  // Fetch assigned tasks and staff list
  useEffect(() => {
    const fetchData = async () => {
      try {
        const allTasks: Task[] = [];

        // Fetch task management tasks
        const taskResponse = await axiosInstance.get('/api/tasks');
        if (taskResponse.data.success && Array.isArray(taskResponse.data.data)) {
          const assignedTasks = taskResponse.data.data.filter((task: TaskManagementTask) =>
            task.assignedTo && Array.isArray(task.assignedTo) && task.assignedTo.some(assignedUser => assignedUser._id === user?.id)
          );
          allTasks.push(...assignedTasks);
        }

        setTasks(allTasks);

        // Fetch staff list for reassignment
        const staffResponse = await axiosInstance.get('/api/users/staff');
        if (staffResponse.data.success && Array.isArray(staffResponse.data.data)) {
          setStaffList(staffResponse.data.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load assigned tasks');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);
console.log("Loaded tasks:", tasks);

  const handleSendNotification = async () => {
    if (!selectedTask || !notificationMessage.trim()) return;

    try {
      // Here you would implement the notification sending logic
      // For now, we'll just show a success message
      const recipientName = selectedTask.type === 'customer' ? selectedTask.name : selectedTask.title;
      toast.success(`Notification sent to ${recipientName}`);
      setShowNotificationDialog(false);
      setNotificationMessage('');
      setSelectedTask(null);
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    }
  };

  const handleMarkComplete = async (taskId: string, taskType: string) => {
    setUpdatingTask(taskId);
    try {
      const endpoint = taskType === 'customer' ? `/api/customers/${taskId}/status` : `/api/tasks/${taskId}/status`;
      const method = taskType === 'customer' ? 'put' : 'patch';
      const response = await axiosInstance[method](endpoint, {
        status: 'completed'
      });
      if (response.data.success) {
        setTasks(tasks.map(task =>
          task._id === taskId ? { ...task, status: 'completed' } : task
        ));
        toast.success('Task marked as completed');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task status');
    } finally {
      setUpdatingTask(null);
    }
  };

  const handleStartWork = async (taskId: string, taskType: string) => {
    setUpdatingTask(taskId);
    try {
      const endpoint = taskType === 'customer' ? `/api/customers/${taskId}/status` : `/api/tasks/${taskId}/status`;
      const method = taskType === 'customer' ? 'put' : 'patch';
      const response = await axiosInstance[method](endpoint, {
        status: 'in-progress'
      });
      if (response.data.success) {
        setTasks(tasks.map(task =>
          task._id === taskId ? { ...task, status: 'in-progress' } : task
        ));
        toast.success('Work started on this task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to start work');
    } finally {
      setUpdatingTask(null);
    }
  };

  const handleReassignTask = async () => {
    if (!reassignTaskId || !newAssignedStaff) return;

    setReassigning(true);
    try{
      const response = await axiosInstance.patch(`/api/customers/${reassignTaskId}/reassign`, {
        newAssignedStaff,
        reason: reassignReason.trim() || undefined
      });
      if (response.data.success) {
        // Remove the task from current user's list since it's reassigned
        setTasks(tasks.filter(task => task._id !== reassignTaskId));
        setShowReassignDialog(false);
        setReassignTaskId(null);
        setNewAssignedStaff('');
        setReassignReason('');
        toast.success('Task reassigned successfully');
      }
    } catch (error: any) {
      console.error('Error reassigning task:', error);
      toast.error(error.response?.data?.message || 'Failed to reassign task');
    } finally {
      setReassigning(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentTask || !commentText.trim()) return;

    setAddingComment(true);
    try {
      const response = await axiosInstance.post(`/api/tasks/${commentTask._id}/comments`, {
        text: commentText.trim()
      });
      if (response.data.success) {
        // Update the task with the new comment
        setTasks(tasks.map(task =>
          task._id === commentTask._id ? {
            ...task,
            comments: [...(task as TaskManagementTask).comments, response.data.data]
          } : task
        ));
        setShowAddCommentDialog(false);
        setCommentTask(null);
        setCommentText('');
        toast.success('Comment added successfully');
      }
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast.error(error.response?.data?.message || 'Failed to add comment');
    } finally {
      setAddingComment(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-success/10 text-success';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-600';
      case 'completed':
        return 'bg-green-500/10 text-green-600';
      default:
        return 'bg-secondary';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground">My Assigned Tasks</h1>
            <p className="text-muted-foreground mt-2">
              Manage your assigned customer work
            </p>
          </div>
        </div>

        {tasks.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No tasks assigned to you yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {tasks.map((task) => (
              <Card key={task._id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-semibold text-foreground">
                          {(task as TaskManagementTask).title || 'Untitled Task'}
                        </h3>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status.replace('_', ' ').charAt(0).toUpperCase() + task.status.replace('_', ' ').slice(1)}
                        </Badge>
                        {task.type === 'task' && (
                          <Badge variant="outline" className="text-xs">
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                          </Badge>
                        )}
                      </div>
                      {task.type === 'task' ? (
                        <>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {task.description || 'No description provided'}
                          </p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4" />
                              {task.category}
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              {(task as TaskManagementTask).assignedTo && Array.isArray((task as TaskManagementTask).assignedTo) ? (task as TaskManagementTask).assignedTo.length : 0} assigned
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Due: {new Date(task.dueDate).toLocaleDateString()} | Progress: {task.progress}%
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              {task.email}
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              {task.phone}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Assigned: {new Date(task.createdAt).toLocaleDateString()}
                          </p>
                          {task.remarks && (
                            <p className="text-sm text-muted-foreground">
                              <strong>Remarks:</strong> {task.remarks}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {task.type === 'customer' ? (
                        <>
                          <Button
                            onClick={() => handleStartWork(task._id, task.type)}
                            disabled={updatingTask === task._id}
                            className="gap-2"
                          >
                            {updatingTask === task._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                            Start Work
                          </Button>
                          <Dialog open={showNotificationDialog && selectedTask?._id === task._id} onOpenChange={(open) => {
                            setShowNotificationDialog(open);
                            if (!open) setSelectedTask(null);
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                onClick={() => setSelectedTask(task)}
                                className="gap-2"
                              >
                                <MessageSquare className="w-4 h-4" />
                                Send Notification
                              </Button>
                            </DialogTrigger>
                              <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Send Notification to {task.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Textarea
                                  value={notificationMessage}
                                  onChange={(e) => setNotificationMessage(e.target.value)}
                                  placeholder="Enter your message to the client..."
                                  rows={4}
                                />
                                <div className="flex gap-2">
                                  <Button onClick={handleSendNotification} disabled={!notificationMessage.trim()}>
                                    Send Notification
                                  </Button>
                                  <Button variant="outline" onClick={() => setShowNotificationDialog(false)}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Dialog open={showViewWorkDialog && viewWorkTask?._id === task._id} onOpenChange={(open) => {
                            setShowViewWorkDialog(open);
                            if (!open) setViewWorkTask(null);
                          }}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    onClick={() => setViewWorkTask(task)}
                                    className="gap-2"
                                  >
                                    <FileText className="w-4 h-4" />
                                    View Work
                                  </Button>
                                </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Work Details: {(task as CustomerTask).name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Service Type</label>
                                    <p className="text-sm font-medium">{(task as CustomerTask).serviceType || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                                    <p className="text-sm font-medium">{task.status}</p>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Address</label>
                                  <p className="text-sm">{(task as CustomerTask).address || 'N/A'}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Remarks</label>
                                  <p className="text-sm">{(task as CustomerTask).remarks || 'No remarks provided'}</p>
                                </div>
                                {(task as CustomerTask).files && Array.isArray((task as CustomerTask).files) && (task as CustomerTask).files.length > 0 && (
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Attached Files</label>
                                    <div className="space-y-2 mt-2">
                                      {(task as CustomerTask).files.map((file, index) => (
                                        <div key={index} className="flex items-center gap-2 p-2 border rounded">
                                          <FileText className="w-4 h-4" />
                                          <span className="text-sm">{file.fileOriginalName}</span>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/${file.filePath}`, '_blank')}
                                          >
                                            <Download className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            onClick={() => handleMarkComplete(task._id, task.type)}
                            disabled={updatingTask === task._id}
                            className="gap-2"
                          >
                            {updatingTask === task._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Mark Complete
                          </Button>
                          <Dialog open={showReassignDialog && reassignTaskId === task._id} onOpenChange={(open) => {
                            setShowReassignDialog(open);
                            if (!open) {
                              setReassignTaskId(null);
                              setNewAssignedStaff('');
                              setReassignReason('');
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setReassignTaskId(task._id);
                                  setNewAssignedStaff('');
                                  setReassignReason('');
                                }}
                                className="gap-2"
                              >
                                <RotateCcw className="w-4 h-4" />
                                Reassign Task
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                            <DialogTitle>Reassign Task: {(task as CustomerTask).name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Select New Staff Member</label>
                                  <Select value={newAssignedStaff} onValueChange={setNewAssignedStaff}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Choose staff member" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {staffList
                                        .filter(staff => staff._id !== user?.id)
                                        .map((staff) => (
                                        <SelectItem key={staff._id} value={staff._id}>
                                          {staff.email} ({staff.role})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Reason for Reassignment (Optional)</label>
                                  <Textarea
                                    value={reassignReason}
                                    onChange={(e) => setReassignReason(e.target.value)}
                                    placeholder="Please provide a reason for reassigning this task..."
                                    rows={3}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={handleReassignTask}
                                    disabled={!newAssignedStaff || reassigning}
                                    className="flex-1"
                                  >
                                    {reassigning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    {reassigning ? 'Reassigning...' : 'Reassign Task'}
                                  </Button>
                                  <Button variant="outline" onClick={() => setShowReassignDialog(false)}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          {task.status === 'completed' && (
                            <Badge className="bg-green-500/10 text-green-600">
                              Completed
                            </Badge>
                          )}
                        </>
                      ) : (
                        <>
                          {task.status === 'pending' && (
                            <Button
                              onClick={() => handleStartWork(task._id, task.type)}
                              disabled={updatingTask === task._id}
                              className="gap-2"
                            >
                              {updatingTask === task._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                              Start Work
                            </Button>
                          )}
                          <Dialog open={showViewWorkDialog && viewWorkTask?._id === task._id} onOpenChange={(open) => {
                            setShowViewWorkDialog(open);
                            if (!open) setViewWorkTask(null);
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                onClick={() => setViewWorkTask(task)}
                                className="gap-2"
                              >
                                <FileText className="w-4 h-4" />
                                View Work
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Work Details: {(task as TaskManagementTask).title}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                                    <p className="text-sm font-medium">{task.status}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Priority</label>
                                    <p className="text-sm font-medium">{(task as TaskManagementTask).priority}</p>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                                  <p className="text-sm">{(task as TaskManagementTask).description || 'No description provided'}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                                    <p className="text-sm">{new Date((task as TaskManagementTask).dueDate).toLocaleDateString()}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Progress</label>
                                    <p className="text-sm">{(task as TaskManagementTask).progress}%</p>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                                  <p className="text-sm">{(task as TaskManagementTask).category}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Assigned To</label>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {(task as TaskManagementTask).assignedTo && Array.isArray((task as TaskManagementTask).assignedTo) ? (task as TaskManagementTask).assignedTo.map((user) => (
                                      <Badge key={user._id} variant="outline" className="text-xs">
                                        {user.name}
                                      </Badge>
                                    )) : null}
                                  </div>
                                </div>
                                {(task as TaskManagementTask).subTasks && Array.isArray((task as TaskManagementTask).subTasks) && (task as TaskManagementTask).subTasks.length > 0 && (
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Sub Tasks</label>
                                    <div className="space-y-2 mt-2">
                                      {(task as TaskManagementTask).subTasks.map((subTask, index) => (
                                        <div key={index} className="flex items-center gap-2 p-2 border rounded">
                                          <input
                                            type="checkbox"
                                            checked={subTask.isCompleted}
                                            readOnly
                                            className="rounded"
                                          />
                                          <span className={`text-sm ${subTask.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                                            {subTask.title}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {(task as TaskManagementTask).comments && Array.isArray((task as TaskManagementTask).comments) && (task as TaskManagementTask).comments.length > 0 && (
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Comments</label>
                                    <div className="space-y-2 mt-2">
                                      {(task as TaskManagementTask).comments.map((comment, index) => (
                                        <div key={index} className="p-3 border rounded bg-muted/50">
                                          <p className="text-sm">{comment.text}</p>
                                          <p className="text-xs text-muted-foreground mt-1">
                                            By {comment.createdBy.name} on {new Date(comment.createdAt).toLocaleDateString()}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          {task.status === 'in-progress' && (
                            <>
                              <Dialog open={showAddCommentDialog && commentTask?._id === task._id} onOpenChange={(open) => {
                                setShowAddCommentDialog(open);
                                if (!open) {
                                  setCommentTask(null);
                                  setCommentText('');
                                }
                              }}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    onClick={() => setCommentTask(task)}
                                    className="gap-2"
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                    Add Comment
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Add Comment to {(task as TaskManagementTask).title}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <Textarea
                                      value={commentText}
                                      onChange={(e) => setCommentText(e.target.value)}
                                      placeholder="Enter your comment..."
                                      rows={4}
                                    />
                                    <div className="flex gap-2">
                                      <Button onClick={handleAddComment} disabled={!commentText.trim() || addingComment}>
                                        {addingComment ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                        {addingComment ? 'Adding...' : 'Add Comment'}
                                      </Button>
                                      <Button variant="outline" onClick={() => setShowAddCommentDialog(false)}>
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Button
                                onClick={() => handleMarkComplete(task._id, task.type)}
                                disabled={updatingTask === task._id}
                                className="gap-2"
                              >
                                {updatingTask === task._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                Mark Complete
                              </Button>
                              <Dialog open={showReassignDialog && reassignTaskId === task._id} onOpenChange={(open) => {
                                setShowReassignDialog(open);
                                if (!open) {
                                  setReassignTaskId(null);
                                  setNewAssignedStaff('');
                                  setReassignReason('');
                                }
                              }}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setReassignTaskId(task._id);
                                      setNewAssignedStaff('');
                                      setReassignReason('');
                                    }}
                                    className="gap-2"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                    Reassign Task
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Reassign Task: {(task as TaskManagementTask).title}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">Select New Staff Member</label>
                                      <Select value={newAssignedStaff} onValueChange={setNewAssignedStaff}>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Choose staff member" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {staffList
                                            .filter(staff => staff._id !== user?.id)
                                            .map((staff) => (
                                            <SelectItem key={staff._id} value={staff._id}>
                                              {staff.email} ({staff.role})
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">Reason for Reassignment (Optional)</label>
                                      <Textarea
                                        value={reassignReason}
                                        onChange={(e) => setReassignReason(e.target.value)}
                                        placeholder="Please provide a reason for reassigning this task..."
                                        rows={3}
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        onClick={handleReassignTask}
                                        disabled={!newAssignedStaff || reassigning}
                                        className="flex-1"
                                      >
                                        {reassigning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                        {reassigning ? 'Reassigning...' : 'Reassign Task'}
                                      </Button>
                                      <Button variant="outline" onClick={() => setShowReassignDialog(false)}>
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </>
                          )}
                          {task.status === 'blocked' && (
                            <Badge className="bg-red-500/10 text-red-600">
                              Blocked
                            </Badge>
                          )}
                          {task.status === 'completed' && (
                            <Badge className="bg-green-500/10 text-green-600">
                              Completed
                            </Badge>
                          )}
                          <Link to={`/tasks/${task._id}`}>
                            <Button variant="outline" className="gap-2 w-full">
                              <FileText className="w-4 h-4" />
                              View Details
                            </Button>
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyTasks;
