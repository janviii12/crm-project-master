import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axiosInstance from '@/lib/axiosInstance';
import SummaryCard from './SummaryCard';
import ActivityTimeline from './ActivityTimeline';

interface TodayStats {
  loginTime?: string;
  logoutTime?: string;
  totalWorkingHours: number;
  totalIdleTime: number;
  breakHours: number;
  productiveHours: number;
  todayActivities: number;
}

const StaffDashboard = () => {
  const { user } = useAuth() as any;
  const [stats, setStats] = useState<TodayStats>({
    loginTime: undefined,
    logoutTime: undefined,
    totalWorkingHours: 0,
    totalIdleTime: 0,
    breakHours: 0,
    productiveHours: 0,
    todayActivities: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?._id) {
      axiosInstance.get(`/api/activities/today-stats?userId=${user._id}`)
        .then(res => {
          if (res.data.success) {
            setStats(res.data.data);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user?._id]);

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8 p-6">
      <SummaryCard 
        loginTime={stats.loginTime}
        logoutTime={stats.logoutTime}
        totalWorkingHours={stats.totalWorkingHours}
        totalIdleTime={0} // Removed idle focus
        breakHours={stats.breakHours}
        productiveHours={stats.productiveHours}
        todayActivities={stats.todayActivities}
      />
      <ActivityTimeline userId={user?._id} />
    </div>
  );
};

export default StaffDashboard;

