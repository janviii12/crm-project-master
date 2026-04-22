


import { Toaster } from "@/components/ui/toaster";
import { Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { SocketProvider } from "./contexts/SocketContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import CustomerDetails from "./pages/CustomerDetails";
import Interactions from "./pages/Interactions";
import TaskManagement from "./pages/TaskManagement";
import MyTasks from "./pages/MyTasks";
import TaskTest from "./pages/TaskTest";
import Notepad from "./pages/Notepad";
import Calendar from "./pages/Calendar";
import QuotationManagement from "./pages/QuotationManagement";
import Leads from "./pages/Leads";
import BeginRegistration from "./pages/BeginRegistration";
import ApplicationStatus from "./pages/ApplicationStatus";
import NextSteps from "./pages/NextSteps";
import RoleManagement from "./pages/RoleManagement";
import Logs from "./pages/Logs";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import Chat from "./pages/Chat";
import ExcelCollaboration from "./pages/ExcelCollaboration";
import PettyCashDashboard from "./pages/PettyCashDashboard";
import AddExpenseForm from "./pages/AddExpenseForm";
import ExpenseHistory from "./pages/ExpenseHistory";
import BossExpenseReport from "./pages/BossExpenseReport";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import AadhaarOCR from "./pages/AadhaarOCR";
import StaffActivityTracker from "./pages/StaffActivityTracker";
import AdminExecutiveActivity from "./pages/AdminExecutiveActivity";
import MyDailyActivity from "./pages/MyDailyActivity";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>
              <NotificationProvider>
                <Routes>
                   <Route path="/" element={<Navigate to="/login" replace />} />
                  <Route path="/login" element={<Login />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/customers"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'manager']}>
                        <Customers />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/customers/:id"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'manager']}>
                        <CustomerDetails />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/interactions"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'manager', 'executive']}>
                        <Interactions />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/calendar"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'manager', 'executive']}>
                        <Calendar />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/leads"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'manager']}>
                        <Leads />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/aadhaar-ocr" element={
                     <ProtectedRoute allowedRoles={['admin', 'manager']}>
                           <AadhaarOCR />
                    </ProtectedRoute>
                  } />
                  <Route
                    path="/QuotationManagement"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'manager', 'executive']}>
                        <QuotationManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/task-management"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'manager']}>
                        <TaskManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/my-tasks"
                    element={
                      <ProtectedRoute allowedRoles={['executive']}>
                        <MyTasks />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/task-test"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'manager', 'executive']}>
                        <TaskTest />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/notepad"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'manager', 'executive']}>
                        <Notepad />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/begin-registration"
                    element={
                      <ProtectedRoute allowedRoles={['client']}>
                        <BeginRegistration />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/application-status"
                    element={
                      <ProtectedRoute allowedRoles={['client']}>
                        <ApplicationStatus />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/next-steps"
                    element={
                      <ProtectedRoute allowedRoles={['client']}>
                        <NextSteps />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/roles"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <RoleManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/logs"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'developer']}>
                        <Logs />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/notifications"
                    element={
                      <ProtectedRoute>
                        <Notifications />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/chat"
                    element={
                      <ProtectedRoute allowedRoles={['developer']}>
                        <Chat />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/excel-collaboration"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'manager', 'executive']}>
                        <ExcelCollaboration />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/petty-cash-dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'manager']}>
                        <PettyCashDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/add-expense"
                    element={
                      <ProtectedRoute allowedRoles={['manager']}>
                        <AddExpenseForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/staff-activity"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'manager']}>
                        <StaffActivityTracker />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin-executive-activity"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminExecutiveActivity />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/my-activity"
                    element={
                      <ProtectedRoute allowedRoles={['executive']}>
                        <MyDailyActivity />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/expense-history"
                    element={
                      <ProtectedRoute allowedRoles={['manager']}>
                        <ExpenseHistory />
                      </ProtectedRoute>
                    }

                  />
                  <Route
                    path="/boss-expense-report"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <BossExpenseReport />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/unauthorized" element={<Unauthorized />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </NotificationProvider>
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

