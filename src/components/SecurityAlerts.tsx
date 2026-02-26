import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Shield, X, Clock } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

interface SecurityAlert {
  id: string;
  type: 'failed_login' | 'unauthorized_access' | 'suspicious_activity' | 'password_change';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

const SecurityAlerts: React.FC = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);



  useEffect(() => {
    if (socket && user) {
      // Join security room
      socket.emit('join-security-room', user.id);

      // Listen for security alerts
      socket.on('security-alert', (data) => {
        const newAlert: SecurityAlert = {
          id: data.id || Date.now().toString(),
          type: data.type,
          title: data.title,
          message: data.message,
          severity: data.severity,
          timestamp: data.timestamp,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent
        };

        setAlerts(prev => [newAlert, ...prev.slice(0, 19)]); // Keep last 20 alerts
      });

      return () => {
        socket.off('security-alert');
      };
    }
  }, [socket, user]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-600 text-white border-red-600';
      case 'high':
        return 'bg-red-500 text-white border-red-500';
      case 'medium':
        return 'bg-yellow-500 text-white border-yellow-500';
      case 'low':
        return 'bg-blue-500 text-white border-blue-500';
      default:
        return 'bg-gray-500 text-white border-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="w-5 h-5 text-red-500" />
          Security Alerts
          {alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length} Critical
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] px-4">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Shield className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No security alerts</p>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border-2 ${
                    alert.severity === 'critical' || alert.severity === 'high'
                      ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                      : 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded ${getSeverityColor(alert.severity)}`}>
                        {getSeverityIcon(alert.severity)}
                      </div>
                      <h4 className="font-medium text-sm">{alert.title}</h4>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissAlert(alert.id)}
                      className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(alert.timestamp), 'HH:mm:ss')}
                    </div>
                    {alert.ipAddress && (
                      <span className="font-mono">{alert.ipAddress}</span>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={`mt-2 text-xs ${getSeverityColor(alert.severity)}`}
                  >
                    {alert.severity.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default SecurityAlerts;
