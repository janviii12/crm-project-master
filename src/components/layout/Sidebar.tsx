import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  UserCog,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  ClipboardList,
  CheckCircle,
  MessageCircle,
  MessageSquare,
  StickyNote,
  Calendar,
  FileSpreadsheet,
  DollarSign,
  Activity
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import axiosInstance from '@/lib/axiosInstance';

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [hasSubmittedApplication, setHasSubmittedApplication] = useState(false);
  const [isApplicationVerified, setIsApplicationVerified] = useState(false);

  // Check if client has submitted an application
  useEffect(() => {
    if (user?.roles && user.roles.includes('client')) {
      // Check API to determine if application has been submitted
      if (user?.email) {
        const checkApplicationStatus = async () => {
          try {
            // Authenticated request; resolve on any status so "not found" is handled below
            const response = await axiosInstance.get(`/api/customers/by-email/${encodeURIComponent(user.email)}`, { validateStatus: () => true });
            const result = response.data;
            if (response.status === 200 && result.success && result.data.submittedAt) {
              setHasSubmittedApplication(true);
              if (result.data.status === 'verified') {
                setIsApplicationVerified(true);
              } else {
                setIsApplicationVerified(false);
              }
            } else {
              setHasSubmittedApplication(false);
              setIsApplicationVerified(false);
            }
          } catch (error) {
            // If API fails, assume no application submitted
            setHasSubmittedApplication(false);
            setIsApplicationVerified(false);
          }
        };
        checkApplicationStatus();
      }
    }
  }, [user, location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'executive', 'client', 'developer'] },
    { path: '/customers', label: 'Customers', icon: Users, roles: ['admin', 'manager'] },
    { path: '/interactions', label: 'Interactions', icon: MessageSquare, roles: ['admin','manager','executive'] },
    { path: '/calendar', label: 'Calendar', icon: Calendar, roles: ['admin', 'manager', 'executive'] },
    { path: '/QuotationManagement', label: 'Quotations', icon: FileText, roles: ['admin', 'manager', 'executive'] },
    { path: '/leads', label: 'Leads', icon: Users, roles: ['admin', 'manager'] },

    { path: '/task-management', label: 'Task Management', icon: ClipboardList, roles: ['admin', 'manager'] },
    { path: '/my-tasks', label: 'My Tasks', icon: FileText, roles: ['executive'] },
    // { path: '/my-tasks', label: 'Quotation', icon: FileText, roles: ['executive','admin','manager'] },
    { path: '/notepad', label: 'Notepad', icon: StickyNote, roles: ['admin', 'manager', 'executive'] },
    {
      path: '/begin-registration',
      label: 'Begin Registration',
      icon: FileText,
      roles: ['client'],
      condition: () => !hasSubmittedApplication // Hide if application submitted
    },
    {
      path: '/application-status',
      label: 'Application Status',
      icon: FileText,
      roles: ['client'],
      condition: () => hasSubmittedApplication // Show only if application submitted
    },
    {
      path: '/next-steps',
      label: 'Next Steps',
      icon: CheckCircle,
      roles: ['client'],
      condition: () => isApplicationVerified // Show only if application is verified
    },
    { path: '/chat', label: 'Chat', icon: MessageCircle, roles: ['developer'] },
    { path: '/roles', label: 'Role Management', icon: UserCog, roles: ['admin'] },
    { path: '/logs', label: 'Logs', icon: FileText, roles: ['admin', 'developer'] },
    { path: '/notifications', label: 'Notifications', icon: Bell, roles: ['admin', 'manager', 'executive', 'client'] },
    { path: '/settings', label: 'Settings', icon: Settings, roles: ['admin', 'manager', 'executive', 'client', 'developer'] },
    { path: '/excel-collaboration', label: 'Excel Collaboration', icon: FileSpreadsheet, roles: ['admin', 'manager', 'executive'] },
    { path: '/petty-cash-dashboard', label: 'Petty Cash', icon: DollarSign, roles: ['manager'] },
    { path: '/staff-activity', label: 'Staff Activity', icon: Activity, roles: ['admin', 'manager'] },
    { path: '/my-activity', label: 'My Activity', icon: Activity, roles: ['executive'] },
    { path: '/boss-expense-report', label: 'Expense Reports', icon: FileText, roles: ['admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (user && user.roles && user.roles.some(role => item.roles.includes(role))) {
      // Check additional conditions if they exist
      if (item.condition && !item.condition()) {
        return false;
      }
      return true;
    }
    return false;
  });

  return (
    <>
      {/* Mobile Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X /> : <Menu />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "w-64"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <h1 className="text-2xl font-bold text-primary">CRM Pro</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {user?.roles && user.roles.length > 0 ? user.roles.join(', ').charAt(0).toUpperCase() + user.roles.join(', ').slice(1) : 'User'} Portal
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {filteredMenuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive(item.path)
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-border">
            <div className="mb-3 px-4 py-2 rounded-lg bg-accent">
              <p className="text-sm font-medium text-accent-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 dark:text-white"
              onClick={logout}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
