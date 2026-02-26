import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ActivityLogs from '@/components/ActivityLogs';
import SystemLogs from '@/components/SystemLogs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import axiosInstance from '../lib/axiosInstance';

interface Log {
  id: string;
  userRole: string;
  userName: string;
  userId: string;
  documentName: string;
  documentId: string;
  action: string;
  timestamp: string;
  ipAddress: string;
  deviceInfo: string;
}

const Logs = () => {
  const { user } = useAuth();
  const [view, setView] = useState<'activity' | 'system'>('activity');
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [error, setError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Developers can access system logs directly, but need password for activity logs
  const isDeveloper = user?.roles?.includes('developer');
  const isAdmin = user?.roles?.includes('admin');

  // Auto-authenticate developers for system logs
  useEffect(() => {
    if (isDeveloper && view === 'system') {
      setIsAuthenticated(true);
    } else if (view === 'activity') {
      // Reset authentication for activity logs
      setIsAuthenticated(false);
    }
  }, [isDeveloper, view]);
   
  const verifyPassword = async () => {
    if (!password.trim()) {
      setError('Password is required');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const response = await axiosInstance.post('/api/logs/verify', { password });

      if (response.data.success) {
        setIsAuthenticated(true);
        setShowPasswordDialog(false);
        setPassword('');
        toast.success('Access granted');
      } else {
        setError(response.data.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to verify password');
    } finally {
      setLoading(false);
    }
  };









  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto mt-20">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Admin Audit Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    Enter Audit Password
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Enter Audit Password</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter audit password"
                        onKeyPress={(e) => e.key === 'Enter' && verifyPassword()}
                      />
                    </div>
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <Button
                      onClick={verifyPassword}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Verify Password
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Audit Logs</h1>
            <p className="text-muted-foreground mt-2">View document access logs</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefreshTrigger(prev => prev + 1)}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsAuthenticated(false)}
            >
              Lock Access
            </Button>
          </div>
        </div>

        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setView('activity')}
            className={`px-4 py-2 rounded-md font-medium ${
              view === 'activity'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Activity Logs
          </button>
          {(user?.roles?.includes('admin') || user?.roles?.includes('developer')) && (
            <button
              onClick={() => setView('system')}
              className={`px-4 py-2 rounded-md font-medium ${
                view === 'system'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              System Logs
            </button>
          )}
        </div>

        {view === 'activity' ? <ActivityLogs refreshTrigger={refreshTrigger} /> : <SystemLogs refreshTrigger={refreshTrigger} />}
      </div>
    </DashboardLayout>
  );
};

export default Logs;
