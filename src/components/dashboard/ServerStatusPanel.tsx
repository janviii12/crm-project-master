import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Server, Database, Zap, Clock, Cpu, MemoryStick, Code, BarChart3, Activity } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';

interface ServerStatus {
  apiHealth: string;
  mongodbConnection: string;
  serverUptime: string;
  memoryUsage: string;
  cpuUsage: string;
  socketIOConnection: string;
  buildVersion: string;
}

interface ServerStats {
  timestamp: string;
  cpu: number;
  ram: number;
  apiLatency: number;
  uptime: string;
}

type ViewMode = 'status' | 'graph';
type MetricType = 'cpu' | 'ram' | 'apiLatency' | 'uptime';

const ServerStatusPanel = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [stats, setStats] = useState<ServerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('status');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('cpu');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { socket, isConnected } = useSocket();

  const fetchServerStatus = async () => {
    try {
      setRefreshing(true);
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/admin/server-status`);
      if (response.data.success) {
        setStatus(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch server status:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchServerStats = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/admin/server-stats`);
      if (response.data.success) {
        const newStat = response.data.data;
        setStats(prev => {
          const updated = [...prev, newStat];
          // Keep only last 50 data points
          return updated.slice(-50);
        });
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch server stats:', error);
    }
  };

  useEffect(() => {
    fetchServerStatus();
    fetchServerStats(); // Initial fetch

    // Listen for server status updates via Socket.IO
    if (socket && isConnected) {
      socket.on('server-status-update', (data: ServerStatus) => {
        setStatus(data);
      });

      // Request initial status
      socket.emit('request-server-status');
    }

    // Auto-refresh every 30 seconds for both status and stats
    const interval = setInterval(() => {
      fetchServerStatus();
      fetchServerStats();
    }, 30000);

    return () => {
      if (socket) {
        socket.off('server-status-update');
      }
      clearInterval(interval);
    };
  }, [socket, isConnected]);

  const getStatusColor = (value: string, type: string) => {
    if (type === 'connection' || type === 'health') {
      return value === 'connected' || value === 'healthy' ? '🟢' : '🔴';
    }
    if (type === 'usage') {
      const percent = parseInt(value.replace('%', ''));
      if (percent < 50) return '🟢';
      if (percent < 80) return '🟡';
      return '🔴';
    }
    return '🟢';
  };

  const statusCards = [
    {
      title: 'API Health',
      value: status?.apiHealth || 'Loading...',
      icon: Server,
      type: 'health'
    },
    {
      title: 'Database',
      value: status?.mongodbConnection || 'Loading...',
      icon: Database,
      type: 'connection'
    },
    {
      title: 'Socket.IO',
      value: status?.socketIOConnection || 'Loading...',
      icon: Zap,
      type: 'connection'
    },
    {
      title: 'Uptime',
      value: status?.serverUptime || 'Loading...',
      icon: Clock,
      type: 'uptime'
    },
    {
      title: 'Memory',
      value: status?.memoryUsage || 'Loading...',
      icon: MemoryStick,
      type: 'usage'
    },
    {
      title: 'CPU',
      value: status?.cpuUsage || 'Loading...',
      icon: Cpu,
      type: 'usage'
    },
    {
      title: 'Build Version',
      value: status?.buildVersion || 'Loading...',
      icon: Code,
      type: 'version'
    }
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            Server Status
          </CardTitle>
          <CardDescription>System health and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getMetricData = () => {
    return stats.map(stat => {
      // Convert uptime string to minutes for graphing
      const uptimeMinutes = convertUptimeToMinutes(stat.uptime);

      return {
        time: new Date(stat.timestamp).toLocaleTimeString(),
        cpu: stat.cpu,
        ram: stat.ram,
        apiLatency: stat.apiLatency,
        uptime: uptimeMinutes
      };
    });
  };

  const convertUptimeToMinutes = (uptimeString: string) => {
    // Parse uptime string like "1h 23m 45s" to total minutes
    const hours = uptimeString.match(/(\d+)h/) ? parseInt(uptimeString.match(/(\d+)h/)[1]) : 0;
    const minutes = uptimeString.match(/(\d+)m/) ? parseInt(uptimeString.match(/(\d+)m/)[1]) : 0;
    const seconds = uptimeString.match(/(\d+)s/) ? parseInt(uptimeString.match(/(\d+)s/)[1]) : 0;

    return hours * 60 + minutes + seconds / 60;
  };

  const getMetricColor = (value: number, type: MetricType) => {
    if (type === 'cpu' || type === 'ram') {
      if (value < 50) return '#22c55e'; // green
      if (value < 80) return '#eab308'; // yellow
      return '#ef4444'; // red
    }
    if (type === 'apiLatency') {
      if (value < 200) return '#22c55e'; // green
      if (value < 500) return '#eab308'; // yellow
      return '#ef4444'; // red
    }
    return '#3b82f6'; // blue for uptime
  };

  const getMetricLabel = (metric: MetricType) => {
    switch (metric) {
      case 'cpu': return 'CPU Usage (%)';
      case 'ram': return 'RAM Usage (%)';
      case 'apiLatency': return 'API Latency (ms)';
      case 'uptime': return 'Uptime';
      default: return metric;
    }
  };

  const getSecondsAgo = () => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);
    return diff;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              Server Status
              {user?.roles?.includes('admin') && !user?.roles?.includes('developer') && (
                <Badge variant="secondary" className="text-xs">
                  View Only
                </Badge>
              )}
            </CardTitle>
            <CardDescription>System health and performance metrics</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchServerStatus();
              fetchServerStats();
            }}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="status" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Status View
            </TabsTrigger>
            <TabsTrigger value="graph" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Graph View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {statusCards.map((card) => {
                const Icon = card.icon;
                const statusIndicator = getStatusColor(card.value, card.type);

                return (
                  <div
                    key={card.title}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      <Icon className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {card.title}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{statusIndicator}</span>
                        <p className="text-sm text-muted-foreground truncate">
                          {card.value}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="graph" className="mt-6">
            <div className="space-y-4">
              <Tabs value={selectedMetric} onValueChange={(value) => setSelectedMetric(value as MetricType)}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="cpu">CPU</TabsTrigger>
                  <TabsTrigger value="ram">RAM</TabsTrigger>
                  <TabsTrigger value="apiLatency">API Latency</TabsTrigger>
                  <TabsTrigger value="uptime">Uptime</TabsTrigger>
                </TabsList>

                <div className="mt-4 h-64">
                  {stats.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getMetricData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="time"
                          tick={{ fontSize: 12 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          domain={selectedMetric === 'apiLatency' ? [0, 'dataMax + 50'] : selectedMetric === 'uptime' ? [0, 'dataMax + 10'] : [0, 100]}
                        />
                        <Tooltip
                          labelFormatter={(label) => `Time: ${label}`}
                          formatter={(value: number | undefined) => [
                            `${value || 0}${selectedMetric === 'apiLatency' ? 'ms' : '%'}`,
                            getMetricLabel(selectedMetric)
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey={selectedMetric}
                          stroke={getMetricColor(Number(stats[stats.length - 1]?.[selectedMetric]) || 0, selectedMetric)}
                          fill={getMetricColor(Number(stats[stats.length - 1]?.[selectedMetric]) || 0, selectedMetric)}
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Collecting data...</p>
                        <p className="text-sm">Graphs will appear once data is available</p>
                      </div>
                    </div>
                  )}
                </div>
              </Tabs>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 text-xs text-muted-foreground text-center">
          {isConnected ? 'Real-time updates via Socket.IO' : 'Auto-refreshes every 30 seconds'} • Last updated: {getSecondsAgo()} seconds ago
        </div>
      </CardContent>
    </Card>
  );
};

export default ServerStatusPanel;
