import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import TaskCard from "@/components/tasks/TaskCard";
import TaskForm from "@/components/tasks/TaskForm";
import TaskFilters, {
  TaskFilters as TaskFiltersType,
} from "@/components/tasks/TaskFilters";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, FileText, MessageSquare, Trash2 } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Task {
  _id: string;
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
  clientId?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    company?: string;
  };
}

interface TaskFormData {
  _id?: string;
  title: string;
  description: string;
  status: "pending" | "in-progress" | "blocked" | "completed";
  priority: "low" | "medium" | "high";
  progress: number;
  // form uses string[] of user IDs for assignedTo
  assignedTo: string[];
  category: string;
  dueDate: string;
  subTasks: Array<{
    title: string;
    isCompleted: boolean;
  }>;
  clientId?: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
}

const TaskManagement: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskFormData | undefined>();
  const [showViewWorkDialog, setShowViewWorkDialog] = useState(false);
  const [viewWorkTask, setViewWorkTask] = useState<Task | null>(null);
  const [newComment, setNewComment] = useState('');
  const [filters, setFilters] = useState<TaskFiltersType>({
    search: "",
    status: [],
    priority: [],
    category: [],
    assignedTo: [],
    dateRange: { start: "", end: "" },
    overdue: false,
  });



  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try to fetch from API first
        const [tasksResponse, usersResponse] = await Promise.allSettled([
          axiosInstance.get("/api/tasks"),
          axiosInstance.get("/api/users"),
        ]);

        if (
          tasksResponse.status === "fulfilled" &&
          tasksResponse.value?.data?.success &&
          Array.isArray(tasksResponse.value.data.data)
        ) {
          // Ensure assignedTo shape: convert ids or user objects into proper user objects
          const apiTasks: Task[] = tasksResponse.value.data.data.map((t: any) => {
            // normalize assignedTo: could be array of ids or objects
            const assigned = Array.isArray(t.assignedTo)
              ? t.assignedTo.map((a: any) =>
                  typeof a === "string" ? { _id: a, name: "Unknown", email: "" } : a
                )
              : [];
            return {
              ...t,
              assignedTo: assigned,
            } as Task;
          });

          setTasks(apiTasks);
        } else {
          // No mock data fallback - force database connection
          console.error("Failed to fetch tasks from API");
          setTasks([]);
        }

        if (
          usersResponse.status === "fulfilled" &&
          usersResponse.value?.data?.success &&
          Array.isArray(usersResponse.value.data.data)
        ) {
          setUsers(usersResponse.value.data.data);
        } else {
          // No mock users fallback - force database connection
          console.error("Failed to fetch users from API");
          setUsers([]);
        }
      } catch (error) {
        console.error("API not available, no mock data fallback");
        setTasks([]);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...tasks];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchLower) ||
          task.description.toLowerCase().includes(searchLower) ||
          task.category.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter((task) => filters.status.includes(task.status));
    }

    // Priority filter
    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter((task) => filters.priority.includes(task.priority));
    }

    // Category filter
    if (filters.category && filters.category.length > 0) {
      filtered = filtered.filter((task) => filters.category.includes(task.category));
    }

    // Assigned to filter
    if (filters.assignedTo && filters.assignedTo.length > 0) {
      filtered = filtered.filter((task) =>
        task.assignedTo.some((u) => filters.assignedTo.includes(u._id))
      );
    }

    // Date range filter
    if ((filters.dateRange && filters.dateRange.start) || (filters.dateRange && filters.dateRange.end)) {
      filtered = filtered.filter((task) => {
        const taskDate = new Date(task.dueDate);
        const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
        const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null;

        if (startDate && taskDate < startDate) return false;
        if (endDate && taskDate > endDate) return false;
        return true;
      });
    }

    // Overdue filter
    if (filters.overdue) {
      const now = new Date();
      filtered = filtered.filter((task) => new Date(task.dueDate) < now && task.status !== "completed");
    }

    setFilteredTasks(filtered);
  }, [tasks, filters]);

  // Save handler expects TaskFormData from TaskForm
  const handleSaveTask = async (taskData: TaskFormData) => {
    try {
      if (editingTask && editingTask._id) {
        // Update existing task via API
        const response = await axiosInstance.put(`/api/tasks/${editingTask._id}`, taskData);
        if (response.data.success) {
          // Refresh tasks from API
          const tasksResponse = await axiosInstance.get("/api/tasks");
          if (tasksResponse.data.success) {
            const apiTasks: Task[] = tasksResponse.data.data.map((t: any) => ({
              ...t,
              assignedTo: Array.isArray(t.assignedTo)
                ? t.assignedTo.map((a: any) =>
                    typeof a === "string" ? { _id: a, name: "Unknown", email: "" } : a
                  )
                : [],
            }));
            setTasks(apiTasks);
          }
          toast.success("Task updated successfully");
        }
      } else {
        // Create new task via API
        const response = await axiosInstance.post("/api/tasks", taskData);
        if (response.data.success) {
          // Refresh tasks from API
          const tasksResponse = await axiosInstance.get("/api/tasks");
          if (tasksResponse.data.success) {
            const apiTasks: Task[] = tasksResponse.data.data.map((t: any) => ({
              ...t,
              assignedTo: Array.isArray(t.assignedTo)
                ? t.assignedTo.map((a: any) =>
                    typeof a === "string" ? { _id: a, name: "Unknown", email: "" } : a
                  )
                : [],
            }));
            setTasks(apiTasks);
          }
          toast.success("Task created successfully");
        }
      }

      setShowTaskForm(false);
      setEditingTask(undefined);
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("Failed to save task");
    }
  };

  // Open Edit modal - Task -> TaskFormData (assignedTo becomes string[])
  const handleEditTask = (task: Task) => {
    const transformed: TaskFormData = {
      _id: task._id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      progress: task.progress,
      assignedTo: task.assignedTo.map((u) => u._id),
      category: task.category,
      dueDate: task.dueDate,
      subTasks: task.subTasks.map((s) => ({ ...s })),
      clientId: task.clientId ? task.clientId._id : undefined,
    };
    setEditingTask(transformed);
    setShowTaskForm(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const response = await axiosInstance.delete(`/api/tasks/${taskId}`);
      if (response.data.success) {
        // Refresh tasks from API
        const tasksResponse = await axiosInstance.get("/api/tasks");
        if (tasksResponse.data.success) {
          const apiTasks: Task[] = tasksResponse.data.data.map((t: any) => ({
            ...t,
            assignedTo: Array.isArray(t.assignedTo)
              ? t.assignedTo.map((a: any) =>
                  typeof a === "string" ? { _id: a, name: "Unknown", email: "" } : a
                )
              : [],
          }));
          setTasks(apiTasks);
        }
        toast.success("Task deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  const handleStatusChange = async (taskId: string, status: Task["status"]) => {
    try {
      const response = await axiosInstance.patch(`/api/tasks/${taskId}/status`, { status });
      if (response.data.success) {
        // Refresh tasks from API
        const tasksResponse = await axiosInstance.get("/api/tasks");
        if (tasksResponse.data.success) {
          const apiTasks: Task[] = tasksResponse.data.data.map((t: any) => ({
            ...t,
            assignedTo: Array.isArray(t.assignedTo)
              ? t.assignedTo.map((a: any) =>
                  typeof a === "string" ? { _id: a, name: "Unknown", email: "" } : a
                )
              : [],
          }));
          setTasks(apiTasks);
        }
        toast.success("Task status updated");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleFiltersChange = (newFilters: TaskFiltersType) => {
    setFilters(newFilters);
  };

  const handleViewWork = (task: Task) => {
    setViewWorkTask(task);
    setShowViewWorkDialog(true);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading tasks...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Task Management</h1>
            <p className="text-muted-foreground mt-1">
              Testing TaskCard, TaskForm, and TaskFilters components
            </p>
          </div>
          <Button onClick={() => setShowTaskForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Task
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{tasks.length}</div>
              <p className="text-sm text-muted-foreground">Total Tasks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {tasks.filter((t) => t.status === "in-progress").length}
              </div>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {tasks.filter((t) => t.status === "completed").length}
              </div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">
                {tasks.filter((t) => new Date(t.dueDate) < new Date() && t.status !== "completed").length}
              </div>
              <p className="text-sm text-muted-foreground">Overdue</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <TaskFilters users={users} onFiltersChange={handleFiltersChange} initialFilters={filters} />

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <div key={task._id} className="relative">
          <TaskCard
            task={task}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onStatusChange={handleStatusChange}
            // onHold={(reason: string) => handleHoldTask(task._id, reason)}
            // onResume={() => handleResumeTask(task._id)}
            onClick={() => handleViewWork(task)}
            showActions={true}
          />
              {/* View Work Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewWork(task);
                }}
                className="absolute top-2 right-2 gap-1"
              >
                <FileText className="w-3 h-3" />
                View Work
              </Button>
            </div>
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No tasks match the current filters</p>
            </CardContent>
          </Card>
        )}

        {/* Task Form Modal */}
        <TaskForm
          task={editingTask}
          isOpen={showTaskForm}
          onClose={() => {
            setShowTaskForm(false);
            setEditingTask(undefined);
          }}
          onSave={handleSaveTask}
          users={users}
        />

        {/* View Work Dialog */}
        <Dialog open={showViewWorkDialog} onOpenChange={setShowViewWorkDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Task Details: {viewWorkTask?.title}
                </DialogTitle>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (viewWorkTask) {
                      handleDeleteTask(viewWorkTask._id);
                      setShowViewWorkDialog(false);
                    }
                  }}
                  className="gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Task
                </Button>
              </div>
            </DialogHeader>
            {viewWorkTask && (
              <div className="space-y-6">
                {/* Task Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      <Badge className={`text-xs ${
                        viewWorkTask.status === 'completed' ? 'bg-green-100 text-green-800' :
                        viewWorkTask.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        viewWorkTask.status === 'blocked' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {viewWorkTask.status.replace('-', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Priority</label>
                    <div className="mt-1">
                      <Badge className={`text-xs ${
                        viewWorkTask.priority === 'high' ? 'bg-red-100 text-red-800' :
                        viewWorkTask.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {viewWorkTask.priority}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                    <div className="mt-1 text-sm">{new Date(viewWorkTask.dueDate).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Progress</label>
                    <div className="mt-1 text-sm">{viewWorkTask.progress}%</div>
                  </div>
                </div>

                {/* Description */}
                {viewWorkTask.description && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm">
                      {viewWorkTask.description}
                    </div>
                  </div>
                )}

                {/* Client Information */}
                {viewWorkTask.clientId && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Client</label>
                    <div className="mt-1 p-3 bg-blue-50 rounded-md border">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-blue-900">{viewWorkTask.clientId.name}</span>
                      </div>
                      <div className="text-xs text-blue-700">{viewWorkTask.clientId.email}</div>
                      {viewWorkTask.clientId.phone && (
                        <div className="text-xs text-blue-600">{viewWorkTask.clientId.phone}</div>
                      )}
                      {viewWorkTask.clientId.company && (
                        <div className="text-xs text-blue-600">{viewWorkTask.clientId.company}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Assigned To */}
                {viewWorkTask.assignedTo && viewWorkTask.assignedTo.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Assigned To</label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {viewWorkTask.assignedTo.map((user) => (
                        <Badge key={user._id} variant="outline" className="text-xs">
                          {user.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sub-tasks */}
                {viewWorkTask.subTasks && viewWorkTask.subTasks.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Sub-tasks</label>
                    <div className="mt-1 space-y-2">
                      {viewWorkTask.subTasks.map((subTask, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={subTask.isCompleted}
                            readOnly
                            className="rounded"
                          />
                          <span className={subTask.isCompleted ? 'line-through text-muted-foreground' : ''}>
                            {subTask.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments */}
                {viewWorkTask.comments && viewWorkTask.comments.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Comments ({viewWorkTask.comments.length})
                    </label>
                    <div className="mt-2 space-y-3 max-h-60 overflow-y-auto">
                      {viewWorkTask.comments.map((comment, index) => (
                        <div key={comment._id || index} className="p-3 bg-gray-50 rounded-md">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{comment.createdBy.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm">{comment.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(!viewWorkTask.comments || viewWorkTask.comments.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No comments yet</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default TaskManagement;
