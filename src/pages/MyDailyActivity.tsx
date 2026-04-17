import React, { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StaffProfileCard from '@/components/staff/StaffProfileCard';
import QuickActionButtons from '@/components/staff/QuickActionButtons';
import ActivityTimeline from '@/components/staff/ActivityTimeline';
import SummaryCard from '@/components/staff/SummaryCard';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import axiosInstance from '@/lib/axiosInstance';
import { toast } from 'sonner';

const MyDailyActivity = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [summaryData, setSummaryData] = useState({
    loginTime: null,
    logoutTime: null,
    totalWorkingHours: 0,
    breakHours: 0,
    productiveHours: 0,
    todayActivities: 0
  });
  const [loading, setLoading] = useState(true);
  const [liveActivities, setLiveActivities] = useState(0);
  const [activities, setActivities] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastSummaryRef = useRef(0);

  const fetchActivities = useCallback(async () => {
    // Skip if no user (post-logout)
    if (!user?.id) {
      console.log('⏭️ Skipping activities fetch - no userId (post-logout)');
      return;
    }
    try {
      const response = await axiosInstance.get(`/api/activities?userId=${user.id}`);
      if (response.data.success) {
        setActivities(response.data.data || []);
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('🔐 Activities fetch 401 - expected post-logout');
      } else {
        console.error('Activities fetch error:', error);
      }
    }
  }, [user?.id]);

  const fetchPersonalSummary = useCallback(async (force = false) => {
    // Skip if no user (post-logout)
    if (!user?.id) {
      console.log('⏭️ Skipping summary fetch - no userId (post-logout)');
      return;
    }
    if (!force && Date.now() - lastSummaryRef.current < 500) return;
    lastSummaryRef.current = Date.now();
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/api/activities/today-stats?userId=${user.id}`);
      if (response.data.success) {
        const data = response.data.data;
        setSummaryData(data);
        console.log('📊 MyDailySummary [EXECUTIVE FIX]:', {
          loginTime: data.loginTime ? new Date(data.loginTime).toLocaleTimeString() : 'null',
          logoutTime: data.logoutTime ? new Date(data.logoutTime).toLocaleTimeString() : 'null',
          totalWorkingHours: data.totalWorkingHours,
          hasLogoutData: !!data.logoutTime,
          userId: user.id
        });
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('🔐 Summary fetch 401 - expected post-logout');
      } else {
        console.error('Personal summary fetch error:', error);
        toast.error('Failed to fetch daily summary');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const handleRefresh = useCallback(async () => {
    if (!user?.id) {
      console.log('⏭️ Skip refresh - no user (post-logout)');
      return;
    }
    setIsRefreshing(true);
    try {
      await Promise.all([fetchPersonalSummary(true), fetchActivities()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchPersonalSummary, fetchActivities, user?.id]);

  const handleNewActivity = useCallback((newActivity: any) => {
    setLiveActivities((prev) => prev + 1);
    setActivities((prev) => {
      const exists = prev.some((a: any) => a._id === newActivity._id);
      return exists ? prev : [newActivity, ...prev];
    });
    fetchPersonalSummary(true);
  }, [fetchPersonalSummary]);

  useEffect(() => {
    if (socket && user?.id) {
      socket.emit('join-activity-room', `activity_${user.id}`);
      
      const handleNewAct = (newActivity: any) => handleNewActivity(newActivity);
      const handleUpdatedAct = (updatedActivity: any) => {
        setActivities((prev) => 
          prev.map((a: any) => a._id === updatedActivity._id ? updatedActivity : a)
        );
        handleNewActivity(updatedActivity);
      };

      socket.on('new-activity', handleNewAct);
      socket.on('activity-updated', handleUpdatedAct);

      return () => {
        socket.off('new-activity', handleNewAct);
        socket.off('activity-updated', handleUpdatedAct);
      };
    }
  }, [socket, user?.id, handleNewActivity]);

  // Initial load + events
  useEffect(() => {
    if (user?.id && loading) {
      // Initial fetch on mount + user ready
      fetchPersonalSummary(true);
      fetchActivities();
    }

    const handleActivitiesRefetch = () => {
      console.log('🚀 MyDailyActivity: activitiesRefetch → IMMEDIATE full sync');
      fetchPersonalSummary(true);
      fetchActivities();
    };

    const handleLoginSuccess = () => {
      console.log('✅ MyDailyActivity: Login success → sync (EXECUTIVE FIX)');
      setTimeout(() => {
        fetchPersonalSummary(true);
        fetchActivities();
      }, 500);  // Reduced delay - indexes make it fast
      console.log('🔄 MyDailyActivity: Post-login refetch (500ms + indexed)');
    };

    // Listen for QuickAction saves → INSTANT timeline update
    window.addEventListener('activitiesRefetch', handleActivitiesRefetch);
    window.addEventListener('loginSuccess', handleLoginSuccess);
    
    // Bonus: Listen for activity socket updates → optimistic UI
    const handleActivitySocketUpdate = () => {
      console.log('📡 MyDailyActivity: Socket activity → quick refetch');
      fetchPersonalSummary();
    };
    window.addEventListener('activitySocketUpdate', handleActivitySocketUpdate);

    return () => {
      window.removeEventListener('activitiesRefetch', handleActivitiesRefetch);
      window.removeEventListener('loginSuccess', handleLoginSuccess);
      window.removeEventListener('activitySocketUpdate', handleActivitySocketUpdate);
    };
    return () => {
      window.removeEventListener('activitiesRefetch', handleActivitiesRefetch);
      window.removeEventListener('loginSuccess', handleLoginSuccess);
    };
  }, [user?.id, fetchPersonalSummary, fetchActivities]);



  // Tab visibility refetch
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.id) {
        console.log('👁️ Tab focused → Force refetch for logout sync');
        handleRefresh();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [handleRefresh, user?.id]);

  // Loading timeout fallback
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        toast.warning('Loaded (timeout - retry refresh)');
      }
    }, 10000);
    return () => clearTimeout(timeout);
  }, [loading]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Activity className="w-16 h-16 animate-spin text-pastel-blue mx-auto mb-4" />
            <p className="text-lg">Loading my daily activity...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-pastel-blue/20 to-pastel-green/20 p-6 rounded-2xl border border-pastel-gray">
          <div>
<h1 className="text-4xl lg:text-5xl font-bold leading-[1.2] tracking-normal bg-gradient-to-r from-pastel-blue to-pastel-green bg-clip-text text-transparent py-2">              My Daily Activity
            </h1>
            <p className="text-xl text-muted-foreground mt-2">Track your work status, meetings, breaks and productivity</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="flex items-center gap-1 bg-pastel-pink/30 border-pastel-pink text-pastel-pink">
              <RefreshCw className="w-4 h-4 mr-1" />
              Live {liveActivities}
            </Badge>
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="border-pastel-gray hover:bg-pastel-blue/10 hover:border-pastel-blue"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Force Sync
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="max-w-sm mx-auto">
          <StaffProfileCard
            name={user?.name || user?.email || 'Executive'}
            role="EXECUTIVE"
            status={summaryData.loginTime && !summaryData.logoutTime ? 'online' : 'offline'}
            avatarUrl={user?.avatar}
          />
        </div>

        <Card className="border-pastel-gray shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Activity className="w-7 h-7 text-pastel-blue" />
              Quick Status Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QuickActionButtons />
          </CardContent>
        </Card>

        <Card className="border-pastel-gray shadow-xl">
          <CardHeader className="p-6">
            <div className="flex items-center justify-between">
              <CardTitle>Activity Timeline</CardTitle>
            </div>
          </CardHeader>
          <ActivityTimeline userId={user?.id} />
        </Card>

        <SummaryCard {...summaryData} />
      </div>
    </DashboardLayout>
  );
};

export default MyDailyActivity;

  