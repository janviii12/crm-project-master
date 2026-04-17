import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ActivityTimeline from '@/components/staff/ActivityTimeline';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import axiosInstance from '@/lib/axiosInstance';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';

const AdminExecutiveActivity = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [executives, setExecutives] = useState([]);
  const [selectedExecutiveId, setSelectedExecutiveId] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Admin-only access
  useEffect(() => {
    if (!user?.roles?.includes('admin')) {
      toast.error('Admin access required');
      navigate('/dashboard');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchExecutives();
  }, []);

  const fetchExecutives = async () => {
    try {
      const response = await axiosInstance.get('/api/users/staff');
      console.log('Executives API:', response.data);
      if (response.data.success) {
        const staffList = response.data.data.filter((u) => u.roles.some(r => ['manager', 'executive'].includes(r)));
        setExecutives(staffList);
        toast.success(`Loaded ${staffList.length} staff`);
      }
    } catch (error) {
      console.error('Fetch executives:', error.response?.status);
      toast.error(`Error ${error.response?.status}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Staff Activity</h1>
          <p className="text-muted-foreground">Select executive for timeline</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select Staff</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select open={open} onOpenChange={setOpen}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Click to select..." />
              </SelectTrigger>
              <SelectContent className="w-[300px]">
                <div className="p-2 max-h-60 overflow-auto">
                  {executives.length === 0 ? (
                    <p className="text-muted-foreground text-sm p-2">No staff. Refresh.</p>
                  ) : (
                    executives.map((exec) => (
                      <div
                        key={exec._id}
                        className="cursor-pointer hover:bg-accent p-2 rounded-md text-sm flex items-center space-x-2"
                        onClick={() => {
                          setSelectedExecutiveId(exec._id);
                          setOpen(false);
                        }}
                      >
                        <span className="font-medium">{exec.name || exec.email}</span>
                        <span className="text-xs text-muted-foreground">({exec.roles.join(', ')})</span>
                      </div>
                    ))
                  )}
                </div>
              </SelectContent>
            </Select>
            <Button variant="outline" className="w-full" onClick={fetchExecutives}>
              Refresh
            </Button>
            <p className="text-xs text-muted-foreground">Count: {executives.length}</p>
          </CardContent>
        </Card>

        {selectedExecutiveId && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ActivityTimeline staffId={selectedExecutiveId} />
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminExecutiveActivity;