import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import TaskCard from "@/components/tasks/TaskCard";
import TaskForm from "@/components/tasks/TaskForm";
import TaskFilters, {
  TaskFilters as TaskFiltersType,
} from "@/components/tasks/TaskFilters";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, RefreshCw } from "lucide-react";
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

const TaskTest: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskFormData | undefined>();
  const [filters, setFilters] = useState<TaskFiltersType>({
    search: "",
    status: [],
    priority: [],
    category: [],
    assignedTo: [],
    dateRange: { start: "", end: "" },
    overdue: false,
  });

  // Mock data for testing when backend is not available
  const mockTasks: Task[] = [
    {
      _id: "1",
      title: "Complete project proposal",
      description:
        "Write and finalize the Q4 project proposal for the new client",
      status: "in-progress",
      priority: "high",
      progress: 75,
      assignedTo: [{ _id: "user1", name: "John Doe", email: "john@example.com" }],
      category: "Sales",
      dueDate: "2024-12-15",
      subTasks: [
        { title: "Research client requirements", isCompleted: true },
        { title: "Write proposal draft", isCompleted: true },
        { title: "Review with team", isCompleted: false },
        { title: "Final revisions", isCompleted: false },
      ],
      comments: [
        {
          _id: "c1",
          text: "Initial draft looks good",
          createdBy: { _id: "user1", name: "John Doe" },
          createdAt: "2024-12-01T10:00:00Z",
        },
      ],
      createdAt: "2024-12-01T09:00:00Z",
    },
    {
      _id: "2",
      title: "Update website content",
      description: "Refresh the homepage and about section with new branding",
      status: "pending",
      priority: "medium",
      progress: 0,
      assignedTo: [{ _id: "user2", name: "Jane Smith", email: "jane@example.com" }],
      category: "Marketing",
      dueDate: "2024-12-20",
      subTasks: [
        { title: "Design new homepage layout", isCompleted: false },
        { title: "Write new copy", isCompleted: false },
      ],
      comments: [],
      createdAt: "2024-12-05T14:00:00Z",
    },
    {
      _id: "3",
      title: "Fix login bug",
      description: "Resolve the authentication issue reported by users",
      status: "blocked",
      priority: "high",
      progress: 30,
      assignedTo: [{ _id: "user3", name: "Bob Johnson", email: "bob@example.com" }],
      category: "Development",
      dueDate: "2024-12-10",
      subTasks: [
        { title: "Identify root cause", isCompleted: true },
        { title: "Implement fix", isCompleted: false },
        { title: "Test solution", isCompleted: false },
      ],
      comments: [
        {
          _id: "c2",
          text: "Blocked waiting for database access",
          createdBy: { _id: "user3", name: "Bob Johnson" },
          createdAt: "2024-12-08T16:00:00Z",
        },
      ],
      createdAt: "2024-12-07T11:00:00Z",
    },
  ];

  const mockUsers: User[] = [
    { _id: "user1", name: "John Doe", email: "john@example.com" },
    { _id: "user2", name: "Jane Smith", email: "jane@example.com" },
    { _id: "user3", name: "Bob Johnson", email: "bob@example.com" },
    { _id: "user4", name: "Alice Brown", email: "alice@example.com" },
  ];

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
          // Use mock data if API fails
          console.log("Using mock task data for testing");
          setTasks(mockTasks);
        }

        if (
          usersResponse.status === "fulfilled" &&
          usersResponse.value?.data?.success &&
          Array.isArray(usersResponse.value.data.data)
        ) {
          setUsers(usersResponse.value.data.data);
        } else {
          // Use mock users if API fails
          console.log("Using mock user data for testing");
          setUsers(mockUsers);
        }
      } catch (error) {
        console.log("API not available, using mock data for testing");
        setTasks(mockTasks);
        setUsers(mockUsers);
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
      clientId: undefined,
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
            <h1 className="text-3xl font-bold text-foreground">Task Management Test</h1>
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
            <TaskCard
              key={task._id}
              task={task}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              onStatusChange={handleStatusChange}
              onClick={() => console.log("Task clicked:", task._id)}
              showActions={true}
            />
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
          users={users}
          isOpen={showTaskForm}
          onClose={() => {
            setShowTaskForm(false);
            setEditingTask(undefined);
          }}
          onSave={handleSaveTask}
        />
      </div>
    </DashboardLayout>
  );
};

export default TaskTest;
