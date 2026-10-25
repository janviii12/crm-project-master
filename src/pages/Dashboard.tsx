import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import ServerStatusPanel from '@/components/dashboard/ServerStatusPanel';
import LiveActivityFeed from '@/components/LiveActivityFeed';
import SecurityAlerts from '@/components/SecurityAlerts';
import UserRoleIndicators from '@/components/UserRoleIndicators';
import LoginReminderPopup from '@/components/LoginReminderPopup';

import { useAuth } from '@/contexts/AuthContext';
import { useAIEmotion } from '@/hooks/useAIEmotion';
import { useAIPersonality } from '@/hooks/useAIPersonality';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Users, FileCheck, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Typed from 'typed.js';
import axios from 'axios';
import { API_BASE_URL } from '@/config';

const DASHBOARD_REFRESH_MS = 5 * 60 * 1000;

const Dashboard = () => {
  const { user } = useAuth();
  const { playEmotion } = useAIEmotion();
  const { setAmbientLighting } = useAIPersonality();
  const { subscribe } = usePushNotifications();
  const welcomeRef = useRef(null);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    verifiedDocuments: 0,
    pendingVerifications: 0,
    issues: 0,
    assignedTasks: 0,
    inProgress: 0,
    completed: 0,
    submittedForms: 0,
    pendingReview: 0,
    approved: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);
  const welcomePlayedRef = useRef(false);
  // Latest playEmotion without making it an effect dependency (it is recreated every render)
  const playEmotionRef = useRef(playEmotion);
  playEmotionRef.current = playEmotion;
  
  // Reminder popup state
  const [showReminderPopup, setShowReminderPopup] = useState(false);
  const [reminderDates, setReminderDates] = useState([]);
  const [reminderPopupLoaded, setReminderPopupLoaded] = useState(false);

  // New Year celebration mode
  const newYearMode = true;
  const [showNewYearOverlay, setShowNewYearOverlay] = useState(false);

  const closeNewYear = () => {
    setShowNewYearOverlay(false);
  };

  useEffect(() => {
    if (showNewYearOverlay) {
      startFloatingEmojis();
    }
  }, [showNewYearOverlay]);

  const startFloatingEmojis = () => {
    const emojis = ['✨', '🎊', '🥂', '🎆', '🎇', '🎈', '🎉', '🌟', '💫', '⭐'];
    const container = document.querySelector('.ny-content');

    emojis.forEach((emoji, index) => {
      const emojiElement = document.createElement('div');
      emojiElement.textContent = emoji;
      emojiElement.style.position = 'absolute';
      emojiElement.style.fontSize = '2rem';
      emojiElement.style.left = `${Math.random() * 100}%`;
      emojiElement.style.top = `${Math.random() * 100}%`;
      emojiElement.style.animation = `float${(index % 3) + 1} ${2 + Math.random() * 2}s ease-in-out infinite`;
      emojiElement.style.pointerEvents = 'none';
      emojiElement.style.zIndex = '1';

      if (container) {
        container.appendChild(emojiElement);
      }

      setTimeout(() => {
        if (emojiElement.parentNode) {
          emojiElement.parentNode.removeChild(emojiElement);
        }
      }, 4000);
    });
  };

  useEffect(() => {
    if (user) {
      const key = `newYearShown_${user.id}`;
      if (!localStorage.getItem(key)) {
        setShowNewYearOverlay(true);
        localStorage.setItem(key, 'true');
      }
    }
  }, [user]);

  // Register for push notifications once per login (subscribe skips the API if already synced)
  useEffect(() => {
    if (user?.id) {
      subscribe(user.id);
    }
  }, [user?.id, subscribe]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const customersResponse = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/customers`);
        if (customersResponse.data.success) {
          const customers = customersResponse.data.data;
          const totalCustomers = customers.length;
          const verifiedDocuments = customers.filter((c) => c.status === 'verified').length;
          const pendingVerifications = customers.filter((c) => c.status === 'pending').length;
          const issues = customers.filter((c) => c.status === 'rejected' || c.status === 'on_hold').length;

          const assignedTasks = customers.filter((c) =>
            c.status === 'verified' && c.assignedStaff && c.assignedStaff._id === user?.id
          ).length;
          const inProgress = assignedTasks;
          const completed = customers.filter((c) =>
            c.status === 'completed' && c.assignedStaff && c.assignedStaff._id === user?.id
          ).length;

          const submittedForms = customers.filter((c) => c.user === user?.id).length;
          const pendingReview = customers.filter((c) =>
            c.user === user?.id && c.status === 'pending'
          ).length;
          const approved = customers.filter((c) =>
            c.user === user?.id && c.status === 'verified'
          ).length;

          setStats({
            totalCustomers,
            verifiedDocuments,
            pendingVerifications,
            issues,
            assignedTasks,
            inProgress,
            completed,
            submittedForms,
            pendingReview,
            approved
          });

          const activities = customers.slice(0, 4).map((customer) => ({
            action: customer.status === 'verified' ? 'Document verified' :
                   customer.status === 'pending' ? 'Form submitted' :
                   customer.status === 'rejected' ? 'Document rejected' : 'Status updated',
            user: customer.name,
            time: new Date(customer.createdAt).toLocaleString()
          }));
          setRecentActivities(activities);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
        if (!welcomePlayedRef.current) {
          welcomePlayedRef.current = true;
          setTimeout(() => {
            playEmotionRef.current("success");
            if (welcomeRef.current) {
              const typed = new Typed(welcomeRef.current, {
                strings: [`Welcome back, ${user?.name || 'User'}! 👋`],
                typeSpeed: 50,
                showCursor: false,
              });
            }
          }, 500);
        }
      }
    };

    if (!user) return;

    fetchDashboardData();

    // Refresh stats every 5 minutes, skipping while the tab is in the background
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchDashboardData();
      }
    }, DASHBOARD_REFRESH_MS);

    return () => clearInterval(interval);
    // Re-run only when the logged-in user changes, not on every new `user` object
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchReminderDates = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await axios.get(`${API_BASE_URL}/api/followups/reminder-dates`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = response.data;
      if (result.success && result.data && result.data.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const popupShownKey = `reminderPopupShown_${user?.id}_${today}`;
        if (!localStorage.getItem(popupShownKey)) {
          setReminderDates(result.data);
          setShowReminderPopup(true);
          localStorage.setItem(popupShownKey, 'true');
        }
      }
    } catch (error) {
      console.error('Error fetching reminder dates:', error);
    }
  };

  useEffect(() => {
    if (user && !reminderPopupLoaded) {
      fetchReminderDates();
      setReminderPopupLoaded(true);
    }
  }, [user, reminderPopupLoaded]);

  const adminStats = [
    {
      title: 'Total Customers',
      value: stats.totalCustomers.toString(),
      icon: Users,
      trend: { value: '+12.5% from last month', isPositive: true },
      color: 'primary'
    },
    {
      title: 'Verified Documents',
      value: stats.verifiedDocuments.toString(),
      icon: FileCheck,
      trend: { value: '+8.2% from last month', isPositive: true },
      color: 'success'
    },
    {
      title: 'Pending Verifications',
      value: stats.pendingVerifications.toString(),
      icon: Clock,
      trend: { value: '-3 from yesterday', isPositive: true },
      color: 'warning'
    },
    {
      title: 'Issues',
      value: stats.issues.toString(),
      icon: AlertCircle,
      trend: { value: '2 resolved today', isPositive: true },
      color: 'destructive'
    },
  ];

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
      <motion.div
        className={`space-y-8 ${newYearMode ? 'bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 dark:from-purple-950 dark:via-pink-950 dark:to-yellow-950' : ''}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-foreground">
            <span ref={welcomeRef}></span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Here's what's happening with your CRM today.
          </p>
        </motion.div>

        {/* Stats Grids for different roles */}
        {(user?.roles?.includes('admin') || user?.roles?.includes('manager')) && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {adminStats.map((stat, index) => (
              <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * index, duration: 0.3 }}>
                {/* <StatsCard {...stat} /> */}
              </motion.div>
            ))}
          </motion.div>
        )}

        {user?.roles?.includes('executive') && (
          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}>
            <StatsCard title="Assigned Tasks" value={stats.assignedTasks.toString()} icon={FileCheck} trend={{ value: '+2 new today', isPositive: true }} color="primary" />
            <StatsCard title="In Progress" value={stats.inProgress.toString()} icon={Clock} trend={{ value: '2 starting soon', isPositive: true }} color="warning" />
            <StatsCard title="Completed" value={stats.completed.toString()} icon={FileCheck} trend={{ value: '+3 this week', isPositive: true }} color="success" />
          </motion.div>
        )}

        {user?.roles?.includes('client') && (
          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}>
            <StatsCard title="Submitted Forms" value={stats.submittedForms.toString()} icon={FileCheck} color="primary" />
            <StatsCard title="Pending Review" value={stats.pendingReview.toString()} icon={Clock} color="warning" />
            <StatsCard title="Approved" value={stats.approved.toString()} icon={FileCheck} color="success" />
          </motion.div>
        )}

        {/* Server Status Panel for dev/admin */}
        {(user?.roles?.includes('developer') || user?.roles?.includes('admin')) || user?.isDevLead && (
          <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }}>
            <ServerStatusPanel />
          </motion.div>
        )}



        {/* User Role Indicators */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.5 }}>
          <UserRoleIndicators />
        </motion.div>

        {/* Live Activity Feed and Security Alerts for Admin/Manager */}
        {(user?.roles?.includes('admin') || user?.roles?.includes('manager')) && (
          <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0, duration: 0.5 }}>
            <LiveActivityFeed />
            <SecurityAlerts />
          </motion.div>
        )}

        {/* Recent Activity & Quick Actions */}
        <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, duration: 0.5 }}>
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest actions in your CRM</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start gap-4 p-3 rounded-lg hover:bg-accent transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index, duration: 0.3 }}
                  >
                    <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.user} • {activity.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks for your role</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {user?.roles?.includes('admin') && (
                  <>
                    <button className="w-full p-3 text-left rounded-lg border border-border hover:bg-accent transition-colors">
                      <p className="font-medium text-foreground">Add New User</p>
                      <p className="text-sm text-muted-foreground">Create staff or client account</p>
                    </button>
                    <button className="w-full p-3 text-left rounded-lg border border-border hover:bg-accent transition-colors">
                      <p className="font-medium text-foreground">Review Pending Documents</p>
                      <p className="text-sm text-muted-foreground">Verify uploaded files</p>
                    </button>
                  </>
                )}
                {user?.roles?.includes('executive') && (
                  <>
                    <Link to="/my-tasks" className="block">
                      <button className="w-full p-3 text-left rounded-lg border border-border hover:bg-accent transition-colors">
                        <p className="font-medium text-foreground">View Assigned Tasks</p>
                        <p className="text-sm text-muted-foreground">Check your assigned customer work</p>
                      </button>
                    </Link>
                    <button className="w-full p-3 text-left rounded-lg border border-border hover:bg-accent transition-colors">
                      <p className="font-medium text-foreground">Send Client Notification</p>
                      <p className="text-sm text-muted-foreground">Update clients on work progress</p>
                    </button>
                  </>
                )}
                {user?.roles?.includes('client') && (
                  <>
                    <button className="w-full p-3 text-left rounded-lg border border-border hover:bg-accent transition-colors">
                      <p className="font-medium text-foreground">Submit New Form</p>
                      <p className="text-sm text-muted-foreground">Add customer information</p>
                    </button>
                    <button className="w-full p-3 text-left rounded-lg border border-border hover:bg-accent transition-colors">
                      <p className="font-medium text-foreground">View My Submissions</p>
                      <p className="text-sm text-muted-foreground">Check submission status</p>
                    </button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* New Year Overlay */}
      {showNewYearOverlay && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <img
            src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExNTdhczZ0ejd3bjBxdmtmOGMxY3kxNjRyajVsbjZmdWU1cnRkZWo2bSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/IjmMzurYulKEw/giphy.gif"
            alt="New Year Fireworks"
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
          <div className="ny-content relative z-10 text-center text-white p-8 rounded-lg max-w-md mx-4">
            <h2 className="text-4xl font-bold mb-4">🎉 Happy New Year! 🎉</h2>
            <p className="text-xl mb-4">Welcome to 2026, {user?.name || 'User'}!</p>
            <p className="text-lg mb-6">May this year bring you success, happiness, and endless possibilities.</p>
            <button
              onClick={closeNewYear}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Let's Get Started! 🚀
            </button>
          </div>
        </div>
      )}

      {/* Reminder Popup */}
      <LoginReminderPopup
        isOpen={showReminderPopup}
        onClose={() => setShowReminderPopup(false)}
        reminderDates={reminderDates}
        onViewCalendar={() => {
          setShowReminderPopup(false);
          window.location.href = '/calendar';
        }}
      />
    </DashboardLayout>
  );
};

export default Dashboard;

