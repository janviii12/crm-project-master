import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Zap } from 'lucide-react';
import axiosInstance from '@/lib/axiosInstance';
import { format, differenceInMinutes } from 'date-fns';
import { cn } from '@/lib/utils';

interface Activity {
  _id: string;
  activityType: string;
  timestamp: string;
  metadata?: {
    startTime?: string;
    endTime?: string;
    frontendStatus?: string;
    duration?: number;
  };
  userId: string;
}

const getActivityColor = (type: string) => {
  const colors: Record<string, string> = {
    login: 'bg-green-500',
    'lunch_start': 'bg-yellow-500',
    'meeting_start': 'bg-blue-500',
    'outside_work_start': 'bg-orange-500',
    logout: 'bg-gray-500'
  };
  return colors[type] || 'bg-gray-400';
};

const getCleanName = (type: string) => {
  return type
    .replace('_start', '')
    .replace('_end', '')
    .replace('login', 'Login')
    .replace('logout', 'Logout')
    .toUpperCase();
};

const ActivityTimeline: React.FC<{ userId?: string; staffId?: string }> = ({ userId, staffId }) => {
  const effectiveId = userId || staffId;
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showIdleTotal, setShowIdleTotal] = useState(false);
  const [totalIdleTime, setTotalIdleTime] = useState(0);

  // Filter & Pagination states
  const [fromDate, setFromDate] = useState<string | undefined>();
  const [toDate, setToDate] = useState<string | undefined>();
  const [activityTypeFilter, setActivityTypeFilter] = useState<'all' | string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [pagination, setPagination] = useState<{ page: number, pages: number, total: number, limit: number } | null>(null);

  const activityTypes = [
    { value: 'all', label: 'All Activities' },
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' },
    { value: 'lunch_start', label: 'Lunch Start' },
    { value: 'lunch_end', label: 'Lunch End' },
    { value: 'meeting_start', label: 'Meeting Start' },
    { value: 'meeting_end', label: 'Meeting End' },
    { value: 'outside_work_start', label: 'Outside Work Start' },
    { value: 'outside_work_end', label: 'Outside Work End' },
    // { value: 'idle_start', label: 'Idle Start' },
  ] as const;

  const { socket } = useSocket();

  // Build query params
  const getQueryParams = useCallback(() => {
    const params = new URLSearchParams({
      userId: effectiveId!,
      limit: itemsPerPage.toString(),
      page: currentPage.toString()
    });

    // DEBUG: Log effectiveId
    console.log('🔍 Timeline Debug - effectiveId:', effectiveId, 'user:', user?.id, 'roles:', user?.roles);

    // Executive self-view: SHOW ALL activities (removed restrictive filter)
    // if (user?.roles?.includes('executive') && effectiveId === user.id?.toString()) {
    //   params.append('activityType', 'non_interaction'); 
    // }

    if (fromDate) params.append('from_date', new Date(fromDate).toISOString());
    if (toDate) params.append('to_date', new Date(toDate).toISOString());
    if (activityTypeFilter !== 'all') params.append('activityType', activityTypeFilter);
    return params.toString();
  }, [effectiveId, user?.roles, user?.id, fromDate, toDate, activityTypeFilter, currentPage, itemsPerPage]);

  // Fetch activities
  const fetchActivities = useCallback(async () => {
    if (!effectiveId) return;
    setLoading(true);
    setError(null);
    try {
      const query = getQueryParams();
      const res = await axiosInstance.get(`/api/activities?${query}`);
      console.log('📊 Timeline API Response:', { effectiveId, query, data: res.data.data?.length || 0 });
      if (res.data.success) {
        setActivities(res.data.data || []);
        setPagination(res.data.pagination);
      }
    } catch (err: any) {
      setError('Failed to load activities');
    } finally {
      setLoading(false);
    }
  }, [effectiveId, getQueryParams]);

  // Fetch on mount and param changes
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [fromDate, toDate, activityTypeFilter]);

  // Idle summary removed

  // Socket real-time updates (prepend new activities)
  useEffect(() => {
    if (!socket || !effectiveId) return;

    socket.emit('join-activity-room', `activity_${effectiveId}`);

    socket.on('new-activity', (data: Activity) => {
      // Only add if matches current filters
      const activityDate = new Date(data.timestamp);
      const from = fromDate ? new Date(fromDate) : undefined;
      const to = toDate ? new Date(toDate) : undefined;
      const matchesFilter = (!from || activityDate >= from) && (!to || activityDate <= to);
      if (matchesFilter) {
        setActivities(prev => [data, ...prev]);
      }
    });

    socket.on('activity-updated', (data: any) => {
      setActivities(prev => prev.map(a => a._id === data._id ? { ...a, ...data } : a));
    });

    return () => {
      socket.emit('leave-activity-room', `activity_${effectiveId}`);
      socket.off('new-activity');
      socket.off('activity-updated');
    };
  }, [socket, effectiveId, fromDate, toDate]);

  const groupedByDate = useMemo<Record<string, Activity[]>>(() => {
    return activities
      .filter(a => !a.activityType.includes('logout'))
      .reduce((acc: any, activity) => {
        const date = new Date(activity.timestamp || activity.metadata?.startTime || Date.now());
        const dateStr = date.toLocaleDateString('en-GB', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        if (!acc[dateStr]) {
          acc[dateStr] = [];
        }
        acc[dateStr].push(activity);
        return acc;
      }, {} as Record<string, Activity[]>);
  }, [activities]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="animate-spin mx-auto h-8 w-8 mb-2" />
          <p>Loading activities...</p>
        </CardContent>
      </Card>
    );
  }



  return (
    <>
      {/* Filter Controls */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <div className="flex flex-col lg:flex-row gap-4 items-end justify-end">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">From Date</label>
            <input
              type="date"
              value={fromDate || ''}
              onChange={(e) => setFromDate(e.target.value || undefined)}
              className="h-10 px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">To Date</label>
            <input
              type="date"
              value={toDate || ''}
              onChange={(e) => setToDate(e.target.value || undefined)}
              className="h-10 px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Activity Type</label>
            <select
              value={activityTypeFilter}
              onChange={(e) => setActivityTypeFilter(e.target.value as 'all' | string)}
              className="h-10 px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
              disabled={loading}
            >
              {activityTypes
                .filter(
                  (type) =>
                    !['logout', 'lunch_end', 'meeting_end', 'outside_work_end'].includes(type.value)
                )
                .map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setFromDate(undefined);
                setToDate(undefined);
                setActivityTypeFilter('all');
              }}
              className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
              disabled={loading}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Card */}
      <Card className="max-h-[70vh] overflow-auto">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {Object.entries(groupedByDate)
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .map(([date, dateActivities]) => (
                <div key={date} className="pt-6 pb-4 first:pt-0">
                  <div className="flex items-center mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
                    <span className="text-xl mr-3">📅</span>
                    <h3 className="text-lg font-bold">{date}</h3>
                    <span className="ml-auto text-sm text-muted-foreground">
                      ({dateActivities.length} activities)
                    </span>
                  </div>
                  <div className="space-y-3 ml-8">
                    {dateActivities.map(activity => {
                      const startTime = new Date(activity.metadata?.startTime || activity.timestamp);
                      const endTime = activity.metadata?.endTime ? new Date(activity.metadata.endTime) : null;

                      const duration = activity.metadata?.duration ||
                        endTime && differenceInMinutes(endTime, startTime);

                      const durationText = duration
                        ? `${Math.floor(duration / 60)}h ${duration % 60}m`
                        : 'Ongoing';

                      return (
                        <div key={activity._id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className={cn(
                            getActivityColor(activity.activityType),
                            'w-3 h-3 rounded-full flex-shrink-0'
                          )} />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {getCleanName(activity.activityType)}
                            </div>
                            {activity.metadata?.frontendStatus && (
                              <div className="text-xs text-muted-foreground truncate">
                                {activity.metadata.frontendStatus}
                              </div>
                            )}
                          </div>
                          <div className="text-right min-w-[100px]">
                            <div className="text-sm font-mono">
                              {format(startTime, 'h:mm a')}
                            </div>
                            {endTime && (
                              <div className="text-xs text-muted-foreground">
                                {format(endTime, 'h:mm a')}
                              </div>
                            )}
                          </div>
                          <div className="text-right min-w-[80px] font-semibold text-green-600">
                            {durationText}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
          {Object.keys(groupedByDate).length === 0 && !loading && (
            <div className="p-12 text-center text-muted-foreground">
              <Zap className="mx-auto h-12 w-12 mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">No activities found</p>
              <p className="text-sm">
                {effectiveId
                  ? `User ${effectiveId.slice(-4)} has no logged activities`
                  : 'No user selected'}
              </p>
              {false && (
                <p className="text-xs mt-2 bg-blue-50 px-3 py-1 rounded-full">
                  💡 No activities? Check DB → db.useractivities.find()
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && (
        <div className="mt-6 flex justify-between items-center p-4 border-t">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={loading || currentPage === 1}
            className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {pagination.pages} • {activities.length} of {pagination.total} activities
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(pagination.pages || 1, p + 1))}
            disabled={loading || currentPage >= (pagination.pages || 1)}
            className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
};

export default ActivityTimeline;

